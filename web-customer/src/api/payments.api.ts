import client from './client';

export const paymentsApi = {
  initiate: (data: { requestId: string; amount: number; method: string; idempotencyKey: string }) =>
    client.post('/payments/initiate', data),
  initiateTamara: (data: { requestId: string; amount: number }) =>
    client.post('/payments/tamara/initiate', data),
  getById: (id: string) => client.get(`/payments/${id}`),
  verify: (id: string) => client.post(`/payments/${id}/verify`),
  getHistory: () => client.get('/payments/history'),
};
