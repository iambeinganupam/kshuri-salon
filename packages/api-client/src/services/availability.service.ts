// ─────────────────────────────────────────────────────────────────────────────
// Availability Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  AvailableSlots,
  GetSlotsParams,
  TimeBlock,
  WorkingHoursEntry,
  ShiftEntry,
  CalendarEvent,
  CalendarDay,
  CreateTimeBlockPayload,
} from '../types/availability.types';

/** AVAIL-01: Get available time slots.
 *  When `service_ids` is provided we serialise it as a CSV string — the
 *  backend schema parses it back into an array. Axios' default array
 *  serialiser produces `service_ids[]=…` repetitions which the schema
 *  doesn't accept. */
export async function getAvailableSlots(
  client: AxiosInstance,
  params: GetSlotsParams,
): Promise<AvailableSlots> {
  const { service_ids, ...rest } = params;
  const query: Record<string, string | undefined> = { ...rest };
  if (service_ids && service_ids.length > 0) {
    query.service_ids = service_ids.join(',');
  }
  const { data } = await client.get<{ success: true; data: AvailableSlots }>(
    '/availability/slots',
    { params: query },
  );
  return data.data;
}

/** AVAIL-02a: Get working hours */
export async function getWorkingHours(client: AxiosInstance): Promise<WorkingHoursEntry[]> {
  const { data } = await client.get<{ success: true; data: WorkingHoursEntry[] }>(
    '/availability/working-hours',
  );
  return data.data;
}

/** AVAIL-02b: Update working hours */
export async function updateWorkingHours(
  client: AxiosInstance,
  hours: WorkingHoursEntry[],
): Promise<WorkingHoursEntry[]> {
  const { data } = await client.put<{ success: true; data: WorkingHoursEntry[] }>(
    '/availability/working-hours',
    { hours },
  );
  return data.data;
}

/** AVAIL-03: Create a time block */
export async function createTimeBlock(
  client: AxiosInstance,
  payload: CreateTimeBlockPayload,
): Promise<TimeBlock> {
  const { data } = await client.post<{ success: true; data: TimeBlock }>(
    '/availability/blocks',
    payload,
  );
  return data.data;
}

/** AVAIL-04: Delete a time block */
export async function deleteTimeBlock(client: AxiosInstance, blockId: string): Promise<void> {
  await client.delete(`/availability/blocks/${blockId}`);
}

/** AVAIL-05: Batch-assign shifts (Manager only) */
export async function batchAssignShifts(
  client: AxiosInstance,
  shifts: ShiftEntry[],
): Promise<{ created_count: number; shift_ids: string[] }> {
  const { data } = await client.post<{
    success: true;
    data: { created_count: number; shift_ids: string[] };
  }>('/availability/shifts/batch', { shifts });
  return data.data;
}

/** AVAIL-06: Approve/reject a shift */
export async function updateShift(
  client: AxiosInstance,
  shiftId: string,
  isApproved: boolean,
): Promise<void> {
  await client.patch(`/availability/shifts/${shiftId}`, { is_approved: isApproved });
}

/** AVAIL-07: Get calendar events for date range */
export async function getCalendar(
  client: AxiosInstance,
  params: { start_date: string; end_date: string },
): Promise<CalendarEvent[]> {
  const { data } = await client.get<{ success: true; data: CalendarEvent[] }>(
    '/availability/calendar',
    { params },
  );
  return data.data;
}

/** AVAIL-07b: Get calendar day summaries (for date picker) */
export async function getCalendarDays(
  client: AxiosInstance,
  params: { start_date: string; end_date: string },
): Promise<Record<string, CalendarDay>> {
  const { data } = await client.get<{
    success: true;
    data: Record<string, CalendarDay>;
  }>('/availability/calendar', { params });
  return data.data;
}
