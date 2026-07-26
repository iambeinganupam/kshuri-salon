// ─────────────────────────────────────────────────────────────────────────────
// Vendor-agnostic profile types.
//
// Both the salon dashboard (`vendor_type: "salon_location"`) and the
// freelancer dashboard (`vendor_type: "freelancer"`) map their domain types
// into these shapes before passing them to the shared profile components.
// ─────────────────────────────────────────────────────────────────────────────

export type VendorType = "salon_location" | "freelancer";

export interface Certification {
  name: string;
  issuer: string;
  year: number;
  credential_id?: string;
}

export interface WorkingHours {
  /** 0 = Sunday … 6 = Saturday */
  day_of_week: number;
  /** "HH:MM" 24-hour clock, or `null` when closed */
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface VendorProfile {
  id: string;
  vendor_type: VendorType;

  /** Public-facing slug used by the customer portal's `/vendors/{slug}` route.
   *  Null for legacy rows that don't have a slug assigned yet — share/CTA
   *  affordances degrade to disabled when this is missing. */
  url_slug: string | null;

  display_name: string;
  tagline: string | null;
  description: string | null;
  primary_category: string | null;

  /** Stats from `engagement` */
  rating_avg: number | null;
  rating_count: number;
  view_count: number;
  favorite_count: number;

  /** Media */
  banner_url: string | null;
  logo_url: string | null;
  /** Up to ~4 thumbnails surfaced in the hero banner */
  banner_gallery: string[];

  /** Contact + location */
  address_full: string | null;
  city: string | null;
  phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;

  /** Trust + tenure */
  is_verified: boolean;
  years_in_business: number | null;

  /** Tags */
  specializations: string[];
  languages: string[];

  /**
   * Service category labels surfaced as chips under the rating row
   * (derived from the vendor's active services).
   */
  category_tags: string[];

  /** Salon-only — empty array for freelancers */
  amenity_keys: string[];

  certifications: Certification[];

  /** Pricing snapshot */
  price_min: number | null;
  price_max: number | null;
  /** Freelancer-only hourly rate — null for salons */
  hourly_rate?: number | null;

  /**
   * Business-type label shown as the small uppercase pill in the header
   * (e.g. "Salon & Spa", "Independent Freelancer").
   */
  business_type_label: string | null;

  /** Today's open/close state — null when not yet known. */
  is_open_now: boolean | null;
  /** "HH:MM" 24-hour, or null when closed today. */
  today_open_time: string | null;
  today_close_time: string | null;
}

export interface VendorService {
  id: string;
  name: string;
  description: string | null;
  /** Display price in the smallest currency unit's friendly form (₹) */
  price: number;
  duration_minutes: number | null;
  category: string | null;
  is_active: boolean;
  trending: boolean;
  featured: boolean;
  /**
   * Vendor-authored "What's Included" bullet points shown in the service
   * detail sheet's About tab. Empty array hides the section.
   * Server-side this is `services.inclusions` (JSONB array of strings).
   */
  inclusions: string[];
}

export interface VendorProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

export interface VendorMedia {
  id: string;
  url: string;
  caption: string | null;
  service_id: string | null;
  service_name?: string | null;
  /** Service category (denormalised for filter chips) */
  service_category?: string | null;
}

/**
 * Review row as surfaced on the vendor's public profile.
 *
 * Wire shape matches `@kshuri/api-client/types#VendorReviewItem` so adapters
 * can pass API responses through without reshaping. Kept inline here to
 * keep `@kshuri/ui` free of runtime dependencies on the api-client.
 */
export interface VendorReviewItem {
  id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  vendor_reply: string | null;
  created_at: string;
}

/** Aggregated rating distribution returned alongside the review list. */
export interface VendorReviewSummary {
  total_count: number;
  avg_rating: number;
  rating_5: number;
  rating_4: number;
  rating_3: number;
  rating_2: number;
  rating_1: number;
}
