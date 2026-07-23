import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const PERMISSION_KEY = 'tasaheel_notif_permission_asked';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const status = await LocalNotifications.checkPermissions();

    if (status.display === 'granted') return true;

    if (sessionStorage.getItem(PERMISSION_KEY)) return false;

    sessionStorage.setItem(PERMISSION_KEY, '1');

    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (err) {
    console.warn('Notification permission request failed:', err);
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

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: opts.title,
          body: opts.body,
          id: opts.id ?? Math.floor(Math.random() * 2147483647),
          channelId: opts.channelId ?? 'workshop-general',
          extra: {
            requestId: opts.requestId ?? null,
            url: opts.url ?? null,
          },
        },
      ],
    });
  } catch (err) {
    console.warn('Failed to show local notification:', err);
  }
}

export function setupNotificationListeners(
  onActionPerformed?: (data: { requestId?: string; url?: string }) => void
): void {
  if (!Capacitor.isNativePlatform()) return;

  try {
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const extra = action.notification.extra || {};
      onActionPerformed?.({ requestId: extra.requestId, url: extra.url });
    }).catch(() => {});
  } catch {
    // Plugin not available
  }
}
