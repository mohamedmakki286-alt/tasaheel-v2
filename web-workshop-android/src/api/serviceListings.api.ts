import apiClient from './client';

export interface ServiceCategory {
  id: number;
  name: string;
  nameEn?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  serviceCount?: number;
  createdAt?: string;
}

export interface ServiceTemplate {
  id: number;
  name: string;
  nameEn?: string;
  categoryId: number;
  categoryName?: string;
  categoryIcon?: string;
  defaultDuration?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface ServiceCatalogCategory {
  categoryId: number;
  categoryName: string;
  categoryNameEn?: string;
  categoryIcon?: string;
  displayOrder?: number;
  templates: ServiceTemplate[];
  workshopCount?: number;
}

export interface ServiceListing {
  id: number;
  uuid: string;
  workshopId: number;
  workshopName?: string;
  categoryId: number | null;
  categoryName: string | null;
  serviceTemplateId?: number | null;
  templateName?: string | null;
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

export interface CreateServiceListingRequest {
  name: string;
  description?: string;
  price: number;
  priceType?: string;
  categoryId?: number;
  serviceTemplateId?: number;
  estimatedDuration?: string;
  icon?: string;
  isVisible?: boolean;
  isAvailable?: boolean;
  displayOrder?: number;
}

export interface UpdateServiceListingRequest {
  name?: string;
  description?: string;
  price?: number;
  priceType?: string;
  categoryId?: number | null;
  estimatedDuration?: string;
  icon?: string;
  isVisible?: boolean;
  isAvailable?: boolean;
  displayOrder?: number;
}

export const serviceListingsApi = {
  getCategories: () => apiClient.get('/categories').then(res => Array.isArray(res.data) ? res.data : (res.data?.data ?? [])),

  getCatalog: async (search?: string): Promise<ServiceCatalogCategory[]> => {
    const response = await apiClient.get('/service-catalog', { params: search ? { search } : {} });
    const catalog = Array.isArray(response.data)
      ? response.data
      : (response.data?.data ?? []);
    return catalog;
  },

  getCatalogCategory: (categoryId: number) => apiClient.get(`/service-catalog/${categoryId}`).then(res => res.data?.data ?? res.data),

  getMyServices: () => apiClient.get('/workshops/my/service-listings').then(res => res.data),

  createService: (data: CreateServiceListingRequest) =>
    apiClient.post('/workshops/my/service-listings', data).then(res => res.data),

  updateService: (id: number, data: UpdateServiceListingRequest) =>
    apiClient.put(`/service-listings/${id}`, data).then(res => res.data),

  patchService: (id: number, data: UpdateServiceListingRequest) =>
    apiClient.patch(`/service-listings/${id}`, data).then(res => res.data),

  deleteService: (id: number) =>
    apiClient.delete(`/service-listings/${id}`).then(res => res.data),

  duplicateService: (id: number) =>
    apiClient.post(`/service-listings/${id}/duplicate`).then(res => res.data),

  restoreService: (id: number) =>
    apiClient.post(`/service-listings/${id}/restore`).then(res => res.data),

  reorderServices: (serviceIds: number[]) =>
    apiClient.post('/workshops/my/service-listings/reorder', { serviceIds }).then(res => res.data),
};
