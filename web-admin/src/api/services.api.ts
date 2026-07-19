import client from './client';
import type { ServiceType } from '../types';

export async function getServices(): Promise<ServiceType[]> {
  const { data } = await client.get<ServiceType[]>('/services');
  return data;
}

export async function createService(payload: Partial<ServiceType>): Promise<ServiceType> {
  const { data } = await client.post<ServiceType>('/services', payload);
  return data;
}

export async function updateService(id: number, payload: Partial<ServiceType>): Promise<ServiceType> {
  const { data } = await client.put<ServiceType>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: number): Promise<void> {
  await client.delete(`/services/${id}`);
}
