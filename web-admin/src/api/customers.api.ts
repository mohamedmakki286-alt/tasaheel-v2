import client, { mapPage } from './client';
import type { Customer, PaginatedResponse } from '../types';

export async function getCustomers(params?: Record<string, any>): Promise<PaginatedResponse<Customer>> {
  const { data } = await client.get<any>('/admin/customers', { params: { ...params, page: params?.page != null ? params.page - 1 : 0 } });
  return mapPage(data);
}

export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await client.get<Customer>(`/admin/customers/${id}`);
  return data;
}

export async function toggleCustomerStatus(id: number, isActive: boolean): Promise<void> {
  await client.put(`/admin/users/customer/${id}/toggle-status`, { isActive });
}

export async function deleteCustomer(id: number): Promise<void> {
  await client.delete(`/admin/users/customer/${id}`);
}
