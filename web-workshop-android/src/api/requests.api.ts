import apiClient from './client';
import type { ServiceRequest, StatusUpdatePayload } from '../types';
import { useAuthStore } from '../stores/authStore';

export async function getNewRequests(): Promise<ServiceRequest[]> {
  const workshop = useAuthStore.getState().workshop;
  const response = await apiClient.get('/workshops/requests', { params: { city: workshop?.city || '' } });
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((r: any) => ({
    id: String(r.id),
    customer: { id: String(r.customerId), name: r.customerName || '', phone: r.customerPhone || '' },
    car: { id: String(r.carId || ''), make: r.carMake || '', model: r.carModel || '', year: r.carYear || 0, plateNumber: r.carPlateNumber, color: r.carColor, mileage: r.carMileage },
    service: r.serviceTypeName || '',
    description: r.description || '',
    location: r.locationAddress || '',
    city: r.city || '',
    status: r.status || 'pending',
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt || '',
    hasQuote: false,
    hasReport: false,
    hasInvoice: false,
    serviceTypeIds: r.serviceTypeIds || [],
    technicianId: r.technicianId ?? undefined,
    technicianName: r.technicianName || undefined,
    technicianPhone: r.technicianPhone || undefined,
    technicianSpecialty: r.technicianSpecialty || undefined,
  }));
}

export async function getMyRequests(): Promise<ServiceRequest[]> {
  const response = await apiClient.get('/workshops/my-requests');
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((r: any) => ({
    id: String(r.id),
    customer: { id: String(r.customerId), name: r.customerName || '', phone: r.customerPhone || '' },
    car: { id: String(r.carId || ''), make: r.carMake || '', model: r.carModel || '', year: r.carYear || 0, plateNumber: r.carPlateNumber, color: r.carColor, mileage: r.carMileage },
    service: r.serviceTypeName || '',
    description: r.description || '',
    location: r.locationAddress || '',
    city: r.city || '',
    status: r.status || 'pending',
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt || '',
    hasQuote: false,
    hasReport: false,
    hasInvoice: false,
    serviceTypeIds: r.serviceTypeIds || [],
    technicianId: r.technicianId ?? undefined,
    technicianName: r.technicianName || undefined,
    technicianPhone: r.technicianPhone || undefined,
    technicianSpecialty: r.technicianSpecialty || undefined,
  }));
}

export async function getRequestDetail(id: string): Promise<ServiceRequest> {
  const response = await apiClient.get(`/requests/${id}`);
  const r = response.data;
  return {
    id: String(r.id),
    customer: { id: String(r.customerId), name: r.customerName || '', phone: r.customerPhone || '' },
    car: { id: String(r.carId || ''), make: r.carMake || '', model: r.carModel || '', year: r.carYear || 0, plateNumber: r.carPlateNumber, color: r.carColor, mileage: r.carMileage },
    service: r.serviceTypeName || '',
    description: r.description || '',
    location: r.locationAddress || '',
    locationLat: r.locationLat || undefined,
    locationLng: r.locationLng || undefined,
    city: r.city || '',
    status: r.status || 'pending',
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt || '',
    hasQuote: !!(r.quotes && r.quotes.length > 0),
    hasReport: !!r.inspectionReport,
    hasInvoice: false,
    serviceTypeIds: r.serviceTypeIds || [],
    serviceTypes: r.serviceTypes || [],
    technicianId: r.technicianId ?? undefined,
    technicianName: r.technicianName || undefined,
    technicianPhone: r.technicianPhone || undefined,
    technicianSpecialty: r.technicianSpecialty || undefined,
  };
}

export async function updateRequestStatus(id: string, payload: StatusUpdatePayload): Promise<ServiceRequest> {
  const response = await apiClient.put(`/workshops/requests/${id}/status`, payload);
  const r = response.data;
  return {
    id: String(r.id || id),
    customer: { id: '', name: '', phone: '' },
    car: { id: '', make: '', model: '', year: 0 },
    service: '',
    description: '',
    location: '',
    city: '',
    status: r.status || payload.status || 'pending',
    createdAt: '',
    updatedAt: '',
    hasQuote: false,
    hasReport: false,
    hasInvoice: false,
  };
}
