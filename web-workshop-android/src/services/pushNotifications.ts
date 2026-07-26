import { PushNotifications, Token } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import client from '../api/client';
import { playNotificationSound } from './notificationSound';

const ALERT_CHANNEL_ID = 'tasaheel_alerts';
let registrationPromise: Promise<void> | null = null;
let listenersReady = false;
let tokenOwner: 'workshop' | 'technician' = 'workshop';

async function configureNotificationChannel() {
  await PushNotifications.createChannel({
    id: ALERT_CHANNEL_ID,
    name: 'تنبيهات تساهيل',
    description: 'تنبيهات الطلبات والمحادثات وتحديثات الورشة',
    importance: 5,
    visibility: 1,
    sound: 'default',
    vibration: true,
  });

  await LocalNotifications.createChannel({
    id: ALERT_CHANNEL_ID,
    name: 'تنبيهات تساهيل',
    description: 'تنبيهات الطلبات والمحادثات وتحديثات الورشة',
    importance: 5,
    visibility: 1,
    sound: 'default',
    vibration: true,
  });
}

export async function registerPushNotifications(workshopId: string, owner: 'workshop' | 'technician' = 'workshop') {
  if (!Capacitor.isNativePlatform()) return;
  if (tokenOwner !== owner) registrationPromise = null;
  tokenOwner = owner;
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive !== 'granted') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
      }

      if (!listenersReady) {
        listenersReady = true;
        PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push registration success, token:', token.value);
          sendTokenToBackend(token.value);
        });

        PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
      const eventType = String(notification.data?.eventType || notification.data?.type || 'REQUEST_CREATED');
      playNotificationSound(eventType);

      LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Date.now() % 2_147_483_647),
          title: notification.title || 'تنبيه جديد من تساهيل',
          body: notification.body || 'لديك تحديث جديد في الورشة',
          channelId: ALERT_CHANNEL_ID,
          sound: 'default',
          extra: notification.data,
        }],
      }).catch((error) => console.error('Failed to display foreground notification:', error));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action performed:', action);
      const data = action.notification.data;
      if (data?.requestId) {
        window.location.hash = `/requests/${data.requestId}`;
      }
        });

        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const data = action.notification.extra;
      if (data?.requestId) {
        window.location.hash = `/requests/${data.requestId}`;
      }
        });
      }

      await configureNotificationChannel();
      await PushNotifications.register();
    } catch (err) {
      registrationPromise = null;
      console.error('Failed to register push notifications:', err);
    }
  })();

  return registrationPromise;
}

async function sendTokenToBackend(fcmToken: string) {
  try {
    await client.put(tokenOwner === 'technician' ? '/technician/profile' : '/workshops/profile', {
      fcmToken: fcmToken,
    });
  } catch (err) {
    console.error('Failed to send FCM token to backend:', err);
  }
}

export async function unregisterPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PushNotifications.unregister();
    registrationPromise = null;
  } catch {}
}
