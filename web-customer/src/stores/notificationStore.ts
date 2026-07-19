import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      },
      markAllAsRead: () => {
        const notifications = get().notifications.map((n) => ({ ...n, read: true }));
        set({ notifications, unreadCount: 0 });
      },
      clear: () => set({ notifications: [], unreadCount: 0 }),
    }),
    { name: 'salaba-customer-notifications' }
  )
);
