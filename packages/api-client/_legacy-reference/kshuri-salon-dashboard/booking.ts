// ─────────────────────────────────────────────────────────────────────────────
// API Module: Bookings — kshuri-salon-dashboard (B2B Vendor View)
// Backend: /api/v1/booking
// Endpoints: BOOK-04 … BOOK-07
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface Appointment {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  vendor_id: string;
  vendor_type: 'freelancer' | 'salon_location';
  status: AppointmentStatus;
  scheduled_start: string;
  scheduled_end: string;
  total_amount: number;
  otp_code?: string;
  services: Array<{ id: string; name: string; price: number; duration_minutes: number }>;
  staff_member?: { id: string; name: string };
  cancellation_reason?: string;
  created_at: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

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
 * BOOK-05: Perform state-transition on an appointment (vendor-side)
 * Roles: freelancer / business_admin / staff
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
 * BOOK-06: List appointments for the current vendor (paginated)
 * Backend resolves vendor identity from JWT — no vendor_id param needed.
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
