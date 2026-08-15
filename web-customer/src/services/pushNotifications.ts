import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import client from '../api/client';
import { playNotificationSound } from './notificationSound';

export const ALERT_CHANNEL_ID = 'tasaheel_alerts';
const PERMISSION_KEY = 'tasaheel_notif_permission_asked';

let listenersReady = false;
let actionHandler: ((data: { requestId?: string; url?: string }) => void) | undefined;
const recentNativeAlerts = new Map<string, number>();
let registrationPromise: Promise<boolean> | null = null;

export function shouldDeliverNativeAlert(eventType: string, requestId?: string): boolean {
  const now = Date.now();
  const key = `${eventType}:${requestId || 'general'}`;
  const previous = recentNativeAlerts.get(key) || 0;

  for (const [storedKey, timestamp] of recentNativeAlerts) {
    if (now - timestamp > 10_000) recentNativeAlerts.delete(storedKey);
  }
  if (now - previous < 5_000) return false;

  recentNativeAlerts.set(key, now);
  return true;
}

async function configureNotificationChannel(): Promise<void> {
  const channel = {
    id: ALERT_CHANNEL_ID,
    name: 'تنبيهات تساهيل',
    description: 'تنبيهات الطلبات والمحادثات وتحديثات الخدمة',
    importance: 5 as const,
    visibility: 1 as const,
    sound: 'default',
    vibration: true,
  };

  await Promise.all([
    FirebaseMessaging.createChannel(channel),
    LocalNotifications.createChannel(channel),
  ]);
}

function notificationData(data: Record<string, any> | undefined) {
  return {
    requestId: data?.requestId ? String(data.requestId) : undefined,
    url: data?.url ? String(data.url) : undefined,
  };
}

function openNotification(data: { requestId?: string; url?: string }) {
  actionHandler?.(data);
  if (actionHandler) return;

  const target = data.url || (data.requestId ? `/orders/${data.requestId}` : undefined);
  if (target) window.location.assign(target);
}

async function installListeners(): Promise<void> {
  if (listenersReady) return;
  listenersReady = true;

  await FirebaseMessaging.addListener('tokenReceived', (event) => {
    client.put('/customers/profile', { fcmToken: event.token }).catch((error) => {
      console.error('Failed to save customer notification token:', error);
    });
  });

  await FirebaseMessaging.addListener('notificationReceived', (event) => {
    const notification = event.notification;
    const data = (notification.data || {}) as Record<string, any>;
    const eventType = String(data.eventType || data.type || 'STATUS_UPDATED');
    const requestId = data.requestId ? String(data.requestId) : undefined;
    if (!shouldDeliverNativeAlert(eventType, requestId)) return;

    playNotificationSound(eventType);

    showLocalNotification({
      title: notification.title || 'تنبيه جديد من تساهيل',
      body: notification.body || 'لديك تحديث جديد على طلبك',
      requestId,
      url: data.url ? String(data.url) : undefined,
    }).catch(() => {});
  });

  await FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
    openNotification(notificationData(action.notification.data as Record<string, any> | undefined));
  });

  await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    openNotification(notificationData(action.notification.extra));
  });
}

export async function registerCustomerPushNotifications(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    try {
      await installListeners();

      let pushPermission = await FirebaseMessaging.checkPermissions();
      if (pushPermission.receive !== 'granted') {
        pushPermission = await FirebaseMessaging.requestPermissions();
      }
      if (pushPermission.receive !== 'granted') return false;

      // Push and local notifications share POST_NOTIFICATIONS on Android.
      // Requesting it through both plugins at the same time can close the Activity.
      await configureNotificationChannel();
      const token = await FirebaseMessaging.getToken();
      await client.put('/customers/profile', { fcmToken: token.token });
      return true;
    } catch (error) {
      console.warn('Customer notification setup failed:', error);
      registrationPromise = null;
      return false;
    }
  })();

  return registrationPromise;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    if (sessionStorage.getItem(PERMISSION_KEY)) return false;

    sessionStorage.setItem(PERMISSION_KEY, '1');
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.warn('Notification permission request failed:', error);
    return false;
  }
}

export async function showLocalNotification(opts: {
  title: string;
  body: string;
  id?: number;
  channelId?: string;
  requestId?: string;
  url?: string;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const status = await LocalNotifications.checkPermissions();
  if (status.display !== 'granted') return;

  await configureNotificationChannel();
  await LocalNotifications.schedule({
    notifications: [{
      title: opts.title,
      body: opts.body,
      id: opts.id ?? Math.floor(Date.now() % 2_147_483_647),
      channelId: opts.channelId ?? ALERT_CHANNEL_ID,
      sound: 'default',
      extra: {
        requestId: opts.requestId ?? null,
        url: opts.url ?? null,
      },
    }],
  });
}

export function setupNotificationListeners(
  onActionPerformed?: (data: { requestId?: string; url?: string }) => void
): void {
  actionHandler = onActionPerformed;
  if (!Capacitor.isNativePlatform()) return;
  installListeners().catch(() => {});
}

export async function unregisterCustomerPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await FirebaseMessaging.deleteToken().catch(() => {});
  registrationPromise = null;
}
