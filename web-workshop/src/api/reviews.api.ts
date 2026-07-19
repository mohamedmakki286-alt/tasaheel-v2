import apiClient from './client';
import type { Review } from '../types';

export async function getMyReviews(workshopId?: string): Promise<Review[]> {
  if (!workshopId) return [];
  const response = await apiClient.get(`/reviews/workshop/${workshopId}`);
  const data = response.data;
  const list = data?.data?.content || (Array.isArray(data) ? data : []);
  return list.map((r: any) => ({
    id: String(r.id),
    customer: { id: String(r.customerId || ''), name: r.customerName || '', phone: '' },
    workshopId: String(r.workshopId || workshopId || ''),
    requestId: String(r.requestId || ''),
    rating: r.rating || 5,
    comment: r.comment || '',
    createdAt: r.createdAt || '',
  }));
}
