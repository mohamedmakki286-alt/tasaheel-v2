import client, { mapPage } from './client';
import type { Customer, PaginatedResponse } from '../types';

export async function getCustomers(params?: Record<string, any>): Promise<PaginatedResponse<Customer>> {
  const { data } = await client.get<any>('/admin/customers', { params: { ...params, page: params?.page != null ? params.page - 1 : 0 } });
  const page = mapPage<any>(data);
  return {
    ...page,
    data: page.data.map((customer) => ({
      ...customer,
      joinedAt: customer.joinedAt ?? customer.createdAt ?? null,
      carsCount: Number(customer.carsCount ?? 0),
      requestsCount: Number(customer.requestsCount ?? 0),
    })),
  };
}

export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await client.get<Customer>(`/admin/customers/${id}`);
  const customer = data as any;
  return {
    ...customer,
    joinedAt: customer.joinedAt ?? customer.createdAt ?? null,
    carsCount: Number(customer.carsCount ?? 0),
    requestsCount: Number(customer.requestsCount ?? 0),
  };
}

export async function toggleCustomerStatus(id: number, isActive: boolean): Promise<void> {
  await client.put(`/admin/users/customer/${id}/toggle-status`, { isActive });
}

export async function deleteCustomer(id: number): Promise<void> {
  await client.delete(`/admin/users/customer/${id}`);
}
