import client from './client';

export const requestsApi = {
  getAll: () => client.get('/requests'),
  getById: (id: string) => client.get(`/requests/${id}`),
  create: (data: {
    carIdInput: string;
    serviceTypeIdsInput?: string[];
    description: string;
    city: string;
    locationLat?: number;
    locationLng?: number;
    locationAddress?: string;
    executionMethod?: string;
    workshopIds?: number[];
  }, draft?: boolean) => client.post(`/requests${draft ? '?draft=true' : ''}`, data),

  getDrafts: () => client.get('/requests/drafts'),

  submitDraft: (id: string) => client.put(`/requests/${id}/submit`),
  cancel: (id: string) => client.post(`/requests/${id}/cancel`),
  getQuotes: (id: string) => client.get(`/requests/${id}/quotes`),
  acceptQuote: (requestId: string, quoteId: string) =>
    client.post(`/requests/${requestId}/quotes/${quoteId}/accept`),
  rejectQuote: (requestId: string, quoteId: string, reason?: string) =>
    client.post(`/requests/${requestId}/quotes/${quoteId}/reject`, reason ? { reason } : {}),
  getSubOrders: (requestId: string) =>
    client.get(`/requests/${requestId}/sub-orders`),
  getTimeline: (id: string) => client.get(`/requests/${id}/timeline`),
  approveReport: (id: string) => client.post(`/requests/${id}/approve-report`),
  rejectReport: (id: string) => client.post(`/requests/${id}/reject-report`),
  getTechnician: (id: string) => client.get(`/requests/${id}/technician`),
  createTransportRequest: (id: string) => client.post(`/requests/${id}/transport-request`),
};
