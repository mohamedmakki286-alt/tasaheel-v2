import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import toast from 'react-hot-toast';
import i18n from '../i18n/i18n';

import { getWsUrl } from '../utils/ws';

const WS_URL = getWsUrl();

export function useRequestWebSocket(requestId: number | undefined, onEvent?: (type: string, payload: any) => void) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!requestId) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        const topic = `/topic/request/${requestId}`;
        client.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            const eventType = data.type;
            const payload = data.payload || {};

            const eventMap: Record<string, string> = {
              QUOTE_GENERATED: i18n.t('websocket.quoteGenerated'),
              OFFER_ACCEPTED: i18n.t('websocket.offerAccepted'),
              STATUS_UPDATED: i18n.t('websocket.statusUpdated'),
              SERVICE_STARTED: i18n.t('websocket.serviceStarted'),
              SERVICE_COMPLETED: i18n.t('websocket.serviceCompleted'),
              REPORT_SUBMITTED: i18n.t('websocket.reportSubmitted'),
              REPORT_APPROVED: i18n.t('websocket.reportApproved'),
              JOB_SPLIT_CREATED: i18n.t('websocket.jobSplitCreated'),
              PAYMENT_HELD: i18n.t('websocket.paymentHeld'),
              PAYMENT_RELEASED: i18n.t('websocket.paymentReleased'),
              REQUEST_CANCELLED: i18n.t('websocket.requestCancelled'),
            };

            const msg = eventMap[eventType];
            if (msg) {
              toast(msg, { icon: '🔔', duration: 4000 });
            }

            if (onEvent) {
              onEvent(eventType, payload);
            }
          } catch {}
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [requestId, onEvent]);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
  }, []);

  return { disconnect };
}
