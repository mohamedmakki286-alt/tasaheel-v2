import client from './client';
import type { InspectionReport } from '../types';

export async function getInspectionReport(requestId: number): Promise<InspectionReport> {
  const { data } = await client.get<InspectionReport>(`/inspection-reports/${requestId}`);
  return data;
}

export async function approveInspectionReport(id: number): Promise<void> {
  await client.put(`/inspection-reports/${id}/approve`);
}

export async function rejectInspectionReport(id: number, reason: string): Promise<void> {
  await client.put(`/inspection-reports/${id}/reject`, { reason });
}
