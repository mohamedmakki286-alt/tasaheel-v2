import client from './client';

export const reviewsApi = {
  create: (data: { requestId: string; workshopId: string; rating: number; comment?: string }) =>
    client.post('/reviews', data),
  getMyReviews: () => client.get('/reviews/customer'),
  getWorkshopReviews: (workshopId: string) => client.get(`/reviews/workshop/${workshopId}`),
};
