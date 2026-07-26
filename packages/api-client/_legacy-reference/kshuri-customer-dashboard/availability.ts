// ─────────────────────────────────────────────────────────────────────────────
// API Module: Availability — salon-connect-hub (B2C Customer)
// Backend: /api/v1/availability
// Endpoints: AVAIL-01, AVAIL-07
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TimeSlot {
  start: string;  // "HH:mm"
  end: string;    // "HH:mm"
}

export interface AvailableSlots {
  date: string;
  total_duration_minutes: number;
  available_slots: TimeSlot[];
}

export interface CalendarDay {
  appointment_count: number;
  revenue: number;
  blocked: boolean;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * AVAIL-01: Get available time slots for a vendor on a given date [PUBLIC]
 */
export async function getAvailableSlots(params: {
  vendor_id: string;
  vendor_type: 'salon_location' | 'freelancer';
  service_id: string;
  date: string;           // YYYY-MM-DD
  staff_id?: string;
}): Promise<AvailableSlots> {
  const { data } = await apiClient.get<{ success: true; data: AvailableSlots }>(
    '/availability/slots',
    { params },
  );
  return data.data;
}

/**
 * AVAIL-07: Get calendar aggregate view for a date range
 * (used for the booking calendar date picker to show availability)
 */
export async function getCalendar(params: {
  start_date: string;    // YYYY-MM-DD
  end_date: string;      // YYYY-MM-DD
}): Promise<Record<string, CalendarDay>> {
  const { data } = await apiClient.get<{
    success: true;
    data: Record<string, CalendarDay>;
  }>('/availability/calendar', { params });
  return data.data;
}
