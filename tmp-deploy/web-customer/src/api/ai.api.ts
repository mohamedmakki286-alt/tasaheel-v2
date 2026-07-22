import client from './client';

interface ChatMessage {
  role: string;
  content: string;
}

interface AIChatResponse {
  reply: string;
}

export async function sendChatMessage(message: string, history: ChatMessage[] = []): Promise<string> {
  const { data } = await client.post<AIChatResponse>('/ai/chat', { message, history });
  return data.reply;
}
