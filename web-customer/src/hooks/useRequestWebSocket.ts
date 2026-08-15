import { useCallback, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

import { getWsUrl } from '../utils/ws';

const WS_URL = getWsUrl();

/**
 * Keeps an open request page in sync with server-side request events.
 * User-facing notifications are deliberately handled by useCustomerWebSocket,
 * otherwise the same event produces two alerts while this page is open.
 */
export function useRequestWebSocket(
  requestId: number | undefined,
  onEvent?: (type: string, payload: any) => void,
) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!requestId) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe(`/topic/request/${requestId}`, (message) => {
          try {
            const data = JSON.parse(message.body);
            onEvent?.(data.type, data.payload || {});
          } catch {
            // Ignore malformed events and keep the live connection active.
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers.message);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      void client.deactivate();
      clientRef.current = null;
    };
  }, [requestId, onEvent]);

  const disconnect = useCallback(() => {
    void clientRef.current?.deactivate();
  }, []);

  return { disconnect };
}
