import client from './client';
import type { Invoice } from '../types';

export const invoicesApi = {
  getByRequest: async (requestId: string): Promise<Invoice> => {
    const response = await client.get(`/invoices/customer/${requestId}`);
    const r = response.data;
    return {
      id: String(r.id),
      requestId: String(r.requestId || requestId),
      workshopId: String(r.workshopId || ''),
      workshopName: r.workshopName || '',
      invoiceNumber: r.invoiceNumber || '',
      items: Array.isArray(r.items) ? r.items.map((item: any) => ({
        id: String(item.id || ''),
        name: item.name || '',
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        total: Number(item.total ?? (item.quantity || 0) * (item.unitPrice || 0)),
      })) : [],
      partsTotal: Number(r.partsTotal || 0),
      laborTotal: Number(r.laborTotal || 0),
      totalAmount: Number(r.totalAmount ?? (r.partsTotal || 0) + (r.laborTotal || 0)),
      tax: Number(r.tax ?? r.taxAmount ?? 0),
      taxAmount: Number(r.taxAmount ?? r.tax ?? 0),
      grandTotal: Number(r.grandTotal || 0),
      status: r.status || 'pending_approval',
      createdAt: r.createdAt || '',
      paidAt: r.paidAt || undefined,
    };
  },
  getAll: (page = 0, size = 20) => client.get('/invoices/customer', { params: { page, size } }),
  approve: (requestId: string) => client.post(`/invoices/${requestId}/approve`),
  reject: (requestId: string) => client.post(`/invoices/${requestId}/reject`),
};

export type InvoicesListResponse = {
  content: Invoice[];
  totalElements: number;
};
