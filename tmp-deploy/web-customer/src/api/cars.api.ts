import client from './client';

export const carsApi = {
  getAll: () => client.get('/customers/cars'),
  create: (data: { make: string; model: string; year: number; color?: string; plateNumber?: string; mileage?: number; nextOilChangeDate?: string; nextOilChangeMileage?: number; nextAppointmentDate?: string }) =>
    client.post('/customers/cars', data),
  update: (id: string, data: Partial<{ make: string; model: string; year: number; color: string; plateNumber: string; mileage: number; nextOilChangeDate: string; nextOilChangeMileage: number; nextAppointmentDate: string }>) =>
    client.put(`/customers/cars/${id}`, data),
  delete: (id: string) => client.delete(`/customers/cars/${id}`),
};
