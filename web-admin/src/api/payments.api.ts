import client, { mapPage } from './client';
import type { Payment, PaginatedResponse } from '../types';

export async function getPayments(params?: Record<string, any>): Promise<PaginatedResponse<Payment>> {
  const { data } = await client.get<any>('/admin/payments', { params: { ...params, page: params?.page != null ? params.page - 1 : 0 } });
  return mapPage(data);
}

export async function refundPayment(id: number): Promise<Payment> {
  const { data } = await client.post<Payment>(`/payments/${id}/refund`);
  return data;
}

export async function releasePayment(id: number, workshopId: number): Promise<any> {
  const { data } = await client.post(`/admin/payments/${id}/release`, { workshopId });
  return data.data || data;
}

export async function adminRefundPayment(id: number): Promise<any> {
  const { data } = await client.post(`/admin/payments/${id}/refund`);
  return data.data || data;
}

export async function getPaymentHolds(): Promise<any[]> {
  const { data } = await client.get('/admin/payments/holds');
  return data.data || data;
}
