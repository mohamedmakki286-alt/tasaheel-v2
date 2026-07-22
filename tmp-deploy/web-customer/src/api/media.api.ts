import client from './client';

export const mediaApi = {
  upload: (file: File, requestId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('requestId', requestId);
    return client.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => client.delete(`/media/${id}`),
  getByRequest: (requestId: string) => client.get(`/media/request/${requestId}`),
};
