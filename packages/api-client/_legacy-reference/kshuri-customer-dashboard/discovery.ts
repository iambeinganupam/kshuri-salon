// ─────────────────────────────────────────────────────────────────────────────
// API Module: Discovery — salon-connect-hub (B2C Customer)
// Backend: /api/v1/discover
// Endpoints: DISC-01 … DISC-04
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VendorSearchResult {
  id: string;
  entity_type: 'salon_location' | 'freelancer';
  display_name: string;
  url_slug: string;
  distance_km?: number;
  average_rating: number;
  review_count: number;
  starting_price?: number;
  featured_image_url?: string;
  location?: { lat: number; lng: number };
  categories_offered?: string[];
}

export interface VendorService {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  category: string;
}

export interface VendorDetail {
  id: string;
  entity_type: 'salon_location' | 'freelancer';
  display_name: string;
  bio?: string;
  average_rating: number;
  review_count: number;
  location?: { lat: number; lng: number; city?: string };
  services: VendorService[];
  gallery: Array<{ id: string; url: string; caption?: string; is_featured: boolean }>;
  working_hours: Array<{
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }>;
  staff?: Array<{ id: string; name: string; role: string; rating?: number }>;
}

export interface ServiceCategory {
  id: string;
  name: string;
  subcategories: Array<{ id: string; name: string }>;
}

export interface VendorReview {
  id: string;
  customer_name: string;
  avatar_url?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface SearchParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  category?: string;
  min_rating?: number;
  sort_by?: 'distance' | 'rating_desc' | 'price_asc';
  q?: string;
  limit?: number;
  cursor?: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * DISC-01: Search vendors by geo + filters
 */
export async function searchVendors(params: SearchParams): Promise<{
  items: VendorSearchResult[];
  has_more: boolean;
}> {
  const { data } = await apiClient.get<{
    success: true;
    data: VendorSearchResult[];
    meta: { has_more: boolean };
  }>('/discover/search', { params });
  return { items: data.data, has_more: data.meta?.has_more ?? false };
}

/**
 * DISC-02: Get all service categories (for filter chips)
 */
export async function getCategories(): Promise<ServiceCategory[]> {
  const { data } = await apiClient.get<{ success: true; data: ServiceCategory[] }>(
    '/discover/categories',
  );
  return data.data;
}

/**
 * DISC-03: Get full vendor profile by type + ID
 */
export async function getVendorDetail(
  vendorType: 'salon_location' | 'freelancer',
  vendorId: string,
): Promise<VendorDetail> {
  const { data } = await apiClient.get<{ success: true; data: VendorDetail }>(
    `/discover/${vendorType}/${vendorId}`,
  );
  return data.data;
}

/**
 * DISC-04: Get paginated reviews for a vendor
 */
export async function getVendorReviews(
  vendorId: string,
  params?: { sort?: 'recent' | 'highest' | 'lowest'; limit?: number; cursor?: string },
): Promise<{ items: VendorReview[]; has_more: boolean }> {
  const { data } = await apiClient.get<{
    success: true;
    data: VendorReview[];
    meta: { has_more: boolean };
  }>(`/discover/vendors/${vendorId}/reviews`, { params });
  return { items: data.data, has_more: data.meta?.has_more ?? false };
}

// Legacy export to keep existing pages that import DiscoveryAPI working
export const DiscoveryAPI = {
  getAllVendors: () => searchVendors({}),
  searchVendors,
  getCategories,
  getVendorDetail,
  getVendorReviews,
};
