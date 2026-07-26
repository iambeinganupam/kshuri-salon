// ─────────────────────────────────────────────────────────────────────────────
// Availability Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-salon-dashboard/src/api/calendar.ts
//   - kshuri-customer-dashboard/src/api/availability.ts
//   - kshuri-freelancer-dashboard/src/api/roster.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { VendorType } from './common.types';

/** A bookable time slot with availability flag */
export interface TimeSlot {
  start: string;
  end: string;
  /** Whether this slot is free (not blocked/booked) */
  available: boolean;
}

/** Response from GET /availability/slots */
export interface AvailableSlots {
  /** False when the vendor is explicitly closed on this day of week */
  is_open: boolean;
  /** "HH:MM" opening time, null when closed */
  open_time: string | null;
  /** "HH:MM" closing time, null when closed */
  close_time: string | null;
  slots: TimeSlot[];
}

/** Params for GET /availability/slots.
 *  Pass `service_ids` for multi-service bookings (preferred — server sums
 *  every service's duration so the last slot still fits the whole cart).
 *  `service_id` is the single-service legacy form. At least one is required. */
export interface GetSlotsParams {
  vendor_id: string;
  vendor_type: VendorType;
  service_id?: string;
  service_ids?: string[];
  date: string;
  staff_id?: string;
}

/** A time block (e.g., sick leave, vacation, lunch) */
export interface TimeBlock {
  id: string;
  start_datetime: string;
  end_datetime: string;
  reason?: string;
  target_type: VendorType;
  target_id: string;
}

/** Working hours entry for a single day */
export interface WorkingHoursEntry {
  day_of_week: number;    // 0=Sunday … 6=Saturday
  open_time: string;      // "HH:mm"
  close_time: string;     // "HH:mm"
  is_closed: boolean;
}

/** Staff shift schedule entry */
export interface ShiftEntry {
  staff_member_id: string;
  shift_date: string;     // YYYY-MM-DD
  start_time: string;     // HH:mm:ss
  end_time: string;       // HH:mm:ss
  type: 'regular_shift' | 'time_off' | 'lunch_break';
}

/** Calendar event (unified view of appointments, blocks, shifts) */
export interface CalendarEvent {
  id: string;
  type: 'appointment' | 'block' | 'shift';
  title: string;
  start: string;
  end: string;
  status?: string;
  customer_name?: string;
  vendor_id?: string;
}

/** Calendar day summary for date picker */
export interface CalendarDay {
  appointment_count: number;
  revenue: number;
  blocked: boolean;
}

/** Payload for POST /availability/blocks */
export interface CreateTimeBlockPayload {
  start_time: string;
  end_time: string;
  reason?: string;
  target_type: VendorType;
  target_id: string;
}
