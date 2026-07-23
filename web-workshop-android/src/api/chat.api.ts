import apiClient from './client';
import type { ChatRoom, ChatMessage } from '../types';

export async function getRoom(requestId: string): Promise<ChatRoom> {
  const response = await apiClient.get(`/chat/room/${requestId}`);
  const r = response.data;
  return {
    id: String(r.id || ''),
    requestId: String(r.requestId || requestId),
    customerId: String(r.customerId || ''),
    customerName: r.customerName || '',
    workshopId: String(r.workshopId || ''),
    workshopName: r.workshopName || '',
    participants: [],
    unreadCount: r.unreadCount || 0,
    lastMessage: r.lastMessage ? {
      id: String(r.lastMessage.id || ''),
      roomId: String(r.lastMessage.roomId || ''),
      senderId: String(r.lastMessage.senderId || ''),
      senderName: r.lastMessage.senderName || '',
      senderRole: r.lastMessage.senderRole || 'customer',
      content: r.lastMessage.content || '',
      type: r.lastMessage.type || 'text',
      mediaUrl: r.lastMessage.mediaUrl,
      createdAt: r.lastMessage.createdAt || '',
    } : undefined,
    createdAt: r.createdAt || '',
  };
}

export async function getMessages(roomId: string): Promise<ChatMessage[]> {
  const response = await apiClient.get(`/chat/room/${roomId}/messages`);
  const list = Array.isArray(response.data) ? response.data :
    (response.data?.content ? response.data.content : []);
  return list.map((m: any) => ({
    id: String(m.id),
    roomId: String(m.roomId || roomId),
    senderId: String(m.senderId || ''),
    senderName: m.senderName || '',
    senderRole: m.senderRole || 'customer',
    content: m.content || '',
    type: m.type || 'text',
    mediaUrl: m.mediaUrl,
    isRead: m.isRead,
    createdAt: m.createdAt || '',
  }));
}

export async function sendMessage(roomId: string, content: string, type: string = 'text', mediaUrl?: string): Promise<ChatMessage> {
  const response = await apiClient.post(`/chat/room/${roomId}/messages`, { content, type, mediaUrl });
  const m = response.data;
  return {
    id: String(m.id || ''),
    roomId: String(m.roomId || roomId),
    senderId: String(m.senderId || ''),
    senderName: m.senderName || '',
    senderRole: m.senderRole || 'workshop',
    content: m.content || content,
    type: m.type || type,
    mediaUrl: m.mediaUrl || mediaUrl,
    createdAt: m.createdAt || new Date().toISOString(),
  };
}

export async function markAsRead(roomId: string): Promise<void> {
  await apiClient.put(`/chat/room/${roomId}/read`);
}

export async function uploadChatMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('prefix', 'chat');
  const { data } = await apiClient.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url || data;
}
