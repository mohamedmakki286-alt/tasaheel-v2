import client from './client';
import type { Workshop, WorkshopServiceItem, ReviewSummary } from '../types';

export interface ServiceTemplateItem {
  id: number;
  name: string;
  nameEn?: string;
  categoryId: number;
  categoryName?: string;
  categoryIcon?: string;
  defaultDuration?: string;
  description?: string;
  icon?: string;
}

export interface ServiceCatalogCategory {
  categoryId: number;
  categoryName: string;
  categoryNameEn?: string;
  categoryIcon?: string;
  displayOrder?: number;
  templates: ServiceTemplateItem[];
  workshopCount?: number;
}

export interface ServiceListingItem {
  id: number;
  uuid: string;
  workshopId: number;
  workshopName?: string;
  categoryId: number | null;
  categoryName: string | null;
  serviceTemplateId?: number | null;
  templateName?: string | null;
  name: string;
  description?: string;
  price: number;
  priceType: string;
  estimatedDuration?: string;
  icon?: string;
  images: string[];
  isVisible: boolean;
  isAvailable: boolean;
  displayOrder: number;
}

export interface TemplateWorkshop {
  workshopId: number;
  workshopName: string;
  listingId: number;
  price: number;
  priceType: string;
  estimatedDuration?: string;
  workshopRating: number;
  workshopCity?: string;
  distanceKm?: number;
}

export const workshopsApi = {
  getAll: async (city?: string, type?: string, search?: string): Promise<Workshop[]> => {
    const params: Record<string, string> = {};
    if (city) params.city = city;
    if (type) params.type = type;
    if (search) params.search = search;
    const { data } = await client.get<Workshop[]>('/workshops', { params });
    return data;
  },

  getById: async (id: number): Promise<Workshop> => {
    const { data } = await client.get<Workshop>(`/workshops/${id}`);
    return data;
  },

  getServices: async (workshopId: number): Promise<WorkshopServiceItem[]> => {
    const { data } = await client.get<WorkshopServiceItem[]>(`/workshops/${workshopId}/services`);
    return data;
  },

  getServiceListings: async (workshopId: number): Promise<ServiceListingItem[]> => {
    const { data } = await client.get<ServiceListingItem[]>(`/workshops/${workshopId}/service-listings`);
    return data;
  },

  getReviews: async (workshopId: number): Promise<ReviewSummary[]> => {
    const { data } = await client.get<ReviewSummary[]>(`/reviews/workshop/${workshopId}`);
    return data;
  },

  getGallery: async (workshopId: number): Promise<any[]> => {
    const { data } = await client.get<any[]>(`/workshops/${workshopId}/gallery`);
    return data;
  },

  getCatalog: async (search?: string): Promise<ServiceCatalogCategory[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    const { data } = await client.get<ServiceCatalogCategory[]>('/service-catalog', { params });
    return data;
  },

  getTemplateWorkshops: async (templateId: number, lat?: number, lng?: number): Promise<TemplateWorkshop[]> => {
    const params: Record<string, string> = {};
    if (lat != null) params.lat = String(lat);
    if (lng != null) params.lng = String(lng);
    const { data } = await client.get<TemplateWorkshop[]>(`/service-catalog/templates/${templateId}/workshops`, { params });
    return data;
  },

  getTemplate: async (templateId: number): Promise<ServiceTemplateItem> => {
    const { data } = await client.get<ServiceTemplateItem>(`/service-catalog/templates/${templateId}`);
    return data;
  },
};
