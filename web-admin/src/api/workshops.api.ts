import client, { mapPage } from './client';
import type { Workshop, PaginatedResponse } from '../types';

export async function getWorkshops(params?: Record<string, any>): Promise<PaginatedResponse<Workshop>> {
  const { data } = await client.get<any>('/admin/workshops', { params: { ...params, page: params?.page != null ? params.page - 1 : 0 } });
  return mapPage(data);
}

export async function getWorkshop(id: number): Promise<Workshop> {
  const { data } = await client.get<Workshop>(`/admin/workshops/${id}`);
  return data;
}

export async function createWorkshop(formData: FormData): Promise<Workshop> {
  const { data } = await client.post<Workshop>('/admin/workshops', formData);
  return data;
}

export async function updateWorkshop(id: number, formData: FormData): Promise<Workshop> {
  const { data } = await client.put<Workshop>(`/admin/workshops/${id}`, formData);
  return data;
}

export async function sendWorkshopInvitation(id: number): Promise<{ invitationUrl: string; expiresInHours: number }> {
  const { data } = await client.post<{ invitationUrl: string; expiresInHours: number }>(`/admin/workshops/${id}/invitation`);
  return data;
}

export async function approveWorkshop(id: number): Promise<void> {
  await client.put(`/admin/workshops/${id}/approve`);
}

export async function rejectWorkshop(id: number, reason: string): Promise<void> {
  await client.put(`/admin/workshops/${id}/reject`, { reason });
}

export async function toggleWorkshopStatus(id: number, isActive: boolean): Promise<void> {
  await client.put(`/admin/users/workshop/${id}/toggle-status`, { isActive });
}

export async function deleteWorkshop(id: number): Promise<void> {
  await client.delete(`/admin/users/workshop/${id}`);
}
