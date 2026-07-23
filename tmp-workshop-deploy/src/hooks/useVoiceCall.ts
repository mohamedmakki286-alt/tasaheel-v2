import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

import { getWsUrl } from '../utils/ws';

const WS_URL = getWsUrl();
const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'active' | 'ended';

interface CallState {
  status: CallStatus;
  callSessionId: number | null;
  peerId: number | null;
  peerName: string;
  duration: number;
  isOutgoing: boolean;
}

export interface VoiceCallHook {
  callState: CallState;
  startCall: (calleeId: number, calleeName: string, requestId?: number) => void;
  answerCall: () => void;
  rejectCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}

export function useVoiceCall(
  userId: number,
  userName: string,
  userRole: 'customer' | 'workshop',
  stompClient: Client | null
): VoiceCallHook {
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    callSessionId: null,
    peerId: null,
    peerName: '',
    duration: 0,
    isOutgoing: false,
  });
  const [isMuted, setIsMuted] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callSessionIdRef = useRef<number | null>(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && stompClient?.connected) {
        const peerId = callState.peerId;
        if (peerId) {
          stompClient.publish({
            destination: '/app/call/candidate',
            body: JSON.stringify({
              targetId: peerId,
              userId,
              candidate: JSON.stringify(event.candidate),
            }),
          });
        }
      }
    };

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      audio.id = 'remote-audio';
      document.body.appendChild(audio);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState((prev) => ({ ...prev, status: 'active' }));
        startDurationTimer();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        hangUp();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [stompClient, userId, callState.peerId]);

  const startDurationTimer = useCallback(() => {
    durationIntervalRef.current = setInterval(() => {
      setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const cleanupCall = useCallback(() => {
    stopDurationTimer();

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    remoteStreamRef.current = null;

    const remoteAudio = document.getElementById('remote-audio');
    if (remoteAudio) remoteAudio.remove();
  }, [stopDurationTimer]);

  const startCall = useCallback(async (calleeId: number, calleeName: string, requestId?: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setCallState({
        status: 'ringing',
        callSessionId: null,
        peerId: calleeId,
        peerName: calleeName,
        duration: 0,
        isOutgoing: true,
      });

      if (stompClient?.connected) {
        stompClient.publish({
          destination: '/app/call/offer',
          body: JSON.stringify({
            callerId: userId,
            calleeId,
            callerRole: userRole,
            callerName: userName,
            requestId: requestId || 0,
            sdp: JSON.stringify(offer),
          }),
        });
      }
    } catch (err) {
      console.error('Failed to start call:', err);
      setCallState((prev) => ({ ...prev, status: 'ended' }));
    }
  }, [stompClient, userId, userName, userRole, createPeerConnection]);

  const answerCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = peerConnectionRef.current || createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setCallState((prev) => ({ ...prev, status: 'connecting' }));

      if (stompClient?.connected && callSessionIdRef.current) {
        stompClient.publish({
          destination: '/app/call/answer',
          body: JSON.stringify({
            callSessionId: callSessionIdRef.current,
            calleeId: userId,
            sdp: JSON.stringify(answer),
          }),
        });
      }
    } catch (err) {
      console.error('Failed to answer call:', err);
      rejectCall();
    }
  }, [stompClient, userId, createPeerConnection]);

  const rejectCall = useCallback(() => {
    if (stompClient?.connected && callSessionIdRef.current) {
      stompClient.publish({
        destination: '/app/call/reject',
        body: JSON.stringify({
          callSessionId: callSessionIdRef.current,
          calleeId: userId,
        }),
      });
    }
    cleanupCall();
    callSessionIdRef.current = null;
    setCallState({ status: 'idle', callSessionId: null, peerId: null, peerName: '', duration: 0, isOutgoing: false });
  }, [stompClient, userId, cleanupCall]);

  const hangUp = useCallback(() => {
    if (stompClient?.connected && callSessionIdRef.current) {
      stompClient.publish({
        destination: '/app/call/hangup',
        body: JSON.stringify({
          callSessionId: callSessionIdRef.current,
          userId,
        }),
      });
    }
    cleanupCall();
    callSessionIdRef.current = null;
    setCallState({ status: 'idle', callSessionId: null, peerId: null, peerName: '', duration: 0, isOutgoing: false });
  }, [stompClient, userId, cleanupCall]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Listen for incoming call signaling
  useEffect(() => {
    if (!stompClient?.connected) return;

    const subscription = stompClient.subscribe(`/topic/call/${userId}`, (message) => {
      try {
        const data = JSON.parse(message.body);

        switch (data.type) {
          case 'call_offer': {
            callSessionIdRef.current = data.callSessionId;
            setCallState({
              status: 'ringing',
              callSessionId: data.callSessionId,
              peerId: data.callerId,
              peerName: data.callerName || '',
              duration: 0,
              isOutgoing: false,
            });

            // Set remote description
            if (peerConnectionRef.current && data.sdp) {
              const offer = JSON.parse(data.sdp);
              peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
            }
            break;
          }

          case 'call_answer': {
            setCallState((prev) => ({ ...prev, status: 'connecting' }));
            if (peerConnectionRef.current && data.sdp) {
              const answer = JSON.parse(data.sdp);
              peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
            break;
          }

          case 'call_candidate': {
            if (peerConnectionRef.current && data.candidate) {
              const candidate = JSON.parse(data.candidate);
              peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
            break;
          }

          case 'call_rejected':
          case 'call_ended':
          case 'call_cancelled': {
            cleanupCall();
            callSessionIdRef.current = null;
            setCallState({
              status: 'ended',
              callSessionId: null,
              peerId: null,
              peerName: '',
              duration: data.duration || 0,
              isOutgoing: false,
            });
            setTimeout(() => {
              setCallState({ status: 'idle', callSessionId: null, peerId: null, peerName: '', duration: 0, isOutgoing: false });
            }, 2000);
            break;
          }
        }
      } catch (err) {
        console.error('Call signaling error:', err);
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanupCall();
    };
  }, [stompClient?.connected, userId, cleanupCall]);

  return {
    callState,
    startCall,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
    isMuted,
  };
}
