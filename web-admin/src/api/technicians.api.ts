import client, { mapPage } from './client';
import type { Technician, PaginatedResponse } from '../types';

export async function getTechnicians(params?: Record<string, any>): Promise<PaginatedResponse<Technician>> {
  const { data } = await client.get<any>('/admin/technicians', { params: { ...params, page: params?.page != null ? params.page - 1 : 0 } });
  return mapPage(data);
}

export async function toggleTechnicianStatus(id: number, isActive: boolean): Promise<void> {
  await client.put(`/admin/users/technician/${id}/toggle-status`, { isActive });
}

export async function deleteTechnician(id: number): Promise<void> {
  await client.delete(`/admin/users/technician/${id}`);
}
