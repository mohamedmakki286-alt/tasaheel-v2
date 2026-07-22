import client from './client';

export const servicesApi = {
  getAll: () => client.get('/services'),

  getById: (id: number) => client.get(`/services/${id}`),

  getWorkshops: (serviceId: number, lat?: number, lng?: number) =>
    client.get(`/services/${serviceId}/workshops`, {
      params: { lat, lng },
    }),
};
