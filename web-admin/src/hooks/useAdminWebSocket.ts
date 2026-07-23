import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { getWsUrl } from '../utils/ws';

const WS_URL = getWsUrl();

export function useAdminWebSocket() {
  const { user } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const syncFromServer = useNotificationStore((s) => s.syncFromServer);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!user) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        syncFromServer();

        client.subscribe('/topic/admin', (message) => {
          try {
            const data = JSON.parse(message.body);
            handleEvent(data, addNotification);
          } catch {}
        });

        client.subscribe('/topic/city/*', (message) => {
          try {
            const data = JSON.parse(message.body);
            handleEvent(data, addNotification);
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
  }, [user?.id, addNotification, syncFromServer]);

  return null;
}

function handleEvent(data: any, add: (n: any) => void) {
  const eventType = data.type;
  const payload = data.payload || {};
  const requestId = data.requestId;

  const titleMap: Record<string, string> = {
    REQUEST_CREATED: 'طلب جديد',
    REQUEST_SUBMITTED: 'تم تقديم طلب',
    QUOTE_GENERATED: 'عرض سعر جديد',
    OFFER_ACCEPTED: 'تم قبول العرض',
    QUOTE_REJECTED: 'تم رفض عرض',
    STATUS_UPDATED: 'تحديث الحالة',
    SERVICE_STARTED: 'بدء الخدمة',
    SERVICE_COMPLETED: 'اكتملت الخدمة',
    REPORT_SUBMITTED: 'تقرير الفحص',
    REPORT_APPROVED: 'تم اعتماد التقرير',
    INVOICE_CREATED: 'فاتورة جديدة',
    PAYMENT_HELD: 'تم حجز الدفع',
    PAYMENT_RELEASED: 'تم صرف الدفع',
    ADMIN_OVERRIDE: 'تحديث من المدير',
    REQUEST_CANCELLED: 'تم إلغاء الطلب',
  };

  add({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: eventType?.includes('PAYMENT') ? 'payment' : eventType?.includes('STATUS') ? 'status' : 'request',
    title: titleMap[eventType] || 'إشعار',
    body: buildBody(eventType, payload),
    requestId,
    eventType,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

function buildBody(eventType: string, payload: any): string {
  switch (eventType) {
    case 'REQUEST_CREATED':
    case 'REQUEST_SUBMITTED':
      return payload.serviceName ? `طلب ${payload.serviceName}` : 'طلب جديد';
    case 'QUOTE_GENERATED':
      return payload.price ? `عرض سعر ${payload.price} ريال` : 'تم إرسال عرض سعر';
    case 'OFFER_ACCEPTED':
      return payload.workshopName ? `تم قبول عرض ${payload.workshopName}` : 'تم قبول العرض';
    case 'QUOTE_REJECTED':
      return 'تم رفض عرض السعر';
    case 'STATUS_UPDATED':
      return payload.status ? `الحالة: ${payload.status}` : 'تم تحديث حالة الطلب';
    case 'SERVICE_STARTED':
      return 'بدأ العمل على الخدمة';
    case 'SERVICE_COMPLETED':
      return 'اكتملت الخدمة';
    case 'REPORT_SUBMITTED':
      return 'تم تقديم تقرير الفحص';
    case 'REPORT_APPROVED':
      return 'تم اعتماد تقرير الفحص';
    case 'INVOICE_CREATED':
      return 'تم إصدار فاتورة';
    case 'PAYMENT_HELD':
      return payload.amount ? `تم حجز ${payload.amount} ريال` : 'تم حجز المبلغ';
    case 'PAYMENT_RELEASED':
      return 'تم صرف المبلغ للورشة';
    case 'REQUEST_CANCELLED':
      return 'تم إلغاء الطلب';
    default:
      return 'حدث تغيير على النظام';
  }
}
