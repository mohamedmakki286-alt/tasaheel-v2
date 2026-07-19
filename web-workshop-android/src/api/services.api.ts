import apiClient from './client';

export interface ServiceTypeItem {
  id: number;
  name: string;
  nameEn?: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  category: string;
  estimatedDuration?: string;
}

export interface WorkshopServiceItem {
  id?: number;
  workshopId: number;
  workshopName?: string;
  serviceTypeId: number;
  serviceTypeName?: string;
  price: number;
}

export const servicesApi = {
  getAll: () => apiClient.get('/services'),

  getMyServices: () => apiClient.get('/workshops/my-services'),

  updateMyServices: (services: { serviceTypeId: number; price: number }[]) =>
    apiClient.put('/workshops/my-services', services),
};
