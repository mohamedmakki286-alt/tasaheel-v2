import apiClient from './client';
import type { Invoice, InvoiceItem, InvoiceItemPayload, InvoicePayload } from '../types';

export async function createInvoice(requestId: string, payload: InvoicePayload): Promise<Invoice> {
  const response = await apiClient.post('/invoices', { requestId, ...payload });
  const r = response.data?.data || response.data;
  const items: InvoiceItem[] = (r.items || payload.items || []).map((it: any) => ({
    name: it.name || '',
    quantity: it.quantity ?? 1,
    unitPrice: it.unitPrice ?? 0,
    total: it.total ?? 0,
  }));
  const partsTotal = items.reduce((s: number, i: InvoiceItem) => s + i.total, 0);
  return {
    id: String(r.id || ''),
    requestId: String(r.requestId || requestId),
    workshopId: String(r.workshopId || ''),
    items,
    partsTotal: r.partsTotal ?? partsTotal,
    laborTotal: r.laborTotal ?? 0,
    taxPercent: r.taxPercent ?? payload.taxPercent,
    taxAmount: r.tax ?? 0,
    grandTotal: r.grandTotal ?? partsTotal,
    status: r.status || 'pending',
    createdAt: r.createdAt || new Date().toISOString(),
  };
}

export async function deleteInvoice(requestId: string): Promise<void> {
  await apiClient.delete(`/invoices/${requestId}`);
}

export async function getInvoice(requestId: string): Promise<Invoice> {
  const response = await apiClient.get(`/invoices/${requestId}`);
  const r = response.data?.data || response.data;
  const items: InvoiceItem[] = (r.items || []).map((it: any) => ({
    name: it.name || '',
    quantity: it.quantity ?? 1,
    unitPrice: it.unitPrice ?? 0,
    total: it.total ?? 0,
  }));
  const partsTotal = items.reduce((s: number, i: InvoiceItem) => s + i.total, 0);
  return {
    id: String(r.id || ''),
    requestId: String(r.requestId || requestId),
    workshopId: String(r.workshopId || ''),
    items,
    partsTotal: r.partsTotal ?? partsTotal,
    laborTotal: r.laborTotal ?? 0,
    taxPercent: r.taxPercent ?? 15,
    taxAmount: r.tax || 0,
    grandTotal: r.grandTotal || partsTotal,
    status: r.status || 'pending',
    createdAt: r.createdAt || '',
  };
}
