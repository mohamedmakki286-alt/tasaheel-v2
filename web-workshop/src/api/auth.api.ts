import apiClient from './client';
import type { AuthResponse, LoginPayload, RegisterPayload, UpdateProfilePayload, Workshop } from '../types';
import i18n from '../i18n/i18n';

const API = import.meta.env.VITE_API_URL || '/api';

export function mapWorkshopData(resp: any): Workshop {
  return {
    id: String(resp.id || resp.userId),
    name: resp.name || '',
    ownerName: resp.ownerName || '',
    phone: resp.phone || '',
    address: resp.address || '',
    city: resp.city || '',
    workshopType: resp.workshopType || 'stationary',
    services: resp.services ? (typeof resp.services === 'string' ? resp.services.split(',').filter(Boolean) : resp.services) : [],
    description: resp.description || '',
    logoUrl: resp.logoUrl || '',
    coverImageUrl: resp.coverImageUrl || '',
    commercialRegistration: resp.commercialRegistration,
    municipalityLicense: resp.municipalityLicense,
    rejectionReason: resp.rejectionReason,
    isApproved: resp.isApproved,
    rating: resp.rating || 0,
    reviewsCount: resp.reviewCount || resp.reviewsCount || 0,
    completedJobs: resp.completedJobs || 0,
    createdAt: resp.createdAt || new Date().toISOString(),
    workingHours: resp.workingHours || '',
    whatsapp: resp.whatsapp || '',
    website: resp.website || '',
    tiktokUrl: resp.tiktokUrl || '',
    snapchatUrl: resp.snapchatUrl || '',
    facebookUrl: resp.facebookUrl || '',
    instagramUrl: resp.instagramUrl || '',
    xUrl: resp.xUrl || '',
    youtubeUrl: resp.youtubeUrl || '',
    features: resp.features || '',
    latitude: resp.latitude,
    longitude: resp.longitude,
    gallery: resp.gallery || [],
  };
}

export async function login(payload: LoginPayload): Promise<any> {
  const response = await apiClient.post('/auth/login', { email: payload.email, password: payload.password });
  const resp = response.data;
  if (resp.role !== 'workshop' && resp.role !== 'technician') throw new Error(i18n.t('toast.error.workshopOnly'));
  return resp;
}

export async function loginAsWorkshop(payload: LoginPayload): Promise<AuthResponse> {
  const resp = await login(payload);
  if (resp.role !== 'workshop') throw new Error(i18n.t('toast.error.workshopOnly'));
  return {
    token: resp.token,
    refreshToken: resp.refreshToken,
    workshop: mapWorkshopData(resp),
  };
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const formData = new FormData();
  const workshopData: Record<string, any> = {
    name: payload.name, ownerName: payload.ownerName, email: payload.email, password: payload.password,
    address: payload.address, city: payload.city, workshopType: payload.workshopType,
    services: Array.isArray(payload.services) ? payload.services.join(',') : '',
  };
  if (payload.phone) workshopData.phone = payload.phone;
  formData.append('workshop', new Blob([JSON.stringify(workshopData)], { type: 'application/json' }));
  if (payload.commercialRegistration) formData.append('commercialRegistration', payload.commercialRegistration);
  if (payload.municipalityLicense) formData.append('municipalityLicense', payload.municipalityLicense);
  const response = await apiClient.post('/auth/register/workshop', formData, { headers: { 'Content-Type': undefined } });
  const resp = response.data;
  return { token: resp.token, refreshToken: resp.refreshToken, workshop: mapWorkshopData({ ...resp, services: Array.isArray(payload.services) ? payload.services.join(',') : '' }) };
}

export async function getProfile(): Promise<Workshop> {
  const response = await apiClient.get('/workshops/profile');
  return mapWorkshopData(response.data);
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<Workshop> {
  const body: Record<string, any> = {
    name: payload.name,
    ownerName: payload.ownerName,
    phone: payload.phone,
    address: payload.address,
    city: payload.city,
    workshopType: payload.workshopType,
    services: (payload.services || []).join(','),
    description: payload.description ?? '',
    logoUrl: payload.logoUrl ?? '',
    coverImageUrl: payload.coverImageUrl ?? '',
    workingHours: payload.workingHours ?? '',
    whatsapp: payload.whatsapp ?? '',
    website: payload.website ?? '',
    tiktokUrl: payload.tiktokUrl ?? '',
    snapchatUrl: payload.snapchatUrl ?? '',
    facebookUrl: payload.facebookUrl ?? '',
    instagramUrl: payload.instagramUrl ?? '',
    xUrl: payload.xUrl ?? '',
    youtubeUrl: payload.youtubeUrl ?? '',
    features: payload.features ?? '',
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
  };
  const response = await apiClient.put('/workshops/profile', body);
  return mapWorkshopData(response.data);
}

export async function uploadImage(file: File, prefix: string = 'img'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('prefix', prefix);
  const response = await apiClient.post('/media/upload-image', formData, { headers: { 'Content-Type': undefined } });
  return response.data.url;
}

export const galleryApi = {
  getAll: async () => {
    const response = await apiClient.get('/workshops/my/gallery');
    return response.data;
  },
  add: async (mediaUrl: string, mediaType: string = 'image', isCover: boolean = false) => {
    const response = await apiClient.post('/workshops/my/gallery', { mediaUrl, mediaType, isCover });
    return response.data;
  },
  update: async (itemId: number, data: { displayOrder?: number; isCover?: boolean }) => {
    const response = await apiClient.put(`/workshops/my/gallery/${itemId}`, data);
    return response.data;
  },
  remove: async (itemId: number) => {
    const response = await apiClient.delete(`/workshops/my/gallery/${itemId}`);
    return response.data;
  },
};

export const authApi = {
  forgotPassword: (email: string) => fetch(`${API}/auth/password/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) => fetch(`${API}/auth/password/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword }) }),
};
