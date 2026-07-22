import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notificationsApi, ServerNotification } from '../api/notifications.api';

export interface NotificationItem {
  id: string;
  type: 'request' | 'payment' | 'status';
  title: string;
  body: string;
  requestId?: number;
  eventType?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
  syncFromServer: () => Promise<void>;
  syncUnreadCount: () => Promise<void>;
}

function mapServerNotification(n: ServerNotification): NotificationItem {
  return {
    id: String(n.id),
    type: n.type.includes('PAYMENT') ? 'payment' : n.type.includes('STATUS') ? 'status' : 'request',
    title: n.title,
    body: n.body || '',
    requestId: n.requestId || undefined,
    eventType: n.eventType,
    read: n.isRead,
    createdAt: n.createdAt,
  };
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        const notifications = [notification, ...get().notifications].slice(0, 50);
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
        });
      },
      markAsRead: (id) => {
        const notifications = get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
        });
        notificationsApi.markAsRead(Number(id)).catch(() => {});
      },
      markAllAsRead: () => {
        const notifications = get().notifications.map((n) => ({ ...n, read: true }));
        set({ notifications, unreadCount: 0 });
        notificationsApi.markAllAsRead().catch(() => {});
      },
      clear: () => set({ notifications: [], unreadCount: 0 }),
      syncFromServer: async () => {
        try {
          const page = await notificationsApi.getAll(0, 50);
          const items = (page.content || []).map(mapServerNotification);
          if (items.length > 0) {
            set({
              notifications: items,
              unreadCount: items.filter((n: NotificationItem) => !n.read).length,
            });
          }
        } catch {}
      },
      syncUnreadCount: async () => {
        try {
          const count = await notificationsApi.getUnreadCount();
          set({ unreadCount: count });
        } catch {}
      },
    }),
    { name: 'salaba-admin-notifications' }
  )
);
