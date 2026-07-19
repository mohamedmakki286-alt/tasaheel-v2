import apiClient from './client';
import type { HomeServiceAssignment } from '../types';

export async function getHomeServiceAssignments(): Promise<HomeServiceAssignment[]> {
  const response = await apiClient.get('/workshops/home-service');
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((a: any) => ({
    id: a.id,
    requestId: a.requestId,
    customerName: a.customerName || '',
    customerPhone: a.customerPhone || '',
    carMake: a.carMake || '',
    carModel: a.carModel || '',
    carPlateNumber: a.carPlateNumber || '',
    serviceTypeName: a.serviceTypeName || '',
    description: a.description || '',
    locationLat: a.locationLat || 0,
    locationLng: a.locationLng || 0,
    locationAddress: a.locationAddress || '',
    city: a.city || '',
    technicianId: a.technicianId ?? null,
    technicianName: a.technicianName || null,
    technicianPhone: a.technicianPhone || null,
    technicianSpecialty: a.technicianSpecialty || null,
    workshopId: a.workshopId,
    workshopName: a.workshopName || '',
    status: a.status || 'pending_assignment',
    assignedAt: a.assignedAt || null,
    enRouteAt: a.enRouteAt || null,
    arrivedAt: a.arrivedAt || null,
    startedAt: a.startedAt || null,
    completedAt: a.completedAt || null,
    createdAt: a.createdAt || new Date().toISOString(),
  }));
}

export async function assignTechnician(assignmentId: number, technicianId: number): Promise<HomeServiceAssignment> {
  const response = await apiClient.put(`/workshops/home-service/${assignmentId}/assign/${technicianId}`);
  return response.data;
}

export async function updateAssignmentStatus(assignmentId: number, status: string): Promise<HomeServiceAssignment> {
  const response = await apiClient.put(`/workshops/home-service/${assignmentId}/status`, { status });
  return response.data;
}
