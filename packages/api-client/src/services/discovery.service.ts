// ─────────────────────────────────────────────────────────────────────────────
// Discovery Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  VendorSearchResult,
  VendorDetail,
  VendorReview,
  SearchParams,
  FeaturedVendorsParams,
  TrendingVendorsParams,
  VendorBySlugParams,
  SearchParamsV2,
  VendorListItem,
  VendorProfileAggregate,
  AutocompleteResult,
  CityLanding,
  NearYouItem,
} from '../types/discovery.types';
import type { ServiceCategory, CategoryAudience } from '../types/catalog.types';
import type { PaginatedResult } from '../client/types';

/** DISC-01: Search vendors by geo + filters */
export async function searchVendors(
  client: AxiosInstance,
  params: SearchParams,
): Promise<PaginatedResult<VendorSearchResult>> {
  // `/discover/search` serves the v2 payload (VendorListItem, camelCase) with
  // cursor pagination. Map it back to the v1 VendorSearchResult shape so the
  // existing portal/dashboard consumers of this helper keep working without a
  // rewrite. (v2-native callers should use searchVendorsV2 directly.)
  const { data } = await client.get<{
    success: true;
    data: VendorListItem[];
    meta: { nextCursor: string | null };
  }>('/discover/search', { params });
  const items = data.data.map((v) => ({
    id: v.id,
    vendor_type: v.type,
    business_name: v.name,
    display_name: v.name,
    logo_url: v.logoUrl,
    cover_image_url: v.coverImageUrl,
    primary_category: v.categorySlug,
    avg_rating: v.ratingAvg,
    review_count: v.ratingCount,
    gender_preference: null,
    city: v.city,
    starting_price: v.priceMin,
    url_slug: v.slug,
  })) as unknown as VendorSearchResult[];
  return { items, has_more: data.meta?.nextCursor != null };
}

/** DISC-02: Get service categories (audience-filterable). */
export async function getCategories(
  client: AxiosInstance,
  opts?: { audience?: CategoryAudience },
): Promise<ServiceCategory[]> {
  const { data } = await client.get<{ success: true; data: ServiceCategory[] }>(
    '/discover/categories',
    { params: opts?.audience ? { audience: opts.audience } : undefined },
  );
  return data.data;
}

/** DISC-02b: Resolve a category by slug. Returns the root + its subs. Throws
 *  when the slug doesn't match an active root (axios surfaces a 404). */
export async function getCategoryBySlug(
  client: AxiosInstance,
  slug: string,
): Promise<ServiceCategory> {
  const { data } = await client.get<{ success: true; data: ServiceCategory }>(
    `/discover/categories/${encodeURIComponent(slug)}`,
  );
  return data.data;
}

/** DISC-03: Get full vendor profile */
export async function getVendorDetail(
  client: AxiosInstance,
  vendorType: 'salon_location' | 'freelancer',
  vendorId: string,
): Promise<VendorDetail> {
  const { data } = await client.get<{ success: true; data: VendorDetail }>(
    `/discover/${vendorType}/${vendorId}`,
  );
  return data.data;
}

/** DISC-04: Get vendor reviews (paginated) */
export async function getVendorReviews(
  client: AxiosInstance,
  vendorId: string,
  params?: { sort?: 'recent' | 'highest' | 'lowest'; limit?: number; cursor?: string },
): Promise<PaginatedResult<VendorReview>> {
  const { data } = await client.get<{
    success: true;
    data: VendorReview[];
    meta: { has_more: boolean };
  }>(`/discover/vendors/${vendorId}/reviews`, { params });
  return { items: data.data, has_more: data.meta?.has_more ?? false };
}

/** DISC-05: Track a vendor profile view. Fire-and-forget; safe to call from
 *  unauthenticated public pages. */
export async function trackVendorView(
  client: AxiosInstance,
  vendorType: 'freelancer' | 'salon_location',
  vendorId: string,
): Promise<void> {
  await client.post(`/discover/vendors/${vendorType}/${vendorId}/view`);
}

/** B2: Featured vendors (grooming-audience). Backend signal: services.is_featured;
 *  falls back to top-rated when fewer than `limit` rows. */
export async function getFeaturedVendors(
  client: AxiosInstance,
  params: FeaturedVendorsParams = {},
): Promise<VendorSearchResult[]> {
  const { data } = await client.get<{ success: true; data: VendorSearchResult[] }>(
    '/discover/featured',
    { params },
  );
  return data.data;
}

/** B3: Trending vendors (grooming-audience). Backend signal: services.is_trending +
 *  recent booking volume. */
export async function getTrendingVendors(
  client: AxiosInstance,
  params: TrendingVendorsParams = {},
): Promise<VendorSearchResult[]> {
  const { data } = await client.get<{ success: true; data: VendorSearchResult[] }>(
    '/discover/trending',
    { params },
  );
  return data.data;
}

/** B4: Resolve a vendor slug to a full vendor profile. Used by /vendors/[slug]
 *  on the customer portal for SEO-friendly URLs. */
export async function getVendorBySlug(
  client: AxiosInstance,
  slug: string,
  params: VendorBySlugParams = {},
): Promise<VendorDetail> {
  const { data } = await client.get<{ success: true; data: VendorDetail }>(
    `/discover/by-slug/${encodeURIComponent(slug)}`,
    { params },
  );
  return data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Discovery v2 — R1 (geo + facets + cursor search, autocomplete, city, near-you, profile aggregate)
// ─────────────────────────────────────────────────────────────────────────────

/** v2 search: geo + facets + cursor. The backend `/discover/search` already
 *  routes here as of R1 Task 4.6 — the v1 response shape no longer exists. */
export async function searchVendorsV2(
  client: AxiosInstance,
  params: SearchParamsV2,
): Promise<{ items: VendorListItem[]; nextCursor: string | null }> {
  const { data } = await client.get<{
    success: true;
    data: VendorListItem[];
    meta: { nextCursor: string | null };
  }>('/discover/search', { params });
  return { items: data.data, nextCursor: data.meta?.nextCursor ?? null };
}

/** v2 vendor profile aggregate keyed by url_slug. */
export async function getVendorProfileBySlug(
  client: AxiosInstance,
  slug: string,
): Promise<VendorProfileAggregate> {
  const { data } = await client.get<{ success: true; data: VendorProfileAggregate }>(
    `/discover/vendors/${encodeURIComponent(slug)}/profile`,
  );
  return data.data;
}

/** Autocomplete for the search bar — vendors, services, categories. */
export async function autocomplete(
  client: AxiosInstance,
  params: { q: string; city?: string; lat?: number; lng?: number },
): Promise<AutocompleteResult> {
  const { data } = await client.get<{ success: true; data: AutocompleteResult }>(
    '/discover/autocomplete',
    { params },
  );
  return data.data;
}

/** City landing page payload — top vendors, top categories, trending services. */
export async function cityLanding(
  client: AxiosInstance,
  slug: string,
): Promise<CityLanding> {
  const { data } = await client.get<{ success: true; data: CityLanding }>(
    `/discover/city/${encodeURIComponent(slug)}`,
  );
  return data.data;
}

/** Near-you vendors by lat/lng. */
export async function nearYou(
  client: AxiosInstance,
  params: { lat: number; lng: number; limit?: number },
): Promise<NearYouItem[]> {
  const { data } = await client.get<{ success: true; data: NearYouItem[] }>(
    '/discover/near-you',
    { params },
  );
  return data.data;
}
