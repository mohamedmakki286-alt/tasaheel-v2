import client from './client';
import type { Invoice } from '../types';

export const invoicesApi = {
  getByRequest: (requestId: string) => client.get(`/invoices/${requestId}`),
  getAll: (page = 0, size = 20) => client.get('/invoices/customer', { params: { page, size } }),
  approve: (requestId: string) => client.post(`/invoices/${requestId}/approve`),
  reject: (requestId: string) => client.post(`/invoices/${requestId}/reject`),
};

export type InvoicesListResponse = {
  content: Invoice[];
  totalElements: number;
};
