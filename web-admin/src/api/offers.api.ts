import apiClient from './client';
export interface AdminOffer { id:number; workshopId:number; workshopName:string; workshopCity?:string; title:string; description?:string; type:string; serviceNames?:string; originalPrice?:number; offerPrice:number; discountPercent:number; startDate?:string; endDate?:string; isActive:boolean; }
export const offersApi = {
  getAll: async (): Promise<AdminOffer[]> => (await apiClient.get('/admin/offers')).data,
  setStatus: async (id:number,isActive:boolean) => (await apiClient.patch(`/admin/offers/${id}/status`,{isActive})).data,
  remove: async (id:number) => apiClient.delete(`/admin/offers/${id}`),
};
