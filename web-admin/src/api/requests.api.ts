import client, { mapPage } from './client';
import type { MaintenanceRequest, PaginatedResponse } from '../types';

function mapRequest(r: any): MaintenanceRequest {
  return {
    ...r,
    carPlate: r.carPlate ?? r.carPlateNumber ?? '',
    serviceType: r.serviceType ?? r.serviceTypeName ?? '',
    pickupAddress: r.pickupAddress ?? r.locationAddress ?? '',
    workshopId: r.workshopId ?? 0,
    workshopName: r.workshopName ?? '',
  };
}

export async function getRequests(params?: Record<string, any>): Promise<PaginatedResponse<MaintenanceRequest>> {
  const { data } = await client.get<any>('/admin/requests', { params: { ...params, page: params?.page != null ? params.page - 1 : 0 } });
  const page = mapPage<MaintenanceRequest>(data);
  return { ...page, data: page.data.map(mapRequest) };
}

export async function getRequest(id: number): Promise<MaintenanceRequest> {
  const { data } = await client.get<MaintenanceRequest>(`/admin/requests/${id}`);
  return mapRequest(data);
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
