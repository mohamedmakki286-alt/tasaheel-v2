import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { useCallStore } from './callStore';
import { useWebRTCCall } from './useWebRTCCall';
import { getWsUrl } from '../utils/ws';
import { fetchCallParticipants } from '../utils/apiClient';
import type { UserRole } from './types';

const WS_URL = getWsUrl();

interface UseCallSignalingOptions {
  userId: number | string;
  userName: string;
  userRole: UserRole;
  token: string;
}

interface CallParticipants {
  requestId: number;
  customerId: number;
  customerName: string;
  assignedTechnicianId: number | null;
  technicianName: string | null;
  workshopId: number | null;
  workshopName: string | null;
  canCall: boolean;
  denialReason: string | null;
}

export function useCallSignaling({ userId, userName, userRole, token }: UseCallSignalingOptions) {
  const stompRef = useRef<Client | null>(null);
  const store = useCallStore();

  const publish = useCallback(
    (destination: string, body: any) => {
      if (stompRef.current?.connected) {
        stompRef.current.publish({ destination, body: JSON.stringify(body) });
      }
    },
    [],
  );

  const onIceCandidate = useCallback(
    (candidate: RTCIceCandidate) => {
      const { callSessionId, peerId } = useCallStore.getState();
      if (callSessionId && peerId) {
        publish('/app/call/candidate', {
          callSessionId,
          userId,
          candidate: JSON.stringify(candidate),
        });
      }
    },
    [userId, publish],
  );

  const rtc = useWebRTCCall(onIceCandidate, token);

  const resolveParticipants = useCallback(async (requestId: number): Promise<CallParticipants | null> => {
    return fetchCallParticipants(requestId, token);
  }, [token]);

  const startCall = useCallback(
    async (calleeId: number | string, calleeName: string, requestId: number) => {
      try {
        const participants = await resolveParticipants(requestId);

        if (!participants) {
          console.error('Could not resolve call participants');
          return;
        }

        if (!participants.canCall) {
          console.warn('Cannot call:', participants.denialReason);
          return;
        }

        let resolvedCalleeId: number | string;
        let resolvedCalleeName: string;

        const uid = Number(userId);

        if (userRole === 'customer' && participants.assignedTechnicianId) {
          resolvedCalleeId = participants.assignedTechnicianId;
          resolvedCalleeName = participants.technicianName || calleeName;
        } else if (userRole === 'technician' && participants.customerId) {
          resolvedCalleeId = participants.customerId;
          resolvedCalleeName = participants.customerName || calleeName;
        } else if (userRole === 'workshop') {
          if (participants.assignedTechnicianId) {
            resolvedCalleeId = participants.assignedTechnicianId;
            resolvedCalleeName = participants.technicianName || calleeName;
          } else if (participants.customerId) {
            resolvedCalleeId = participants.customerId;
            resolvedCalleeName = participants.customerName || calleeName;
          } else {
            console.error('No valid callee for workshop');
            return;
          }
        } else {
          resolvedCalleeId = calleeId;
          resolvedCalleeName = calleeName;
        }

        if (!resolvedCalleeId) {
          console.error('Could not determine callee');
          return;
        }

        await rtc.addLocalStream();
        const offer = await rtc.createOffer();

        store.setPeerId(resolvedCalleeId);
        store.setPeerName(resolvedCalleeName);
        store.setStatus('ringing');
        store.setIsOutgoing(true);

        publish('/app/call/offer', {
          calleeId: resolvedCalleeId,
          requestId,
          callerName: userName,
          sdp: JSON.stringify(offer),
        });
      } catch (err) {
        console.error('Failed to start call:', err);
        store.reset();
      }
    },
    [rtc, userName, publish, store, userId, userRole, resolveParticipants],
  );

  const answerCall = useCallback(async () => {
    try {
      await rtc.addLocalStream();
      const answer = await rtc.createAnswer();
      const { callSessionId } = useCallStore.getState();

      store.setStatus('connecting');

      publish('/app/call/answer', {
        callSessionId,
        sdp: JSON.stringify(answer),
      });
    } catch (err) {
      console.error('Failed to answer:', err);
      rejectCall();
    }
  }, [rtc, publish, store]);

  const rejectCall = useCallback(() => {
    const { callSessionId } = useCallStore.getState();
    publish('/app/call/reject', { callSessionId });
    rtc.cleanup();
    store.reset();
  }, [publish, rtc, store]);

  const hangUp = useCallback(() => {
    const { callSessionId } = useCallStore.getState();
    publish('/app/call/hangup', { callSessionId });
    rtc.cleanup();
    store.reset();
  }, [publish, rtc, store]);

  const cancelCall = useCallback(() => {
    const { callSessionId } = useCallStore.getState();
    publish('/app/call/cancel', { callSessionId });
    rtc.cleanup();
    store.reset();
  }, [publish, rtc, store]);

  useEffect(() => {
    if (!userId) return;

    const checkPending = setInterval(() => {
      const pending = useCallStore.getState().pendingCall;
      if (pending) {
        useCallStore.setState({ pendingCall: null });
        startCall(pending.calleeId, pending.calleeName, pending.requestId);
      }
    }, 100);

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onStompError: (frame) => {
        console.error('Call STOMP error:', frame.headers['message']);
      },
      onWebSocketError: (event) => {
        console.warn('Call WebSocket error:', event);
      },
      onConnect: () => {
        client.subscribe('/user/queue/calls', (message) => {
          const data = JSON.parse(message.body);
          switch (data.type) {
            case 'call_offer':
              useCallStore.setState({
                status: 'ringing',
                callSessionId: data.callSessionId,
                peerId: data.callerId,
                peerName: data.callerName || '',
                peerRole: data.callerRole || 'customer',
                isOutgoing: false,
                duration: 0,
              });
              if (data.sdp) {
                rtc.setRemoteDescription(data.sdp);
              }
              break;
            case 'call_answer':
              store.setStatus('connecting');
              if (data.sdp) {
                rtc.setRemoteDescription(data.sdp);
              }
              break;
            case 'call_candidate':
              if (data.candidate) {
                rtc.addIceCandidate(data.candidate);
              }
              break;
            case 'call_rejected':
            case 'call_ended':
            case 'call_cancelled':
              rtc.cleanup();
              store.setStatus('ended');
              setTimeout(() => store.reset(), 2000);
              break;
            case 'call_error':
              console.warn('Call error:', data.error);
              rtc.cleanup();
              store.reset();
              break;
          }
        });
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      clearInterval(checkPending);
      client.deactivate();
      rtc.cleanup();
    };
  }, [userId, token]);

  return { startCall, answerCall, rejectCall, hangUp, cancelCall, toggleMute: rtc.toggleMute, toggleSpeaker: rtc.toggleSpeaker };
}
