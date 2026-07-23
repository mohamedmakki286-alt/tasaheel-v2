import client from './client';

export interface ServerNotification {
  id: number;
  userId: number;
  userRole: string;
  type: string;
  title: string;
  body: string;
  requestId: number | null;
  eventType: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getAll: async (page = 0, size = 20) => {
    const response = await client.get(`/notifications?page=${page}&size=${size}`);
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await client.get('/notifications/unread-count');
    return response.data.count as number;
  },
  markAsRead: async (id: number) => {
    const response = await client.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await client.put('/notifications/read-all');
    return response.data;
  },
};
