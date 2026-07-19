import client from './client';
import type { ChatRoom, ChatMessage } from '../types';

export async function getOrCreateRoom(requestId: number, customerId: number, workshopId?: number): Promise<ChatRoom> {
  const body: Record<string, number> = { requestId, customerId };
  if (workshopId) body.workshopId = workshopId;
  const { data } = await client.post('/chat/room', body);
  const r = data.data || data;
  return {
    id: String(r.id || ''),
    requestId: String(r.requestId || requestId),
    customerId: String(r.customerId || customerId),
    customerName: r.customerName || '',
    workshopId: r.workshopId ? String(r.workshopId) : undefined,
    workshopName: r.workshopName || undefined,
    lastMessage: r.lastMessage,
    unreadCount: r.unreadCount || 0,
    createdAt: r.createdAt || '',
  };
}

export async function getRoomByRequestId(requestId: number): Promise<ChatRoom | null> {
  try {
    const { data } = await client.get(`/chat/room/${requestId}`);
    const r = data.data || data;
    return {
      id: String(r.id || ''),
      requestId: String(r.requestId || requestId),
      customerId: String(r.customerId || ''),
      customerName: r.customerName || '',
      workshopId: r.workshopId ? String(r.workshopId) : undefined,
      workshopName: r.workshopName || undefined,
      lastMessage: r.lastMessage,
      unreadCount: r.unreadCount || 0,
      createdAt: r.createdAt || '',
    };
  } catch {
    return null;
  }
}

export async function getMessages(roomId: string): Promise<ChatMessage[]> {
  const { data } = await client.get(`/chat/room/${roomId}/messages`);
  const list = data.data || data;
  const items = Array.isArray(list) ? list : (list?.content || []);
  return items.map((m: any) => ({
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

export async function sendMessage(roomId: string, senderId: string, senderRole: string, content: string): Promise<ChatMessage> {
  const { data } = await client.post(`/chat/room/${roomId}/messages`, {
    senderId: Number(senderId),
    senderRole,
    content,
  });
  const m = data.data || data;
  return {
    id: String(m.id || ''),
    roomId: String(m.roomId || roomId),
    senderId: String(m.senderId || senderId),
    senderName: m.senderName || '',
    senderRole: m.senderRole || senderRole,
    content: m.content || content,
    type: m.type || 'text',
    isRead: m.isRead,
    createdAt: m.createdAt || new Date().toISOString(),
  };
}

export async function markAsRead(roomId: string): Promise<void> {
  await client.put(`/chat/room/${roomId}/read`);
}
