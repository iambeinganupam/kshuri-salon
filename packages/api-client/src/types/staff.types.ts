// ─────────────────────────────────────────────────────────────────────────────
// Staff Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { Appointment } from './booking.types';

/** Clock-in/out record matching the staff_attendance DB table */
export interface ClockRecord {
  id: string;
  staff_member_id: string;
  clock_in_at: string;
  clock_out_at?: string | null;
  date: string;
  /** Computed by the DB: total hours worked for the session */
  hours_worked?: number;
}

/** Staff shift schedule entry */
export interface StaffShift {
  id: string;
  staff_member_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  type: 'regular_shift' | 'time_off' | 'lunch_break';
  is_approved: boolean;
}

/** Full staff member profile returned by GET /staff/me/profile */
export interface StaffProfile {
  staff_member_id: string;
  user_id: string;
  role: string;
  commission_percentage: number;
  base_salary: number | null;
  hire_date: string | null;
  avatar_url: string | null;
  address: string | null;
  employer_id: string;
  employer_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  average_rating: number;
}

/** Payload for PUT /staff/me/profile */
export interface UpdateStaffProfilePayload {
  full_name?: string;
  email?: string;
  address?: string;
  avatar_url?: string;
}

/** KYC / ID document record */
export interface StaffDocument {
  id: string;
  document_type: 'aadhaar' | 'pan' | 'trade_license' | 'bank_passbook' | 'other';
  document_number?: string | null;
  file_url?: string | null;
  status: 'not_uploaded' | 'pending' | 'verified' | 'rejected';
  notes?: string | null;
  created_at: string;
}

/** Payload for POST /staff/me/documents */
export interface UploadDocumentPayload {
  document_type: StaffDocument['document_type'];
  document_number?: string;
  file_url?: string;
}

/** Bank account for payouts */
export interface StaffBankDetails {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  is_verified: boolean;
  payment_mode: 'bank_transfer' | 'upi';
}

/** Payload for PUT /staff/me/bank-details */
export interface UpsertBankDetailsPayload {
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  payment_mode?: 'bank_transfer' | 'upi';
}

/** Monthly targets + actual performance vs goals */
export interface StaffTargets {
  revenue_target: number;
  booking_target: number;
  rating_target: number;
  revenue_achieved: number;
  bookings_achieved: number;
  current_rating: number;
  incentive_earned: number;
  incentive_max: number;
}

/** One row in the commission/payout history table */
export interface StaffCommissionEntry {
  month: string;
  services: number;
  revenue: number;
  commission: number;
  bonus: number;
  deductions: number;
  payout: number;
  /** 'settled' | 'pending' | 'computed' (live fallback) */
  status: string;
}

/** A review written about this staff member by a customer */
export interface StaffReview {
  id: string;
  rating: number;
  comment: string | null;
  vendor_reply: string | null;
  vendor_reply_at: string | null;
  author_name: string;
  created_at: string;
}

/** Aggregated rating summary for a staff member */
export interface StaffReviewSummary {
  total_count: number;
  avg_rating: number;
  rating_5: number;
  rating_4: number;
  rating_3: number;
  rating_2: number;
  rating_1: number;
}

/** Earnings response from GET /staff/me/earnings */
export interface StaffEarnings {
  appointments: Appointment[];
  total_commission: number;
  base_salary: number;
  period: { from_date: string; to_date: string };
}
