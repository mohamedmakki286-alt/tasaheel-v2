import client from './client';

export async function getInvoiceByRequest(requestId: number) {
  try {
    const { data } = await client.get(`/invoices/${requestId}`);
    return data;
  } catch {
    return null;
  }
}
