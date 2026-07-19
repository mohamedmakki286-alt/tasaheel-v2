import apiClient from './client';

export interface WorkshopOffer {
  id: number; title: string; description?: string; type: string; serviceNames?: string;
  originalPrice?: number; offerPrice: number; discountPercent: number;
  startDate?: string; endDate?: string; isActive: boolean;
}

export type OfferInput = Omit<WorkshopOffer, 'id' | 'discountPercent'>;

export const offersApi = {
  getMine: async (): Promise<WorkshopOffer[]> => (await apiClient.get('/workshops/my/offers')).data,
  create: async (data: OfferInput): Promise<WorkshopOffer> => (await apiClient.post('/workshops/my/offers', data)).data,
  update: async (id: number, data: OfferInput): Promise<WorkshopOffer> => (await apiClient.put(`/workshops/my/offers/${id}`, data)).data,
  remove: async (id: number) => apiClient.delete(`/workshops/my/offers/${id}`),
};
