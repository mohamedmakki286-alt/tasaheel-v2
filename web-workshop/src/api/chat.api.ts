import apiClient from './client';
import type { ChatRoom, ChatMessage } from '../types';

export async function getRoom(requestId: string): Promise<ChatRoom> {
  const response = await apiClient.get(`/chat/room/${requestId}`);
  const r = response.data;
  return {
    id: String(r.id || ''),
    requestId: String(r.requestId || requestId),
    participants: [],
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
    createdAt: m.createdAt || '',
  }));
}

export async function sendMessage(roomId: string, content: string): Promise<ChatMessage> {
  const response = await apiClient.post(`/chat/room/${roomId}/messages`, { content });
  const m = response.data;
  return {
    id: String(m.id || ''),
    roomId: String(m.roomId || roomId),
    senderId: String(m.senderId || ''),
    senderName: m.senderName || '',
    senderRole: m.senderRole || 'workshop',
    content: m.content || content,
    createdAt: m.createdAt || new Date().toISOString(),
  };
}
