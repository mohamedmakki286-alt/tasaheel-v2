import client from './client';

export async function getRequestQuotes(requestId: number) {
  const { data } = await client.get(`/requests/${requestId}/quotes`);
  return Array.isArray(data) ? data : (data?.content || []);
}
