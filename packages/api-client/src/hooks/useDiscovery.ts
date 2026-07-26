// ─────────────────────────────────────────────────────────────────────────────
// Discovery Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useInfiniteQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as discoveryService from '../services/discovery.service';
import type {
  SearchParams,
  FeaturedVendorsParams,
  TrendingVendorsParams,
  VendorBySlugParams,
  SearchParamsV2,
  VendorProfileAggregate,
} from '../types/discovery.types';
import type { CategoryAudience } from '../types/catalog.types';
import type { VendorType } from '../types/common.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const discoveryKeys = {
  all: ['discover'] as const,
  search: (params: SearchParams) => [...discoveryKeys.all, 'search', params] as const,
  vendor: (type: string, id: string) => [...discoveryKeys.all, 'vendor', type, id] as const,
  vendorBySlug: (slug: string, vendorType?: string) =>
    [...discoveryKeys.all, 'by-slug', slug, vendorType ?? 'any'] as const,
  reviews: (vendorId: string) => [...discoveryKeys.all, 'reviews', vendorId] as const,
  categories: (audience?: CategoryAudience) =>
    [...discoveryKeys.all, 'categories', audience ?? 'grooming'] as const,
  categoryBySlug: (slug: string) =>
    [...discoveryKeys.all, 'categories', 'by-slug', slug] as const,
  featured: (params: FeaturedVendorsParams) => [...discoveryKeys.all, 'featured', params] as const,
  trending: (params: TrendingVendorsParams) => [...discoveryKeys.all, 'trending', params] as const,
  // v2 (R1)
  searchV2: (params: Omit<SearchParamsV2, 'cursor'>) =>
    [...discoveryKeys.all, 'search-v2', params] as const,
  profile: (slug: string) => [...discoveryKeys.all, 'profile', slug] as const,
  autocomplete: (q: string, city?: string) =>
    [...discoveryKeys.all, 'autocomplete', q, city ?? null] as const,
  cityLanding: (slug: string) => [...discoveryKeys.all, 'city', slug] as const,
  nearYou: (lat?: number, lng?: number, limit?: number) =>
    [...discoveryKeys.all, 'near-you', lat ?? null, lng ?? null, limit ?? null] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** Search vendors with geo + filters */
export function useVendorSearch(params: SearchParams, enabled = true) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.search(params),
    queryFn: () => discoveryService.searchVendors(client, params),
    enabled,
  });
}

/** Get full vendor profile */
export function useVendorDetail(vendorType: VendorType, vendorId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.vendor(vendorType, vendorId),
    queryFn: () => discoveryService.getVendorDetail(client, vendorType, vendorId),
    enabled: !!vendorId,
  });
}

/** Get vendor reviews (paginated) */
export function useVendorReviews(
  vendorId: string,
  params?: { sort?: 'recent' | 'highest' | 'lowest'; limit?: number },
) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.reviews(vendorId),
    queryFn: () => discoveryService.getVendorReviews(client, vendorId, params),
    enabled: !!vendorId,
  });
}

/** Get service categories for filter chips + the homepage grid. Pass
 *  `audience` to narrow the visible roots (defaults to grooming server-side). */
export function useServiceCategories(audience?: CategoryAudience) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.categories(audience),
    queryFn: () => discoveryService.getCategories(client, { audience }),
    staleTime: 30 * 60 * 1000, // Categories rarely change
  });
}

/** Resolve a single root category by slug — used by the portal's
 *  /services/[slug] landing pages so routing is DB-backed instead of derived
 *  from a client-side scan. */
export function useCategoryBySlug(slug: string | null | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.categoryBySlug(slug ?? ''),
    queryFn: () => discoveryService.getCategoryBySlug(client, slug as string),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

/** Track a vendor profile view (fire-and-forget). Used by customer apps and
 *  the public web portal when rendering a vendor page. */
export function useTrackVendorView() {
  const client = useApiClient();
  return useMutation({
    mutationFn: ({ vendorType, vendorId }: {
      vendorType: 'freelancer' | 'salon_location';
      vendorId: string;
    }) => discoveryService.trackVendorView(client, vendorType, vendorId),
  });
}

/** Featured vendors for the homepage hero / "Featured" carousel. */
export function useFeaturedVendors(params: FeaturedVendorsParams = {}, enabled = true) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.featured(params),
    queryFn: () => discoveryService.getFeaturedVendors(client, params),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Trending vendors for the homepage "Trending" carousel. */
export function useTrendingVendors(params: TrendingVendorsParams = {}, enabled = true) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.trending(params),
    queryFn: () => discoveryService.getTrendingVendors(client, params),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Resolve `/vendors/[slug]` → full vendor profile. SEO-driven portal route. */
export function useVendorBySlug(slug: string, params: VendorBySlugParams = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.vendorBySlug(slug, params.vendor_type),
    queryFn: () => discoveryService.getVendorBySlug(client, slug, params),
    enabled: !!slug,
  });
}

// ── v2 Queries (R1) ──────────────────────────────────────────────────────────

/** v2 search — geo + facets + cursor pagination via `useInfiniteQuery`. */
export function useVendorSearchV2(
  params: Omit<SearchParamsV2, 'cursor'>,
  enabled = true,
) {
  const client = useApiClient();
  return useInfiniteQuery({
    queryKey: discoveryKeys.searchV2(params),
    queryFn: ({ pageParam }) =>
      discoveryService.searchVendorsV2(client, {
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
  });
}

/** v2 vendor profile aggregate keyed by url_slug. */
export function useVendorProfile(
  slug: string,
  opts?: Partial<UseQueryOptions<VendorProfileAggregate>>,
) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.profile(slug),
    queryFn: () => discoveryService.getVendorProfileBySlug(client, slug),
    enabled: !!slug,
    ...opts,
  });
}

/** Autocomplete suggestions — enabled only when q has 2+ chars; 30s staleTime. */
export function useAutocomplete(q: string, city?: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.autocomplete(q, city),
    queryFn: () => discoveryService.autocomplete(client, { q, city }),
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}

/** City landing page — top vendors + categories + trending services. */
export function useCityLanding(slug: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.cityLanding(slug),
    queryFn: () => discoveryService.cityLanding(client, slug),
    enabled: !!slug,
  });
}

/** Near-you vendors — enabled only when both lat and lng provided. */
export function useNearYou(lat?: number, lng?: number, limit = 10) {
  const client = useApiClient();
  return useQuery({
    queryKey: discoveryKeys.nearYou(lat, lng, limit),
    queryFn: () => discoveryService.nearYou(client, { lat: lat!, lng: lng!, limit }),
    enabled: lat !== undefined && lng !== undefined,
  });
}
