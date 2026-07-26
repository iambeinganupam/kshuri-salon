// ─────────────────────────────────────────────────────────────────────────────
// Booking Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  BookingIntent,
  Appointment,
  AppointmentAction,
  CreateIntentPayload,
  ListAppointmentsParams,
  WalkInPayload,
} from '../types/booking.types';
import type { PaginatedResult } from '../client/types';

/** BOOK-01: Create a booking intent (slot lock) */
export async function createBookingIntent(
  client: AxiosInstance,
  payload: CreateIntentPayload,
): Promise<BookingIntent> {
  const { data } = await client.post<{ success: true; data: BookingIntent }>(
    '/booking/intents',
    payload,
  );
  return data.data;
}

/** BOOK-02: Lock intent (confirm services after review) */
export async function lockBookingIntent(
  client: AxiosInstance,
  intentId: string,
  serviceIds: string[],
): Promise<BookingIntent> {
  const { data } = await client.patch<{ success: true; data: BookingIntent }>(
    `/booking/intents/${intentId}/lock`,
    { service_ids: serviceIds },
  );
  return data.data;
}

/** BOOK-03: Convert intent to confirmed appointment.
 *
 *  payment_method + customer_address_id come from the confirm step and are
 *  persisted on the appointment row. Both optional — older callers keep
 *  working; the customer portal always sends payment_method and includes
 *  customer_address_id when the cart has at least one home-delivery service.
 */
export interface ConfirmBookingPayload {
  payment_method?: 'upi' | 'card' | 'cash' | 'online';
  customer_address_id?: string;
}

export async function confirmBooking(
  client: AxiosInstance,
  intentId: string,
  payload: ConfirmBookingPayload = {},
): Promise<Appointment> {
  const { data } = await client.post<{ success: true; data: Appointment }>(
    `/booking/intents/${intentId}/convert`,
    payload,
  );
  return data.data;
}

/** Fetch a booking intent by id (for confirm-step rehydration + status checks). */
export async function getBookingIntent(
  client: AxiosInstance,
  intentId: string,
): Promise<BookingIntent | null> {
  const { data } = await client.get<{ success: true; data: BookingIntent | null }>(
    `/booking/intents/${intentId}`,
    { validateStatus: (s) => s < 500 },
  );
  return data?.data ?? null;
}

/** BOOK-03b: Release a locked intent (early slot freeing on back-navigation). */
export async function releaseBookingIntent(
  client: AxiosInstance,
  intentId: string,
): Promise<{ released: boolean }> {
  const { data } = await client.post<{ success: true; data: { released: boolean } }>(
    `/booking/intents/${intentId}/release`,
  );
  return data.data;
}

/** BOOK-04: Get a single appointment by ID */
export async function getAppointment(
  client: AxiosInstance,
  appointmentId: string,
): Promise<Appointment> {
  const { data } = await client.get<{ success: true; data: Appointment }>(
    `/booking/appointments/${appointmentId}`,
  );
  return data.data;
}

/** BOOK-05: Perform state-transition action on an appointment */
export async function appointmentAction(
  client: AxiosInstance,
  appointmentId: string,
  action: AppointmentAction,
  extra?: { cancellation_reason?: string; otp_code?: string },
): Promise<Appointment> {
  const { data } = await client.post<{ success: true; data: Appointment }>(
    `/booking/appointments/${appointmentId}/action`,
    { action, ...extra },
  );
  return data.data;
}

/** BOOK-06: List appointments (paginated) */
export async function listAppointments(
  client: AxiosInstance,
  params?: ListAppointmentsParams,
): Promise<PaginatedResult<Appointment>> {
  const { data } = await client.get<{
    success: true;
    data: Appointment[];
    meta: { has_more: boolean };
  }>('/booking/appointments', { params });
  return { items: data.data, has_more: data.meta?.has_more ?? false };
}

/** BOOK-08: Create a walk-in appointment directly (business_admin only) */
export async function createWalkIn(
  client: AxiosInstance,
  payload: WalkInPayload,
): Promise<Appointment> {
  const { data } = await client.post<{ success: true; data: Appointment }>(
    '/booking/walk-in',
    payload,
  );
  return data.data;
}

/** BOOK-07: Reschedule an appointment */
export async function rescheduleAppointment(
  client: AxiosInstance,
  appointmentId: string,
  newSlotStart: string,
  newSlotEnd: string,
): Promise<Appointment> {
  const { data } = await client.patch<{ success: true; data: Appointment }>(
    `/booking/appointments/${appointmentId}/reschedule`,
    { new_slot_start: newSlotStart, new_slot_end: newSlotEnd },
  );
  return data.data;
}
