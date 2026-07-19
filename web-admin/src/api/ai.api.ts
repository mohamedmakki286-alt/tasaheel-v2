import client from './client';

interface ChatMessage {
  role: string;
  content: string;
}

interface AIChatRequest {
  message: string;
  history: ChatMessage[];
}

interface AIChatResponse {
  reply: string;
}

export async function sendChatMessage(message: string, history: ChatMessage[] = []): Promise<string> {
  const { data } = await client.post<AIChatResponse>('/ai/chat', { message, history } as AIChatRequest);
  return data.reply;
}
