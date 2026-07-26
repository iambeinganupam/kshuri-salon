// ─────────────────────────────────────────────────────────────────────────────
// API Module: Roster & Availability — kshuri-freelancer-dashboard
// Backend: /api/v1/availability + /api/v1/business
// Replaces: Direct Supabase shift_schedules insert + staff_members select
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '../lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShiftEntry {
  staff_member_id: string;
  shift_date: string;     // YYYY-MM-DD
  start_time: string;     // HH:mm:ss
  end_time: string;       // HH:mm:ss
  type: 'regular_shift' | 'time_off' | 'lunch_break';
}

export interface StaffMember {
  id: string;
  role: string;
  commission_percentage: number;
  is_active: boolean;
  users: { first_name: string; last_name: string; email: string };
}

export interface BulkShiftPayload {
  staff_member_id: string;
  shifts: Array<Omit<ShiftEntry, 'staff_member_id'>>;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Batch-assign shifts to a staff member.
 * Replaces: supabase.from('shift_schedules').insert(dbPayload)
 */
export async function assignBulkShifts(payload: BulkShiftPayload): Promise<{
  created_count: number;
  shift_ids: string[];
}> {
  const shifts: ShiftEntry[] = payload.shifts.map((s) => ({
    staff_member_id: payload.staff_member_id,
    ...s,
  }));
  const { data } = await apiClient.post<{
    success: true;
    data: { created_count: number; shift_ids: string[] };
  }>('/availability/shifts/batch', { shifts });
  return data.data;
}

/**
 * Get all staff members for a salon location.
 * Replaces: supabase.from('staff_members').select(...).eq('employer_id', locationId)
 */
export async function getStaffByLocation(): Promise<StaffMember[]> {
  const { data } = await apiClient.get<{ success: true; data: StaffMember[] }>(
    '/business/staff',
  );
  return data.data;
}

/**
 * Get working hours for the current vendor
 */
export async function getWorkingHours() {
  const { data } = await apiClient.get('/availability/working-hours');
  return data.data;
}

/**
 * Update working hours schedule
 */
export async function updateWorkingHours(hours: Array<{
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}>) {
  const { data } = await apiClient.put('/availability/working-hours', { hours });
  return data.data;
}

/**
 * Create a time block (unavailability)
 */
export async function createTimeBlock(payload: {
  start_time: string;
  end_time: string;
  reason?: string;
  target_type: 'freelancer' | 'salon_location';
  target_id: string;
}) {
  const { data } = await apiClient.post('/availability/blocks', payload);
  return data.data;
}

/**
 * Delete a time block
 */
export async function deleteTimeBlock(blockId: string): Promise<void> {
  await apiClient.delete(`/availability/blocks/${blockId}`);
}

/**
 * Get calendar events for a date range
 */
export async function getCalendar(params: { start_date: string; end_date: string }) {
  const { data } = await apiClient.get('/availability/calendar', { params });
  return data.data;
}

// Legacy compatibility — keeps pages using RosterAPI.assignBulkShifts/getStaffByLocation working
export const RosterAPI = {
  assignBulkShifts,
  getStaffByLocation: (_locationId: string) => getStaffByLocation(),
};
