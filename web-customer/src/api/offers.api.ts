import client from './client';
export interface PublicOffer {
  id:number; workshopId:number; workshopName:string; workshopRating:number; workshopCity?:string;
  title:string; description?:string; type:string; serviceNames?:string; originalPrice?:number;
  offerPrice:number; discountPercent:number; startDate?:string; endDate?:string;
}
export const offersApi = {
  getAll: async (): Promise<PublicOffer[]> => (await client.get('/offers')).data,
  getByWorkshop: async (id:number): Promise<PublicOffer[]> => (await client.get(`/workshops/${id}/offers`)).data,
};
