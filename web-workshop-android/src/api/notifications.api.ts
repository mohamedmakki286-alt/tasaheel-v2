import apiClient from './client';

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
    const response = await apiClient.get(`/notifications?page=${page}&size=${size}`);
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    const data = response.data as number | { count?: number };
    return Number(typeof data === 'number' ? data : data?.count ?? 0);
  },
  markAsRead: async (id: number) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },
};
