import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notificationsApi, ServerNotification } from '../api/notifications.api';

export interface NotificationItem {
  id: string;
  type: 'request' | 'quote' | 'review';
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
  addNotification: (n: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
  syncFromServer: () => Promise<void>;
  syncUnreadCount: () => Promise<void>;
}

function mapServerNotification(n: ServerNotification): NotificationItem {
  return {
    id: String(n.id),
    type: n.type.includes('QUOTE') ? 'quote' : n.type.includes('REVIEW') ? 'review' : 'request',
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
      addNotification: (n) =>
        set((s) => {
          const updated = [n, ...s.notifications].slice(0, 50);
          return { notifications: updated, unreadCount: updated.filter((x) => !x.read).length };
        }),
      markAsRead: (id) =>
        set((s) => {
          const updated = s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
          notificationsApi.markAsRead(Number(id)).catch(() => {});
          return { notifications: updated, unreadCount: updated.filter((x) => !x.read).length };
        }),
      markAllAsRead: () =>
        set((s) => {
          notificationsApi.markAllAsRead().catch(() => {});
          return {
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          };
        }),
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
    { name: 'salaba-workshop-notifications' }
  )
);
