import client from './client';

export async function getChatRoom(requestId: number) {
  try {
    const { data } = await client.get(`/chat/room/${requestId}`);
    return data;
  } catch {
    return null;
  }
}

export async function getChatMessages(roomId: string) {
  const { data } = await client.get(`/chat/room/${roomId}/messages`);
  return Array.isArray(data) ? data : (data?.content || []);
}

export async function sendChatMessage(roomId: string, content: string, type = 'text', mediaUrl?: string) {
  const { data } = await client.post(`/chat/room/${roomId}/messages`, { content, type, mediaUrl });
  return data;
}

export async function markChatAsRead(roomId: string) {
  await client.put(`/chat/room/${roomId}/read`);
}
