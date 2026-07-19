import apiClient from './client';
import type { InspectionReport, InspectionReportPayload } from '../types';

export async function submitReport(requestId: string, payload: InspectionReportPayload): Promise<InspectionReport> {
  const response = await apiClient.post('/inspection-reports', {
    requestId,
    notes: payload.notes,
    parts: payload.parts,
    laborItems: payload.labor,
    taxPercent: payload.taxPercent,
  });
  const r = response.data;
  return {
    id: String(r.id || ''),
    requestId: String(r.requestId || requestId),
    workshopId: String(r.workshopId || ''),
    notes: r.notes || payload.notes,
    parts: (r.parts || payload.parts || []).map((p: any) => ({
      name: p.partName || p.name || '',
      quantity: p.quantity || 0,
      unitPrice: p.unitPrice || 0,
      total: p.total || 0,
    })),
    labor: (r.laborItems || payload.labor || []).map((l: any) => ({
      description: l.description || '',
      hours: l.hours || 0,
      hourlyRate: l.hourlyRate || 0,
      total: l.total || 0,
    })),
    taxPercent: payload.taxPercent,
    grandTotal: r.grandTotal || 0,
    status: r.status || 'pending_approval',
    createdAt: r.createdAt || new Date().toISOString(),
  };
}

export async function getReport(requestId: string): Promise<InspectionReport> {
  const response = await apiClient.get(`/inspection-reports/${requestId}`);
  const r = response.data;
  return {
    id: String(r.id || ''),
    requestId: String(r.requestId || requestId),
    workshopId: String(r.workshopId || ''),
    notes: r.notes || '',
    parts: (r.parts || []).map((p: any) => ({
      name: p.partName || p.name || '',
      quantity: p.quantity || 0,
      unitPrice: p.unitPrice || 0,
      total: p.total || 0,
    })),
    labor: (r.laborItems || []).map((l: any) => ({
      description: l.description || '',
      hours: l.hours || 0,
      hourlyRate: l.hourlyRate || 0,
      total: l.total || 0,
    })),
    taxPercent: r.tax || r.taxPercent || 0,
    grandTotal: r.grandTotal || 0,
    status: r.status || 'pending_approval',
    createdAt: r.createdAt || '',
  };
}
