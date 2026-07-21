import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { playNotificationSound } from '../services/notificationSound';
import { registerPushNotifications } from '../services/pushNotifications';
import i18n from '../i18n/i18n';

import { getWsUrl } from '../utils/ws';

const WS_URL = getWsUrl();

export function useCustomerWebSocket() {
  const { customer } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!customer) return;

    registerPushNotifications(customer.id);

    const clientId = customer.id;
    const city = customer.city;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (clientId) {
          client.subscribe(`/topic/customer/${clientId}`, (message) => {
            try {
              const data = JSON.parse(message.body);
              handleEvent(data, addNotification);
            } catch {}
          });
        }

        if (city) {
          client.subscribe(`/topic/city/${city}`, (message) => {
            try {
              const data = JSON.parse(message.body);
              handleEvent(data, addNotification);
            } catch {}
          });
        }
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
  }, [customer?.id, customer?.city, addNotification]);

  return null;
}

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
    case 'QUOTE_GENERATED':
      if (payload.price) {
        return i18n.t('websocket.body.quoteReceived', { price: payload.price });
      }
      return i18n.t('websocket.body.quoteReceivedSimple');
    case 'OFFER_ACCEPTED':
      if (payload.workshopName) {
        return i18n.t('websocket.body.offerAccepted', { workshop: payload.workshopName });
      }
      return i18n.t('websocket.body.offerAcceptedSimple');
    case 'QUOTE_REJECTED':
      return i18n.t('websocket.body.quoteRejected');
    case 'STATUS_UPDATED': {
      if (payload.status) {
        const status = i18n.t('constants.requestStatuses.' + payload.status, payload.status);
        return i18n.t('websocket.body.statusUpdated', { status });
      }
      return i18n.t('websocket.body.statusUpdatedSimple');
    }
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
    case 'JOB_SPLIT_CREATED':
      return i18n.t('websocket.body.jobSplitCreated');
    case 'PAYMENT_HELD':
      if (payload.amount) {
        return i18n.t('websocket.body.paymentHeld', { amount: payload.amount });
      }
      return i18n.t('websocket.body.paymentHeldSimple');
    case 'PAYMENT_RELEASED':
      return i18n.t('websocket.body.paymentReleased');
    case 'REQUEST_CANCELLED':
      return i18n.t('websocket.body.requestCancelled');
    default:
      return '';
  }
}

function notificationType(eventType: string): 'request' | 'payment' | 'status' {
  if (eventType.includes('PAYMENT') || eventType.includes('INVOICE')) return 'payment';
  if (eventType.includes('QUOTE') || eventType.includes('OFFER')) return 'request';
  return 'status';
}
