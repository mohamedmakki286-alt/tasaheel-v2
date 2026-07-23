import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import toast from 'react-hot-toast';
import i18n from '../i18n/i18n';

import { getWsUrl } from '../utils/ws';

const WS_URL = getWsUrl();

export function useRequestWebSocket(requestId: string | undefined, onEvent?: (type: string, payload: any) => void) {
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

            if (eventMap[eventType]) {
              const msg = i18n.t('websocket.toast.' + eventType, { defaultValue: eventMap[eventType] });
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

const eventMap: Record<string, string> = {
  QUOTE_GENERATED: 'تم إرسال عرض السعر بنجاح',
  QUOTE_ACCEPTED: 'تم قبول عرض السعر',
  QUOTE_REJECTED: 'تم رفض عرض السعر',
  OFFER_ACCEPTED: 'تم قبول العرض',
  STATUS_UPDATED: 'تم تحديث حالة الطلب',
  SERVICE_STARTED: 'بدأت الخدمة',
  SERVICE_COMPLETED: 'اكتملت الخدمة',
  REPORT_SUBMITTED: 'تم تقديم تقرير الفحص',
  REPORT_APPROVED: 'تم اعتماد تقرير الفحص',
  REPORT_REJECTED: 'تم رفض تقرير الفحص',
  INVOICE_CREATED: 'تم إنشاء الفاتورة',
  INVOICE_APPROVED: 'تم اعتماد الفاتورة',
  PAYMENT_HELD: 'تم حجز المبلغ',
  PAYMENT_RELEASED: 'تم صرف المبلغ',
  REQUEST_CANCELLED: 'تم إلغاء الطلب',
  JOB_SPLIT_CREATED: 'تم توزيع الطلب على الورش',
};
