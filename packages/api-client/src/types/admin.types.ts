// ─────────────────────────────────────────────────────────────────────────────
// Admin Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { UserRole } from './auth.types';

/** @deprecated Use KycStatus from kyc.types instead */
type LegacyKycStatus = 'pending' | 'approved' | 'rejected';

/** KYC application for vendor verification */
export interface KycApplication {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_type: 'freelancer' | 'salon_location';
  document_type: string;
  document_number: string;
  verification_status: LegacyKycStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
}

/** Platform user for admin user management */
export interface PlatformUser {
  id: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

/** Platform-wide KPI for super admin dashboard */
export interface PlatformKPI {
  total_users: number;
  total_vendors: number;
  total_bookings: number;
  total_revenue: number;
  pending_kyc_count: number;
  active_vendors: number;
}
