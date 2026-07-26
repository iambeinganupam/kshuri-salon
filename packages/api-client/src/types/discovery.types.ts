// ─────────────────────────────────────────────────────────────────────────────
// Discovery Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-customer-dashboard/src/api/discovery.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { VendorType } from './common.types';

/** Vendor listing in search results (from public_directory_listings MV) */
/** A row returned by /discover/search, /discover/featured, /discover/trending.
 *  Matches the actual backend SELECT shape from discovery.repository.ts +
 *  the url_slug LEFT JOIN added in Phase 6.5. */
export interface VendorSearchResult {
  id: string;
  vendor_type: VendorType;
  business_name: string;
  display_name: string;
  logo_url: string | null;
  /** Cover image — joined in from `freelancer_profiles.cover_image_url`
   *  (freelancers) or `salon_locations.cover_url` (salons). Null when the
   *  vendor hasn't uploaded one. */
  cover_image_url: string | null;
  /** Primary category label denormalised onto the discovery MV. Drives the
   *  category chip on the vendor card. */
  primary_category: string | null;
  /** Aggregated rating, may be a string ('4.71') from numeric — caller should Number() it. */
  avg_rating: number | string | null;
  review_count: number;
  gender_preference?: string | null;
  city: string | null;
  starting_price: number | string | null;
  /** url_slug for deep-linking to /vendors/[slug]. Null for legacy rows that
   *  haven't been backfilled. */
  url_slug: string | null;
  /** Present only on geo-filtered /search queries. */
  distance_km?: number;
}

/** Deep vendor profile returned by /discover/:type/:id and /discover/by-slug/:slug.
 *  Field shapes match the backend's actual SELECT rows from discovery.repository.ts
 *  + the inline-joined services/gallery/reviews/working_hours/staff arrays. */
export interface VendorDetail {
  id: string;
  vendor_type: VendorType;
  business_name: string;
  display_name: string;
  bio?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  /** Backend returns NUMERIC as string ("4.71"). Caller should Number() it. */
  avg_rating: number | string | null;
  review_count: number;
  url_slug?: string | null;
  city?: string | null;
  state?: string | null;
  address_line1?: string | null;
  postal_code?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  email?: string | null;
  is_verified?: boolean;
  years_of_experience?: number | null;
  starting_price?: number | string | null;
  hourly_rate?: number | string | null;
  availability_summary?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
  services: Array<{
    id: string;
    name: string;
    description?: string | null;
    /** NUMERIC string; caller Number()s. */
    price: number | string;
    duration_minutes: number;
    category?: string | null;
    is_featured?: boolean;
    is_trending?: boolean;
    is_active?: boolean;
    gender_target?: string | null;
    /** Where the service is delivered ('onsite' | 'home' | 'both').
     *  The booking flow branches on this to decide whether to collect
     *  a delivery address. Backed by `services.service_location`
     *  (migration 071). */
    service_location?: 'onsite' | 'home' | 'both';
  }>;
  gallery: Array<{
    id: string;
    file_url: string;
    file_key?: string;
    mime_type?: string;
    title?: string | null;
    description?: string | null;
    caption?: string | null;
    media_type?: string;
    is_featured?: boolean;
    is_public?: boolean;
    sort_order?: number;
    service_id?: string | null;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    reviewer_name?: string | null;
    vendor_reply?: string | null;
    created_at: string;
  }>;
  working_hours: Array<{
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }>;
  staff?: Array<{
    id: string;
    name: string;
    role: string;
    rating?: number;
  }>;
  /** Retail products (salons only) — empty for freelancers. */
  products?: Array<{
    id: string;
    name: string;
    description?: string | null;
    /** NUMERIC string; caller Number()s. */
    price: number | string;
    image_url?: string | null;
    category?: string | null;
    stock?: number | null;
    is_active?: boolean;
  }>;
}

/** Review on a vendor profile */
export interface VendorReview {
  id: string;
  customer_name: string;
  avatar_url?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

/** Params for GET /discover/search. Mirrors backend's `searchSchema` in
 *  `backend/src/modules/discovery/discovery.schemas.ts`. */
export interface SearchParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  /** Restrict results to one vendor flavour. Backend's `searchSchema`
   *  enforces the enum. */
  vendor_type?: 'freelancer' | 'salon_location';
  category?: string;
  /** Restrict to vendors offering this specific service (active). */
  service_id?: string;
  min_rating?: number;
  /** Inclusive lower bound on `starting_price` (INR). */
  min_price?: number;
  /** Inclusive upper bound on `starting_price` (INR). Backend rejects when
   *  min_price > max_price. */
  max_price?: number;
  /** When true, restricts to vendors with working hours today. */
  available_today?: boolean;
  sort_by?: 'distance' | 'rating_desc' | 'price_asc';
  q?: string;
  limit?: number;
  cursor?: string;
}

/** Params for GET /discover/featured */
export interface FeaturedVendorsParams {
  /** Restrict to one vendor flavour. */
  vendor_type?: 'freelancer' | 'salon_location';
  /** Max items returned. Backend caps at 20; default 6. */
  limit?: number;
}

/** Params for GET /discover/trending */
export type TrendingVendorsParams = FeaturedVendorsParams;

/** Params for GET /discover/by-slug/:slug. The slug is in the path. */
export interface VendorBySlugParams {
  vendor_type?: 'freelancer' | 'salon_location';
}

// ─────────────────────────────────────────────────────────────────────────────
// Discovery v2 — R1 (search, autocomplete, city landing, near-you, profile)
// ─────────────────────────────────────────────────────────────────────────────
// Wire DTOs are camelCase per R1 naming policy (errata §8.5.2). The backend
// service tier converts NUMERIC strings from `pg` to Number / Math.round and
// emits camelCase keys; types here match the service-tier output.
// Query params remain snake_case (input convention) so callers pass them as
// URL search params verbatim.

/** Params for GET /discover/search (v2). */
export interface SearchParamsV2 {
  q?: string; vendor_type?: 'freelancer'|'salon_location';
  lat?: number; lng?: number; city?: string; radius_km?: number;
  category?: string; service_id?: string;
  gender_target?: 'male'|'female'|'unisex';
  service_mode?: 'home'|'onsite'|'both';
  open_now?: boolean;
  min_rating?: number; min_price?: number; max_price?: number;
  sort_by?: 'relevance'|'distance'|'rating_desc'|'price_asc'|'price_desc'|'popularity';
  limit?: number; cursor?: string;
}

/** A row returned by /discover/search (v2). camelCase wire DTO. */
export interface VendorListItem {
  id: string; slug: string; name: string; type: 'freelancer'|'salon_location';
  ratingAvg: number; ratingCount: number;
  city: string | null; categorySlug: string | null;
  priceMin: number | null; priceMax: number | null;
  photoCount: number; verified: boolean; isOpenNow: boolean;
  coverImageUrl: string | null; logoUrl: string | null;
  distanceKm: number | null;
  lat: number | null; lng: number | null;
}

/** Response for GET /discover/autocomplete. */
export interface AutocompleteResult {
  vendors: Array<{ id: string; slug: string | null; name: string; city: string | null; vendorType: 'freelancer'|'salon_location'; score: number }>;
  services: Array<{ id: string; name: string; vendorSlug: string | null; vendorName: string; vendorType: 'freelancer'|'salon_location'; score: number }>;
  categories: Array<{ id: string; slug: string; name: string }>;
}

/** Response for GET /discover/city/:slug. */
export interface CityLanding {
  topVendors: Array<{ id: string; slug: string | null; name: string; type: 'freelancer'|'salon_location'; ratingAvg: number; ratingCount: number }>;
  topCategories: Array<{ id: string; slug: string; name: string; serviceCount: number }>;
  trendingServices: Array<{ name: string; priceFrom: number; vendorCount: number }>;
}

/** Row returned by GET /discover/near-you. */
export interface NearYouItem {
  id: string; slug: string | null; name: string; type: 'freelancer'|'salon_location';
  ratingAvg: number; ratingCount: number; city: string | null; distanceKm: number;
}

/** Aggregate response for GET /vendors/:slug (v2 profile). */
export interface VendorProfileAggregate {
  vendor: { id: string; slug: string; name: string; type: 'freelancer'|'salon_location'; ratingAvg: number; ratingCount: number; verified: boolean; phone: string | null; websiteUrl: string | null };
  gallery: Array<{ url: string; w: number | null; h: number | null; alt: string | null }>;
  hours: Array<{ dow: number; open: string; close: string; is_closed: boolean }>;
  isOpenNow: boolean;
  address: { line1: string | null; city: string | null; lat: number | null; lng: number | null; region: string | null };
  serviceGroups: Array<{ category: { id: string | null; slug: string | null; name: string | null }; services: Array<{ id: string; name: string; priceInr: number; durationMin: number; genderTarget: string; serviceMode: 'home'|'onsite'|'both'; photos: string[]; ratingAvg: number; ratingCount: number }> }>;
  products: Array<{ id: string; name: string; priceInr: number; category: string | null; photos: string[]; ratingAvg: number; ratingCount: number }>;
  badges: string[];
  reviewAggregate: { ratingAvg: number; ratingCount: number; breakdown: Record<1|2|3|4|5, number>; photoCount: number };
  similarVendorIds: string[];
  faq: Array<{ q: string; a: string }>;
}
