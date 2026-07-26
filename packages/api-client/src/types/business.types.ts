// ─────────────────────────────────────────────────────────────────────────────
// Business Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-salon-dashboard/src/api/business.ts
//   - kshuri-freelancer-dashboard/src/api/roster.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Curated picker options for the salon-profile editor. The persisted values on
 * `BusinessProfile.specializations` / `.languages` come from the API and are
 * free-form `TEXT[]` columns server-side — these constants only seed the UI
 * dropdowns. Promote to an admin-managed taxonomy table when the list needs
 * to vary per-region or per-deployment.
 */
export const SALON_SPECIALIZATIONS = [
  'Hair', 'Skin', 'Nails', 'Makeup', 'Beard', 'Bridal', 'Spa', 'Massage',
] as const;

export const SALON_LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Urdu',
] as const;

/**
 * Closed taxonomy of salon-location amenities. Mirrored on the backend in
 * `business.schemas.ts#SALON_AMENITY_KEYS`. The `key` is what's persisted in
 * `salon_locations.amenities[]`; `label` and `group` are display metadata
 * shared across all dashboards. Icons are mapped per-app (kept out of this
 * type package so it stays React-free and re-usable in non-React contexts
 * like the Next.js portal's server components or the admin scripts).
 *
 * Add new entries at the end. Don't reorder, don't remove without a backfill
 * migration that drops removed keys from existing rows.
 */
export const SALON_AMENITY_GROUPS = [
  'Comfort', 'Accessibility', 'Payments', 'Booking', 'Other',
] as const;
export type SalonAmenityGroup = (typeof SALON_AMENITY_GROUPS)[number];

export interface SalonAmenityDef {
  key: string;
  label: string;
  group: SalonAmenityGroup;
}

export const SALON_AMENITIES: readonly SalonAmenityDef[] = [
  { key: 'wifi',                  label: 'Free Wi-Fi',           group: 'Comfort' },
  { key: 'air_conditioning',      label: 'Air-conditioning',     group: 'Comfort' },
  { key: 'music',                 label: 'Music',                group: 'Comfort' },
  { key: 'beverages',             label: 'Tea / coffee / water', group: 'Comfort' },
  { key: 'water',                 label: 'Drinking water',       group: 'Comfort' },
  { key: 'magazines',             label: 'Magazines',            group: 'Comfort' },
  { key: 'charging_station',      label: 'Phone charging',       group: 'Comfort' },
  { key: 'private_rooms',         label: 'Private treatment rooms', group: 'Comfort' },
  { key: 'changing_room',         label: 'Changing room',        group: 'Comfort' },
  { key: 'restroom',              label: 'Restroom',             group: 'Comfort' },

  { key: 'parking',               label: 'Parking available',    group: 'Accessibility' },
  { key: 'wheelchair_accessible', label: 'Wheelchair accessible', group: 'Accessibility' },
  { key: 'kid_friendly',          label: 'Kid-friendly',         group: 'Accessibility' },
  { key: 'pet_friendly',          label: 'Pet-friendly',         group: 'Accessibility' },
  { key: 'female_only',           label: 'Women-only branch',    group: 'Accessibility' },

  { key: 'card_payment',          label: 'Card payment',         group: 'Payments' },
  { key: 'upi_payment',           label: 'UPI payment',          group: 'Payments' },
  { key: 'cash_payment',          label: 'Cash accepted',        group: 'Payments' },

  { key: 'walk_ins_welcome',      label: 'Walk-ins welcome',     group: 'Booking' },
  { key: 'online_booking',        label: 'Online booking',       group: 'Booking' },
  { key: 'gift_cards',            label: 'Gift cards',           group: 'Booking' },
  { key: 'loyalty_program',       label: 'Loyalty program',      group: 'Booking' },
] as const;

/** Cheap O(1) lookup by key — useful when rendering a stored list. */
export const SALON_AMENITIES_BY_KEY: Readonly<Record<string, SalonAmenityDef>> =
  Object.freeze(Object.fromEntries(SALON_AMENITIES.map((a) => [a.key, a])));

/** A professional certification listed on the salon's public profile */
export interface BusinessCertification {
  name: string;
  issuer: string;
  year: number;
  credential_id?: string;
}

/** Business account (parent entity for salon chains) */
export interface BusinessProfile {
  id: string;
  legal_business_name: string;
  brand_name?: string;
  display_name?: string;
  description?: string;
  tagline?: string;
  specializations?: string[];
  languages?: string[];
  logo_url?: string;
  cover_image_url?: string;
  website_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  years_in_business?: number;
  certifications?: BusinessCertification[];
  contact_email?: string;
  contact_phone?: string;
  /** All address fields below are read from / written to the primary salon_locations row */
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  /** Physical-location attributes (wifi, parking, AC, ...) — also lives on the primary salon_locations row */
  amenities?: string[];
  kyc_verified?: boolean;
  /** Vendor-collected payment identity (Phase 1 manual UPI). When set,
   *  the salon dashboard can generate UPI deep-links / QRs for customers
   *  to scan at checkout. Lives on business_accounts so multi-location
   *  chains share a single payee identity. */
  upi_id?: string | null;
  upi_display_name?: string | null;
  /** End of currently-paid subscription window. null/past = on the default
   *  pay-as-you-go fallback (commission applies per booking). */
  subscription_active_until?: string | null;
  /** Computed by GET /business/profile — not a column on business_accounts */
  primary_location_id?: string;
  /** Public-facing slug from the primary `salon_locations` row. Used to build
   *  the shareable customer-portal URL (`/vendors/{url_slug}`). `null` when
   *  the location has no slug yet (legacy data) — UI should disable share. */
  url_slug?: string | null;
  /** Computed: avg_rating from primary salon_locations row */
  avg_rating?: number;
  /** Computed: review_count from primary salon_locations row */
  review_count?: number;
  /** Computed counts */
  location_count?: number;
  staff_count?: number;
  billing_method?: 'per_booking' | 'subscription';
  payment_gateway?: 'stripe' | 'razorpay' | 'mock';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Individual salon location under a business account */
export interface SalonLocation {
  id: string;
  business_account_id: string;
  display_name: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
}

/** Staff member role within a salon */
export type StaffRole = 'senior_stylist' | 'junior_stylist' | 'manager' | 'receptionist';

/** Staff member attached to a salon location */
export interface StaffMember {
  id: string;
  user_id: string;
  role: StaffRole;
  commission_percentage: number;
  is_active: boolean;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

/** Payload for POST /business/staff/invite */
export interface InviteStaffPayload {
  email: string;
  role: StaffRole;
  commission_percentage: number;
  location_id: string;
}

/** Staff schedule with shifts */
export interface StaffSchedule {
  shifts: Array<{
    id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    type: string;
    is_approved: boolean;
  }>;
}

/** Business subscription plan */
export interface Subscription {
  plan: 'free' | 'standard' | 'pro';
  status: 'active' | 'past_due' | 'cancelled';
  current_period_end: string;
  features: string[];
}
