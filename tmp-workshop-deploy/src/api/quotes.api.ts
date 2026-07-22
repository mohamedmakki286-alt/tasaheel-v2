import apiClient from './client';
import type { Quote, SubmitQuotePayload } from '../types';

export async function submitQuote(requestId: string, payload: SubmitQuotePayload): Promise<Quote> {
  const response = await apiClient.post('/workshops/quotes', { requestId, ...payload });
  const q = response.data;
  return {
    id: String(q.id),
    requestId: String(q.requestId || requestId),
    workshopId: String(q.workshopId || ''),
    serviceTypeId: q.serviceTypeId || null,
    serviceTypeName: q.serviceTypeName || null,
    price: q.price || payload.price,
    notes: q.notes || payload.notes,
    status: q.status || 'pending',
    createdAt: q.createdAt || new Date().toISOString(),
  };
}

export async function getMyQuotes(): Promise<Quote[]> {
  const response = await apiClient.get('/workshops/quotes');
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((q: any) => ({
    id: String(q.id),
    requestId: String(q.requestId || ''),
    workshopId: String(q.workshopId || ''),
    workshopName: q.workshopName || '',
    workshopLogo: q.workshopLogo || null,
    serviceTypeId: q.serviceTypeId || null,
    serviceTypeName: q.serviceTypeName || null,
    price: q.price || 0,
    notes: q.notes || '',
    status: q.status || 'pending',
    estimatedDays: q.estimatedDays || null,
    warrantyMonths: q.warrantyMonths || null,
    createdAt: q.createdAt || '',
  }));
}

export async function getRequestQuotes(requestId: string): Promise<Quote[]> {
  const response = await apiClient.get(`/requests/${requestId}/quotes`);
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((q: any) => ({
    id: String(q.id),
    requestId: String(q.requestId || requestId),
    workshopId: String(q.workshopId || ''),
    serviceTypeId: q.serviceTypeId || null,
    serviceTypeName: q.serviceTypeName || null,
    price: q.price || 0,
    notes: q.notes || '',
    status: q.status || 'pending',
    createdAt: q.createdAt || '',
  }));
}
