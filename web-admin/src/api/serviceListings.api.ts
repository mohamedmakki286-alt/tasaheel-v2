import client from './client';

export interface ServiceListing {
  id: number;
  uuid: string;
  workshopId: number;
  workshopName?: string;
  categoryId: number | null;
  categoryName: string | null;
  name: string;
  description?: string;
  price: number;
  priceType: string;
  estimatedDuration?: string;
  icon?: string;
  images: string[];
  isVisible: boolean;
  isAvailable: boolean;
  displayOrder: number;
  isDeleted: boolean;
  requestCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  serviceId: number | null;
  serviceName: string;
  workshopId: number | null;
  workshopName: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  performedBy: number | null;
  performedByRole: string | null;
  performedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const serviceListingsAdminApi = {
  getAll: async (params?: { search?: string; workshopId?: number; categoryId?: number; page?: number; size?: number }): Promise<PaginatedResponse<ServiceListing>> => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.workshopId) query.set('workshopId', String(params.workshopId));
    if (params?.categoryId) query.set('categoryId', String(params.categoryId));
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size) query.set('size', String(params.size));
    const qs = query.toString();
    const { data } = await client.get(`/admin/service-listings${qs ? '?' + qs : ''}`);
    return data;
  },

  toggleVisibility: async (id: number): Promise<void> => {
    await client.patch(`/admin/service-listings/${id}/toggle-visibility`);
  },

  deleteService: async (id: number): Promise<void> => {
    await client.delete(`/admin/service-listings/${id}`);
  },

  getAuditLog: async (params?: { workshopId?: number; page?: number; size?: number }): Promise<PaginatedResponse<AuditLogEntry>> => {
    const query = new URLSearchParams();
    if (params?.workshopId) query.set('workshopId', String(params.workshopId));
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size) query.set('size', String(params.size));
    const qs = query.toString();
    const { data } = await client.get(`/admin/service-listings/audit${qs ? '?' + qs : ''}`);
    return data;
  },
};
