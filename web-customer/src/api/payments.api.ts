import client from './client';

export const paymentsApi = {
  demo: (requestId: string) => client.post(`/payments/demo/${requestId}`),
  initiate: (data: { requestId: string; amount: number; method: string }) =>
    client.post('/payments/initiate', data),
  initiateTamara: (data: { requestId: string; amount: number }) =>
    client.post('/payments/tamara/initiate', data),
  getById: (id: string) => client.get(`/payments/${id}`),
  getHistory: () => client.get('/payments/history'),
};
