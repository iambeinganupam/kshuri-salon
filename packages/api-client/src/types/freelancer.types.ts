// ─────────────────────────────────────────────────────────────────────────────
// Freelancer Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Mirrors the response shapes returned by /api/v1/freelancer/*.
// Source of truth: backend/src/modules/freelancer/freelancer.repository.ts
// ─────────────────────────────────────────────────────────────────────────────

/** Joined freelancer profile (freelancer_profiles + users). */
export interface FreelancerProfile {
  id: string;
  user_id: string;
  business_name: string;
  display_name: string | null;
  bio: string | null;
  /** Public-facing slug used to build the shareable customer-portal URL
   *  (`/vendors/{url_slug}`). `null` for legacy rows without a slug — UI
   *  should disable share in that case. */
  url_slug: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country_code: string;
  contact_phone: string | null;
  /** Vendor-published contact email — distinct from `users.email` identity. */
  contact_email: string | null;
  category: string | null;
  gender_preference: string | null;
  is_verified: boolean;
  is_active: boolean;
  /** Whether the freelancer is currently online and accepting new bookings. */
  is_open_to_work: boolean;
  /** ISO timestamp of the last off→on transition. NULL while offline. */
  online_since_at: string | null;
  avg_rating: number;
  review_count: number;
  starting_price: number | null;
  hourly_rate: number | null;
  years_of_experience: number | null;
  availability_summary: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
  commission_percentage: number;
  created_at: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

// ── Presence ─────────────────────────────────────────────────────────────────

/** Freelancer presence snapshot returned by PATCH /freelancer/presence. */
export interface FreelancerPresence {
  is_online: boolean;
  online_since_at: string | null;
}

export interface SetPresencePayload {
  is_online: boolean;
}

export type UpdateFreelancerProfilePayload = Partial<
  Pick<
    FreelancerProfile,
    | 'business_name'
    | 'display_name'
    | 'bio'
    | 'logo_url'
    | 'cover_image_url'
    | 'address_line1'
    | 'city'
    | 'state'
    | 'postal_code'
    | 'contact_phone'
    | 'contact_email'
    | 'category'
    | 'gender_preference'
    | 'starting_price'
    | 'hourly_rate'
    | 'years_of_experience'
    | 'availability_summary'
    | 'instagram_url'
    | 'youtube_url'
    | 'website_url'
    | 'is_open_to_work'
    | 'latitude'
    | 'longitude'
  >
>;

/** Resume entry — one job/role at a salon or studio. */
export interface FreelancerExperience {
  id: string;
  freelancer_id: string;
  role: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  highlights: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateExperiencePayload {
  role: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
  highlights?: string[];
  display_order?: number;
}

export type UpdateExperiencePayload = Partial<CreateExperiencePayload>;

/** Skills are returned grouped by category. */
export interface FreelancerSkillItem {
  id: string;
  name: string;
  endorsement_count: number;
}

export interface FreelancerSkillGroup {
  category: string;
  items: FreelancerSkillItem[];
}

export interface FreelancerSkill {
  id: string;
  freelancer_id: string;
  category: string;
  skill_name: string;
  endorsement_count: number;
  created_at: string;
}

export interface CreateSkillPayload {
  category: string;
  skill_name: string;
}

export interface FreelancerCertification {
  id: string;
  freelancer_id: string;
  name: string;
  issuer: string | null;
  year: number | null;
  credential_url: string | null;
  created_at: string;
}

export interface CreateCertificationPayload {
  name: string;
  issuer?: string;
  year?: number;
  credential_url?: string;
}

export interface FreelancerLanguage {
  id: string;
  freelancer_id: string;
  language: string;
  proficiency: string | null;
}

export interface CreateLanguagePayload {
  language: string;
  proficiency?: string;
}

export interface FreelancerSalonAssociation {
  id: string;
  freelancer_id: string;
  salon_name: string;
  salon_location_id: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
}

export interface CreateSalonAssociationPayload {
  salon_name: string;
  salon_location_id?: string;
  location?: string;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
}

export type UpdateSalonAssociationPayload = Partial<CreateSalonAssociationPayload>;

export type PerformanceRange = '7d' | '30d' | '90d' | '1y';

export interface FreelancerPerformance {
  total_services: number;
  completed_services: number;
  total_clients: number;
  repeat_clients: number;
  avg_service_minutes: number;
  on_time_percent: number;
  total_revenue: number;
  avg_rating: number;
  review_count: number;
}

export interface UserPreferences {
  user_id: string;
  notif_bookings: boolean;
  notif_reminders: boolean;
  notif_payments: boolean;
  notif_promos: boolean;
  language: string;
  dark_mode: boolean;
  low_data_mode: boolean;
  updated_at: string;
}

export type UpdatePreferencesPayload = Partial<
  Pick<
    UserPreferences,
    | 'notif_bookings'
    | 'notif_reminders'
    | 'notif_payments'
    | 'notif_promos'
    | 'language'
    | 'dark_mode'
    | 'low_data_mode'
  >
>;
