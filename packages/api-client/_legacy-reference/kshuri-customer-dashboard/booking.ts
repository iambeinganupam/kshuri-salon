// ─────────────────────────────────────────────────────────────────────────────
// API Module: Booking Engine — salon-connect-hub (B2C Customer)
// Backend: /api/v1/booking
// Endpoints: BOOK-01 … BOOK-07
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VendorType = 'salon_location' | 'freelancer';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentAction =
  | 'confirm'
  | 'cancel'
  | 'verify_otp'
  | 'complete'
  | 'no_show';

export interface BookingIntent {
  intent_id: string;
  calculated_total: number;
  line_items: Array<{
    service_name: string;
    price: number;
    duration: number;
  }>;
  scheduled_end: string;
  expires_at: string;
}

export interface Appointment {
  id: string;
  vendor_id: string;
  vendor_type: VendorType;
  vendor_name?: string;
  status: AppointmentStatus;
  scheduled_start: string;
  scheduled_end: string;
  total_amount: number;
  services: Array<{ name: string; price: number }>;
  otp_code?: string;
  cancellation_reason?: string;
  created_at: string;
}

export interface CreateIntentPayload {
  vendor_type: VendorType;
  vendor_id: string;
  service_id: string;
  staff_member_id?: string;
  slot_start: string;
  slot_end: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * BOOK-01: Create a booking intent (slot lock step 1 of 3)
 */
export async function createBookingIntent(
  payload: CreateIntentPayload,
): Promise<BookingIntent> {
  const { data } = await apiClient.post<{ success: true; data: BookingIntent }>(
    '/booking/intents',
    payload,
  );
  return data.data;
}

/**
 * BOOK-02: Lock intent (confirm slot details after review, step 2)
 */
export async function lockBookingIntent(
  intentId: string,
  serviceIds: string[],
): Promise<BookingIntent> {
  const { data } = await apiClient.patch<{ success: true; data: BookingIntent }>(
    `/booking/intents/${intentId}/lock`,
    { service_ids: serviceIds },
  );
  return data.data;
}

/**
 * BOOK-03: Convert intent to appointment (after payment, step 3)
 */
export async function confirmBooking(intentId: string): Promise<Appointment> {
  const { data } = await apiClient.post<{ success: true; data: Appointment }>(
    `/booking/intents/${intentId}/convert`,
  );
  return data.data;
}

/**
 * BOOK-04: Get a single appointment by ID
 */
export async function getAppointment(appointmentId: string): Promise<Appointment> {
  const { data } = await apiClient.get<{ success: true; data: Appointment }>(
    `/booking/appointments/${appointmentId}`,
  );
  return data.data;
}

/**
 * BOOK-05: Perform a state-transition action on an appointment
 * (cancel, verify_otp, confirm, complete, no_show)
 */
export async function appointmentAction(
  appointmentId: string,
  action: AppointmentAction,
  extra?: { cancellation_reason?: string; otp_code?: string },
): Promise<Appointment> {
  const { data } = await apiClient.post<{ success: true; data: Appointment }>(
    `/booking/appointments/${appointmentId}/action`,
    { action, ...extra },
  );
  return data.data;
}

/**
 * BOOK-06: List appointments for the current customer (paginated)
 */
export async function listAppointments(params?: {
  status?: AppointmentStatus;
  from_date?: string;
  to_date?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: Appointment[]; has_more: boolean }> {
  const { data } = await apiClient.get<{
    success: true;
    data: Appointment[];
    meta: { has_more: boolean };
  }>('/booking/appointments', { params });
  return { items: data.data, has_more: data.meta?.has_more ?? false };
}

/**
 * BOOK-07: Reschedule an appointment
 */
export async function rescheduleAppointment(
  appointmentId: string,
  newSlotStart: string,
  newSlotEnd: string,
): Promise<Appointment> {
  const { data } = await apiClient.patch<{ success: true; data: Appointment }>(
    `/booking/appointments/${appointmentId}/reschedule`,
    { new_slot_start: newSlotStart, new_slot_end: newSlotEnd },
  );
  return data.data;
}

// Legacy compat — keeps pages that use BookingAPI.createBookingIntent(...) working
export const BookingAPI = {
  createBookingIntent,
  lockBookingIntent,
  confirmBooking,
  getAppointment,
  listAppointments,
  appointmentAction,
  rescheduleAppointment,
  // Backward compat with old 2-phase naming
  createBookingIntentLegacy: async (payload: {
    vendorId: string;
    vendorType: 'salon' | 'freelancer';
    serviceIds: string[];
    scheduledStartIso: string;
    customerId: string;
  }) =>
    createBookingIntent({
      vendor_id: payload.vendorId,
      vendor_type: payload.vendorType === 'salon' ? 'salon_location' : 'freelancer',
      service_id: payload.serviceIds[0]!,
      slot_start: payload.scheduledStartIso,
      slot_end: payload.scheduledStartIso,
    }),
};
