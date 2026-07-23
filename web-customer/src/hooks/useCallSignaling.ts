import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '../stores/authStore';
import { useCallStore } from '../stores/callStore';
import { getWsUrl } from '../utils/ws';

const WS_URL = getWsUrl();
const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useCallSignaling() {
  const customer = useAuthStore((s) => s.customer);
  const store = useCallStore();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const stompRef = useRef<Client | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    const el = document.getElementById('remote-audio');
    if (el) el.remove();
  }, []);

  const publish = useCallback((destination: string, body: any) => {
    if (stompRef.current?.connected) {
      stompRef.current.publish({ destination, body: JSON.stringify(body) });
    }
  }, []);

  const getOrCreatePC = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && store.peerId) {
        publish('/app/call/candidate', { targetId: store.peerId, userId: customer?.id, candidate: JSON.stringify(e.candidate) });
      }
    };

    pc.ontrack = (e) => {
      const audio = document.createElement('audio');
      audio.srcObject = e.streams[0];
      audio.autoplay = true;
      audio.id = 'remote-audio';
      document.body.appendChild(audio);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        store.setStatus('active');
        durationRef.current = setInterval(() => {
          useCallStore.setState(s => ({ duration: s.duration + 1 }));
        }, 1000);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [customer?.id, store.peerId, publish]);

  const startCall = useCallback(async (calleeId: number, calleeName: string, requestId?: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = getOrCreatePC();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      store.setPeerId(calleeId);
      store.setPeerName(calleeName);
      store.setStatus('ringing');
      store.setIsOutgoing(true);

      publish('/app/call/offer', {
        callerId: customer?.id,
        calleeId,
        callerRole: 'customer',
        callerName: customer?.name || '',
        requestId: requestId || 0,
        sdp: JSON.stringify(offer),
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      store.reset();
    }
  }, [getOrCreatePC, customer, publish, store]);

  const answerCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = getOrCreatePC();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      store.setStatus('connecting');

      publish('/app/call/answer', {
        callSessionId: store.callSessionId,
        calleeId: customer?.id,
        sdp: JSON.stringify(answer),
      });
    } catch (err) {
      console.error('Failed to answer:', err);
      rejectCall();
    }
  }, [getOrCreatePC, customer?.id, store.callSessionId, publish, store]);

  const rejectCall = useCallback(() => {
    publish('/app/call/reject', { callSessionId: store.callSessionId, calleeId: customer?.id });
    cleanup();
    store.reset();
  }, [publish, store.callSessionId, customer?.id, cleanup, store]);

  const hangUp = useCallback(() => {
    publish('/app/call/hangup', { callSessionId: store.callSessionId, userId: customer?.id });
    cleanup();
    store.reset();
  }, [publish, store.callSessionId, customer?.id, cleanup, store]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) track.enabled = !track.enabled;
    }
  }, []);

  const toggleSpeaker = useCallback(async () => {
    const next = !useCallStore.getState().isSpeakerOn;
    useCallStore.setState({ isSpeakerOn: next });
    const audio = document.getElementById('remote-audio') as HTMLAudioElement | null;
    if (!audio) return;
    if ('setSinkId' in audio) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        if (next && audioOutputs.length > 1) {
          const speaker = audioOutputs.find(d => /speaker|external|phone/i.test(d.label)) || audioOutputs[1];
          await (audio as any).setSinkId(speaker.deviceId);
        } else if (audioOutputs.length > 0) {
          await (audio as any).setSinkId(audioOutputs[0].deviceId);
        }
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (!customer?.id) return;

    const handleVoipCall = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.calleeId) {
        startCall(detail.calleeId, detail.calleeName, detail.requestId);
      }
    };
    document.addEventListener('voip-call', handleVoipCall);

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/call/${customer.id}`, (message) => {
          const data = JSON.parse(message.body);
          switch (data.type) {
            case 'call_offer':
              useCallStore.setState({
                status: 'ringing', callSessionId: data.callSessionId,
                peerId: data.callerId, peerName: data.callerName || '',
                peerRole: data.callerRole || 'workshop', isOutgoing: false, duration: 0,
              });
              if (data.sdp) {
                getOrCreatePC().setRemoteDescription(new RTCSessionDescription(JSON.parse(data.sdp)));
              }
              break;
            case 'call_answer':
              store.setStatus('connecting');
              if (data.sdp && pcRef.current) {
                pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.sdp)));
              }
              break;
            case 'call_candidate':
              if (data.candidate && pcRef.current) {
                pcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(data.candidate)));
              }
              break;
            case 'call_rejected': case 'call_ended': case 'call_cancelled':
              cleanup();
              store.setStatus('ended');
              setTimeout(() => store.reset(), 2000);
              break;
          }
        });
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      document.removeEventListener('voip-call', handleVoipCall);
      cleanup();
    };
  }, [customer?.id]);

  return { startCall, answerCall, rejectCall, hangUp, toggleMute, toggleSpeaker };
}
