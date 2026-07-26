// ─────────────────────────────────────────────────────────────────────────────
// API Module: Availability & Calendar — kshuri-salon-dashboard (B2B)
// Backend: /api/v1/availability
// Endpoints: AVAIL-01 … AVAIL-07
// Replaces: Former direct Supabase `time_blocks` / `appointments` queries
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TimeBlock {
  id: string;
  start_datetime: string;
  end_datetime: string;
  reason?: string;
  target_type: 'freelancer' | 'salon_location';
  target_id: string;
}

export interface WorkingHoursEntry {
  day_of_week: number;    // 0=Sunday … 6=Saturday
  open_time: string;      // "HH:mm"
  close_time: string;     // "HH:mm"
  is_closed: boolean;
}

export interface ShiftEntry {
  staff_member_id: string;
  shift_date: string;     // YYYY-MM-DD
  start_time: string;     // HH:mm:ss
  end_time: string;       // HH:mm:ss
  type: 'regular_shift' | 'time_off' | 'lunch_break';
}

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

export interface TimeSlot {
  start: string;
  end: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * AVAIL-01: Get available time slots [PUBLIC]
 */
export async function getAvailableSlots(params: {
  vendor_id: string;
  vendor_type: 'freelancer' | 'salon_location';
  service_id: string;
  date: string;
  staff_id?: string;
}): Promise<{ date: string; total_duration_minutes: number; available_slots: TimeSlot[] }> {
  const { data } = await apiClient.get('/availability/slots', { params });
  return data.data;
}

/**
 * AVAIL-02a: Get working hours for current vendor
 */
export async function getWorkingHours(): Promise<WorkingHoursEntry[]> {
  const { data } = await apiClient.get<{ success: true; data: WorkingHoursEntry[] }>(
    '/availability/working-hours',
  );
  return data.data;
}

/**
 * AVAIL-02b: Update working hours schedule
 */
export async function updateWorkingHours(hours: WorkingHoursEntry[]): Promise<WorkingHoursEntry[]> {
  const { data } = await apiClient.put<{ success: true; data: WorkingHoursEntry[] }>(
    '/availability/working-hours',
    { hours },
  );
  return data.data;
}

/**
 * AVAIL-03: Create a time block (sick leave, lunch, etc.)
 */
export async function createTimeBlock(payload: {
  start_time: string;
  end_time: string;
  reason?: string;
  target_type: 'freelancer' | 'salon_location';
  target_id: string;
}): Promise<TimeBlock> {
  const { data } = await apiClient.post<{ success: true; data: TimeBlock }>(
    '/availability/blocks',
    payload,
  );
  return data.data;
}

/**
 * AVAIL-04: Delete a time block
 */
export async function deleteTimeBlock(blockId: string): Promise<void> {
  await apiClient.delete(`/availability/blocks/${blockId}`);
}

/**
 * AVAIL-05: Batch-assign shifts (Manager only)
 */
export async function batchAssignShifts(shifts: ShiftEntry[]): Promise<{
  created_count: number;
  shift_ids: string[];
}> {
  const { data } = await apiClient.post<{
    success: true;
    data: { created_count: number; shift_ids: string[] };
  }>('/availability/shifts/batch', { shifts });
  return data.data;
}

/**
 * AVAIL-06: Approve or reject a shift
 */
export async function updateShift(
  shiftId: string,
  isApproved: boolean,
): Promise<void> {
  await apiClient.patch(`/availability/shifts/${shiftId}`, { is_approved: isApproved });
}

/**
 * AVAIL-07: Get calendar events for date range (appointments + blocks)
 */
export async function getCalendar(params: {
  start_date: string;
  end_date: string;
}): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get<{ success: true; data: CalendarEvent[] }>(
    '/availability/calendar',
    { params },
  );
  return data.data;
}

// Legacy compatibility — keeps pages that use CalendarAPI.getFreelancerSchedule working
export const CalendarAPI = {
  getFreelancerSchedule: async (freelancerId: string, startDate: Date, endDate: Date) =>
    getCalendar({
      start_date: startDate.toISOString().split('T')[0]!,
      end_date: endDate.toISOString().split('T')[0]!,
    }),
  createTimeBlock: async (payload: Omit<TimeBlock, 'id'> & { freelancerId: string }) =>
    createTimeBlock({
      start_time: payload.start_datetime,
      end_time: payload.end_datetime,
      reason: payload.reason,
      target_type: 'freelancer',
      target_id: payload.freelancerId,
    }),
};
