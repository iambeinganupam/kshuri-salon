// ─────────────────────────────────────────────────────────────────────────────
// Auth Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-salon-dashboard/src/lib/auth-context.tsx
//   - kshuri-freelancer-dashboard/src/lib/auth-context.tsx
//   - kshuri-customer-dashboard/src/lib/auth-context.tsx
//   - kshuri-salon-dashboard/src/api/auth.ts
//   - kshuri-customer-dashboard/src/api/auth.ts
// ─────────────────────────────────────────────────────────────────────────────

/** All user roles in the Kshuri platform */
export type UserRole =
  | 'customer'
  | 'freelancer'
  | 'business_admin'
  | 'staff'
  | 'event_manager'
  | 'super_admin';

/** Authenticated user profile returned by GET /auth/me */
export interface AuthUser {
  id: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  profile_id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  business_name?: string;
  legal_business_name?: string;
  bio?: string;
  is_verified?: boolean;
  average_rating?: number;
  date_of_birth?: string;
  gender_preference?: 'male' | 'female' | 'any';
  marketing_opt_in?: boolean;
}

/** Response from POST /auth/login and POST /auth/verify-otp */
export interface AuthTokenResponse {
  access_token: string;
  user: AuthUser;
  is_new_user?: boolean;
  context?: {
    active_location_id?: string;
  };
}

/** Payload for POST /auth/register (B2B) */
export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'freelancer' | 'business_admin';
  business_name?: string;
  legal_business_name?: string;
}

/** Profile update payload for PUT /auth/me */
export interface ProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  business_name?: string;
  bio?: string;
  date_of_birth?: string;
  gender_preference?: 'male' | 'female' | 'any';
  marketing_opt_in?: boolean;
  /** E.164-formatted phone (e.g. +91XXXXXXXXXX). Backend's `auth.schemas`
   *  accepts this on PATCH /auth/me; mirrored here so dashboards can
   *  update the owner phone alongside name and email. */
  phone_number?: string;
}
