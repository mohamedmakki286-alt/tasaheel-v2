import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications, type Token } from '@capacitor/push-notifications';
import client from '../api/client';
import { playNotificationSound } from './notificationSound';

const ALERT_CHANNEL_ID = 'tasaheel_alerts';
let registrationPromise: Promise<void> | null = null;
let listenersReady = false;
let tokenOwner: 'workshop' | 'technician' = 'workshop';
const recentAlerts = new Map<string, number>();

async function configureNotificationChannel() {
  const channel = {
    id: ALERT_CHANNEL_ID,
    name: 'تنبيهات تساهيل',
    description: 'تنبيهات الطلبات والمحادثات وتحديثات الورشة',
    importance: 5 as const,
    visibility: 1 as const,
    sound: 'default',
    vibration: true,
  };
  await Promise.all([
    PushNotifications.createChannel(channel),
    LocalNotifications.createChannel(channel),
  ]);
}

function shouldDisplay(eventType: string, requestId?: string) {
  const now = Date.now();
  const key = `${eventType}:${requestId || 'general'}`;
  const previous = recentAlerts.get(key) || 0;
  for (const [storedKey, timestamp] of recentAlerts) {
    if (now - timestamp > 10_000) recentAlerts.delete(storedKey);
  }
  if (now - previous < 5_000) return false;
  recentAlerts.set(key, now);
  return true;
}

export async function registerPushNotifications(
  _ownerId: string,
  owner: 'workshop' | 'technician' = 'workshop',
) {
  if (!Capacitor.isNativePlatform()) return;
  if (tokenOwner !== owner) registrationPromise = null;
  tokenOwner = owner;
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    try {
      if (!listenersReady) {
        listenersReady = true;
        await PushNotifications.addListener('registration', (token: Token) => {
          sendTokenToBackend(token.value).catch(() => {});
        });
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          const data = notification.data || {};
          const eventType = String(data.eventType || data.type || 'STATUS_UPDATED');
          const requestId = data.requestId ? String(data.requestId) : undefined;
          if (!shouldDisplay(eventType, requestId)) return;

          playNotificationSound(eventType);
          LocalNotifications.schedule({
            notifications: [{
              id: Math.floor(Date.now() % 2_147_483_647),
              title: notification.title || 'تنبيه جديد من تساهيل',
              body: notification.body || 'لديك تحديث جديد في الورشة',
              channelId: ALERT_CHANNEL_ID,
              sound: 'default',
              extra: data,
            }],
          }).catch((error) => console.error('Failed to display notification:', error));
        });
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          openNotification(action.notification.data);
        });
        await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          openNotification(action.notification.extra);
        });
      }

      let permission = await PushNotifications.checkPermissions();
      if (permission.receive !== 'granted') {
        permission = await PushNotifications.requestPermissions();
      }
      if (permission.receive !== 'granted') return;

      await configureNotificationChannel();
      await PushNotifications.register();
    } catch (error) {
      registrationPromise = null;
      console.error('Failed to register push notifications:', error);
    }
  })();

  return registrationPromise;
}

function openNotification(data: Record<string, any> | undefined) {
  if (data?.requestId) {
    window.location.hash = `/requests/${data.requestId}`;
  }
}

async function sendTokenToBackend(fcmToken: string) {
  await client.put(tokenOwner === 'technician' ? '/technician/profile' : '/workshops/profile', {
    fcmToken,
  });
}

export async function unregisterPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  await PushNotifications.unregister().catch(() => {});
  registrationPromise = null;
}
