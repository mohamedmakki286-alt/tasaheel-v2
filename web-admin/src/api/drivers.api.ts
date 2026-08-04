import client, { mapPage } from './client';
import type { Driver, PaginatedResponse } from '../types';

export async function getDrivers(params?: Record<string, any>): Promise<PaginatedResponse<Driver>> {
  const { data } = await client.get<any>('/admin/drivers', { params: { ...params, page: params?.page != null ? params.page - 1 : 0 } });
  const page = mapPage<any>(data);
  return { ...page, data: page.data.map(normalizeDriver) };
}

export async function getDriver(id: number): Promise<Driver> {
  const { data } = await client.get<Driver>(`/admin/drivers/${id}`);
  return data;
}

export async function updateDriver(id: number, payload: Partial<Pick<Driver, 'name' | 'phone' | 'email' | 'city' | 'vehicleType' | 'vehiclePlate'>>): Promise<Driver> {
  const { data } = await client.put<Driver>(`/admin/drivers/${id}`, payload);
  return normalizeDriver(data);
}

function normalizeDriver(driver: any): Driver {
  return { ...driver, vehiclePlate: driver.vehiclePlate ?? driver.plateNumber ?? '', joinedAt: driver.joinedAt ?? driver.createdAt ?? null };
}

export async function createDriver(driverData: { name: string; phone: string; email?: string; password: string; city?: string; vehicleType: string; plateNumber?: string }): Promise<Driver> {
  const { data } = await client.post<Driver>('/admin/drivers', driverData);
  return data;
}

export async function approveDriver(id: number): Promise<void> {
  await client.put(`/admin/drivers/${id}/approve`);
}

export async function toggleDriverStatus(id: number, isActive: boolean): Promise<void> {
  await client.put(`/admin/users/driver/${id}/toggle-status`, { isActive });
}

export async function deleteDriver(id: number): Promise<void> {
  await client.delete(`/admin/users/driver/${id}`);
}
