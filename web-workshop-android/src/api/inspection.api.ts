import apiClient from './client';
import type { InspectionReport, InspectionReportPayload } from '../types';

export async function submitReport(requestId: string, payload: InspectionReportPayload): Promise<InspectionReport> {
  const response = await apiClient.post('/inspection-reports', {
    requestId,
    notes: payload.notes,
    parts: payload.parts.map(p => ({ partName: p.name, quantity: p.quantity, unitPrice: p.unitPrice })),
    laborItems: payload.labor.map(l => ({ description: l.description, hours: l.minutes / 60, hourlyRate: l.hourlyRate })),
    priority: payload.priority,
    status: payload.status || 'pending_approval',
  });
  const r = response.data;
  return mapReport(r, requestId, payload);
}

export async function updateReport(reportId: string, payload: InspectionReportPayload): Promise<InspectionReport> {
  const response = await apiClient.put(`/inspection-reports/${reportId}`, {
    notes: payload.notes,
    parts: payload.parts.map(p => ({ partName: p.name, quantity: p.quantity, unitPrice: p.unitPrice })),
    laborItems: payload.labor.map(l => ({ description: l.description, hours: l.minutes / 60, hourlyRate: l.hourlyRate })),
    priority: payload.priority,
    status: payload.status || 'pending_approval',
  });
  const r = response.data;
  return mapReport(r, r.requestId || '', payload);
}

export async function getReport(requestId: string): Promise<InspectionReport> {
  const response = await apiClient.get(`/inspection-reports/${requestId}`);
  const r = response.data;
  return mapReport(r, requestId);
}

function mapReport(r: any, requestId: string, payload?: InspectionReportPayload): InspectionReport {
  return {
    id: String(r.id || ''),
    requestId: String(r.requestId || requestId),
    workshopId: String(r.workshopId || ''),
    notes: r.notes || payload?.notes || '',
    parts: (r.parts || payload?.parts || []).map((p: any) => ({
      name: p.partName || p.name || '',
      quantity: p.quantity || 0,
      unitPrice: p.unitPrice || 0,
      total: p.total || (p.quantity || 0) * (p.unitPrice || 0),
    })),
    labor: (r.laborItems || payload?.labor || []).map((l: any) => ({
      description: l.description || '',
      minutes: l.minutes != null ? l.minutes : (l.hours || 0) * 60,
      hourlyRate: l.hourlyRate || 0,
      total: l.total || ((l.minutes != null ? l.minutes : (l.hours || 0) * 60) / 60) * (l.hourlyRate || 0),
    })),
    taxPercent: r.tax || 15,
    grandTotal: r.grandTotal || 0,
    priority: r.priority || payload?.priority || 'important',
    status: r.status || payload?.status || 'pending_approval',
    createdAt: r.createdAt || new Date().toISOString(),
  };
}
