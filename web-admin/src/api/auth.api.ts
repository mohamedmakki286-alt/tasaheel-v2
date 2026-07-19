import client from './client';
import type { LoginPayload, LoginResponse, User } from '../types';
import i18n from '../i18n/i18n';

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/auth/login', { email: payload.email, password: payload.password });
  if (data.role !== 'admin' && data.role !== 'super_admin') throw new Error(i18n.t('toast.error.adminOnly'));
  return data;
}

export async function getProfile(): Promise<User> {
  const { data } = await client.get<User>('/admin/profile');
  return data;
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout');
}

export async function updateProfile(payload: { name: string; email: string; phone: string }): Promise<User> {
  const { data } = await client.put<User>('/admin/profile', payload);
  return data;
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  await client.post('/admin/password/change', payload);
}
