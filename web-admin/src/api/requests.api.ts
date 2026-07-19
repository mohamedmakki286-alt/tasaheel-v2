import client, { mapPage } from './client';
import type { MaintenanceRequest, PaginatedResponse } from '../types';

export async function getRequests(params?: Record<string, any>): Promise<PaginatedResponse<MaintenanceRequest>> {
  const { data } = await client.get<any>('/admin/requests', { params: { ...params, page: params?.page != null ? params.page - 1 : 0 } });
  return mapPage(data);
}

export async function getRequest(id: number): Promise<MaintenanceRequest> {
  const { data } = await client.get<MaintenanceRequest>(`/requests/${id}`);
  return data;
}

export async function deleteRequest(id: number): Promise<void> {
  await client.delete(`/admin/requests/${id}`);
}

export async function reassignServiceItem(id: number, serviceTypeId: number, newWorkshopId: number): Promise<void> {
  await client.post(`/admin/requests/${id}/reassign`, { serviceTypeId, newWorkshopId });
}

export async function overrideRequestStatus(id: number, status: string): Promise<void> {
  await client.post(`/admin/requests/${id}/override-status`, { status });
}
