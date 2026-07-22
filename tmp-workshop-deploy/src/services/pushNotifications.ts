import { PushNotifications, Token } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import client from '../api/client';

export async function registerPushNotifications(workshopId: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive !== 'granted') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      sendTokenToBackend(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action performed:', action);
      const data = action.notification.data;
      if (data?.requestId) {
        window.location.hash = `/requests/${data.requestId}`;
      }
    });
  } catch (err) {
    console.error('Failed to register push notifications:', err);
  }
}

async function sendTokenToBackend(fcmToken: string) {
  try {
    await client.put('/workshops/profile', {
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
  } catch {}
}
