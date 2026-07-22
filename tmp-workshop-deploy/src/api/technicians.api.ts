import apiClient from './client';
import type { Technician, TechnicianPayload } from '../types';

export async function getTechnicians(): Promise<Technician[]> {
  const response = await apiClient.get('/workshops/technicians');
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((t: any) => ({
    id: t.id,
    name: t.name || '',
    phone: t.phone || '',
    email: t.email || '',
    specialty: t.specialty || '',
    workshopId: t.workshopId,
    workshopName: t.workshopName || '',
    isActive: t.isActive ?? true,
    isOnline: t.isOnline ?? false,
    availabilityStatus: t.availabilityStatus || 'available',
    profileImageUrl: t.profileImageUrl || null,
    latitude: t.latitude,
    longitude: t.longitude,
    fcmToken: t.fcmToken,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || '',
  }));
}

export async function getTechnician(id: number): Promise<Technician> {
  const response = await apiClient.get(`/workshops/technicians/${id}`);
  const t = response.data;
  return {
    id: t.id,
    name: t.name || '',
    phone: t.phone || '',
    email: t.email || '',
    specialty: t.specialty || '',
    workshopId: t.workshopId,
    workshopName: t.workshopName || '',
    isActive: t.isActive ?? true,
    isOnline: t.isOnline ?? false,
    latitude: t.latitude,
    longitude: t.longitude,
    fcmToken: t.fcmToken,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || '',
  };
}

export async function createTechnician(payload: TechnicianPayload): Promise<Technician> {
  const response = await apiClient.post('/workshops/technicians', payload);
  const t = response.data;
  return {
    id: t.id,
    name: t.name || payload.name,
    phone: t.phone || payload.phone,
    email: t.email || payload.email || '',
    specialty: t.specialty || payload.specialty,
    workshopId: t.workshopId,
    workshopName: t.workshopName || '',
    isActive: t.isActive ?? true,
    isOnline: t.isOnline ?? false,
    latitude: t.latitude,
    longitude: t.longitude,
    fcmToken: t.fcmToken,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || '',
  };
}

export async function updateTechnician(id: number, payload: Partial<TechnicianPayload>): Promise<Technician> {
  const response = await apiClient.put(`/workshops/technicians/${id}`, payload);
  const t = response.data;
  return {
    id: t.id,
    name: t.name || '',
    phone: t.phone || '',
    email: t.email || '',
    specialty: t.specialty || '',
    workshopId: t.workshopId,
    workshopName: t.workshopName || '',
    isActive: t.isActive ?? true,
    isOnline: t.isOnline ?? false,
    latitude: t.latitude,
    longitude: t.longitude,
    fcmToken: t.fcmToken,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || '',
  };
}

export async function deleteTechnician(id: number): Promise<void> {
  await apiClient.delete(`/workshops/technicians/${id}`);
}
