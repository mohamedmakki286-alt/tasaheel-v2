import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { playNotificationSound } from '../services/notificationSound';
import { getWsUrl } from '../utils/ws';
import i18n from '../i18n/i18n';

const WS_URL = getWsUrl();

function handleEvent(data: any, add: (n: any) => void) {
  const eventType = data.type;
  const payload = data.payload || {};
  const requestId = data.requestId;

  const title = i18n.t('websocket.event.' + eventType, { defaultValue: i18n.t('websocket.defaultTitle') });
  const body = buildBody(eventType, payload);

  add({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: notificationType(eventType),
    title,
    body,
    requestId,
    eventType,
    read: false,
    createdAt: new Date().toISOString(),
  });

  playNotificationSound(eventType);
}

function buildBody(eventType: string, payload: any): string {
  switch (eventType) {
    case 'REQUEST_SUBMITTED':
    case 'REQUEST_CREATED': {
      const services = payload.serviceTypes ? (Array.isArray(payload.serviceTypes) ? payload.serviceTypes.join(', ') : payload.serviceTypes) : '';
      return services || i18n.t('websocket.body.newRequestSimple');
    }
    case 'REQUEST_CANCELLED':
      return i18n.t('websocket.body.cancelledByCustomer');
    case 'QUOTE_ACCEPTED':
    case 'OFFER_ACCEPTED':
      return payload.price ? i18n.t('websocket.body.quoteAccepted', { price: payload.price }) : i18n.t('websocket.body.quoteAcceptedSimple');
    case 'QUOTE_REJECTED':
      return i18n.t('websocket.body.quoteRejected');
    case 'STATUS_UPDATED':
      return payload.status ? i18n.t('websocket.body.statusUpdated', { status: payload.status }) : i18n.t('websocket.body.statusUpdatedSimple');
    case 'SERVICE_STARTED':
      return i18n.t('websocket.body.serviceStarted');
    case 'SERVICE_COMPLETED':
      return i18n.t('websocket.body.serviceCompleted');
    case 'REPORT_SUBMITTED':
      return i18n.t('websocket.body.reportSubmitted');
    case 'REPORT_APPROVED':
      return i18n.t('websocket.body.reportApproved');
    case 'REPORT_REJECTED':
      return i18n.t('websocket.body.reportRejected');
    case 'INVOICE_APPROVED':
      return i18n.t('websocket.body.invoiceApproved');
    case 'PAYMENT_RELEASED':
      return i18n.t('websocket.body.paymentReleased');
    default:
      return '';
  }
}

function notificationType(eventType: string): 'request' | 'quote' | 'review' {
  if (eventType === 'REQUEST_SUBMITTED' || eventType === 'REQUEST_CREATED' || eventType === 'REQUEST_CANCELLED' || eventType === 'STATUS_UPDATED') return 'request';
  if (eventType.includes('QUOTE') || eventType.includes('OFFER')) return 'quote';
  return 'request';
}

export function useTechnicianWebSocket() {
  const technician = useAuthStore((s) => s.technician);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const syncFromServer = useNotificationStore((s) => s.syncFromServer);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!technician?.workshopId) return;

    const workshopId = technician.workshopId;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        syncFromServer();

        client.subscribe(`/topic/workshop/${workshopId}`, (message) => {
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
  }, [technician?.workshopId, addNotification, syncFromServer]);

  return null;
}
