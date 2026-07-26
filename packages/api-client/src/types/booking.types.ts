// ─────────────────────────────────────────────────────────────────────────────
// Booking Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-customer-dashboard/src/api/booking.ts
//   - kshuri-salon-dashboard/src/api/booking.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { VendorType } from './common.types';

/** Appointment lifecycle states (maps to booking_status DB ENUM) */
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

/** State-transition actions for POST /booking/appointments/:id/action */
export type AppointmentAction =
  | 'confirm'
  | 'cancel'
  | 'verify-otp'
  | 'start'
  | 'complete'
  | 'no-show';

/** Booking intent — created before payment to lock a time slot */
export interface BookingIntent {
  intent_id: string;
  calculated_total: number;
  line_items?: Array<{
    service_name: string;
    price: number;
    duration: number;
  }>;
  scheduled_start?: string;
  scheduled_end: string;
  expires_at: string;
  /** Intent lifecycle state. Maps to the DB `intent_status` enum.
   *  Used by the portal's confirm step to distinguish a normal
   *  post-convert refetch (`'converted'`) from a true expiry
   *  (`'expired'`/`'cancelled'`). */
  status?: 'draft' | 'locked' | 'converted' | 'expired' | 'cancelled';
}

/** A confirmed appointment */
export interface Appointment {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  vendor_id: string;
  vendor_type: VendorType;
  vendor_name?: string;
  status: AppointmentStatus;
  /** ISO datetime fields returned by the backend */
  start_time?: string;
  end_time?: string;
  /** Flat service fields joined by the backend */
  service_id?: string;
  service_name?: string;
  service_price?: number;
  duration_minutes?: number;
  total_amount?: number;
  otp_code?: string;
  notes?: string;
  /** Per-line-item snapshot returned from public.appointment_line_items */
  services?: Array<{
    service_id?: string;
    service_name: string;
    locked_price: number | string;
    duration_minutes?: number;
  }>;
  staff_member?: { id: string; name: string };
  assigned_staff?: string;
  cancellation_reason?: string;
  payment_status?: string;
  /** Method elected at booking time (persisted on appointment).
   *  Migration 072 added this; older appointments have NULL. */
  payment_method?: 'upi' | 'card' | 'cash' | 'online' | null;
  /** Delivery address for home-delivery bookings. NULL for onsite. */
  customer_address_id?: string | null;
  customer_type?: string;
  booking_type?: string;
  created_at: string;
}

/** Payload for POST /booking/intents */
export interface CreateIntentPayload {
  vendor_type: VendorType;
  vendor_id: string;
  service_id: string;
  staff_member_id?: string;
  slot_start: string;
  slot_end: string;
}

/** Params for GET /booking/appointments */
export interface ListAppointmentsParams {
  status?: AppointmentStatus;
  from_date?: string;
  to_date?: string;
  limit?: number;
  cursor?: string;
}

/** Payload for POST /booking/walk-in (business_admin only) */
export interface WalkInPayload {
  service_ids: string[];
  customer_name: string;
  customer_phone?: string;
  slot_start: string;
  slot_end: string;
  staff_member_id?: string;
  booking_type?: 'walkin' | 'kshuri';
  notes?: string;
}
