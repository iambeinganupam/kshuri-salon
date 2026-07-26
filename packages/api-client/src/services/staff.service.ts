// ─────────────────────────────────────────────────────────────────────────────
// Staff Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Targets backend routes mounted at /api/v1/staff.
// Pure Axios calls; the React Query layer lives in hooks/useStaff.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  ClockRecord,
  StaffShift,
  StaffProfile,
  UpdateStaffProfilePayload,
  StaffDocument,
  UploadDocumentPayload,
  StaffBankDetails,
  UpsertBankDetailsPayload,
  StaffTargets,
  StaffCommissionEntry,
  StaffReview,
  StaffReviewSummary,
  StaffEarnings,
} from '../types/staff.types';
import type { Appointment } from '../types/booking.types';

// ── Clock-in / Clock-out ─────────────────────────────────────────────────────

export async function clockIn(client: AxiosInstance): Promise<ClockRecord> {
  const { data } = await client.post<{ success: true; data: ClockRecord }>(
    '/staff/me/clock-in',
  );
  return data.data;
}

export async function clockOut(client: AxiosInstance): Promise<ClockRecord> {
  const { data } = await client.post<{ success: true; data: ClockRecord }>(
    '/staff/me/clock-out',
  );
  return data.data;
}

export async function getClockStatus(client: AxiosInstance): Promise<ClockRecord | null> {
  const { data } = await client.get<{ success: true; data: ClockRecord | null }>(
    '/staff/me/clock-status',
  );
  return data.data;
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function getAttendanceHistory(
  client: AxiosInstance,
  params?: { from_date?: string; to_date?: string; limit?: number },
): Promise<ClockRecord[]> {
  const { data } = await client.get<{ success: true; data: ClockRecord[] }>(
    '/staff/me/attendance',
    { params },
  );
  return data.data;
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export async function getMySchedule(
  client: AxiosInstance,
  params?: { week_start?: string; date?: string },
): Promise<{ week: { start: string; end: string }; shifts: StaffShift[]; appointments: Appointment[] }> {
  const { data } = await client.get<{ success: true; data: { week: { start: string; end: string }; shifts: StaffShift[]; appointments: Appointment[] } }>(
    '/staff/me/schedule',
    { params },
  );
  return data.data;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile(client: AxiosInstance): Promise<StaffProfile> {
  const { data } = await client.get<{ success: true; data: StaffProfile }>(
    '/staff/me/profile',
  );
  return data.data;
}

export async function updateProfile(
  client: AxiosInstance,
  payload: UpdateStaffProfilePayload,
): Promise<StaffProfile> {
  const { data } = await client.put<{ success: true; data: StaffProfile }>(
    '/staff/me/profile',
    payload,
  );
  return data.data;
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function listDocuments(client: AxiosInstance): Promise<StaffDocument[]> {
  const { data } = await client.get<{ success: true; data: StaffDocument[] }>(
    '/staff/me/documents',
  );
  return data.data;
}

export async function uploadDocument(
  client: AxiosInstance,
  payload: UploadDocumentPayload,
): Promise<StaffDocument> {
  const { data } = await client.post<{ success: true; data: StaffDocument }>(
    '/staff/me/documents',
    payload,
  );
  return data.data;
}

// ── Bank Details ──────────────────────────────────────────────────────────────

export async function getBankDetails(client: AxiosInstance): Promise<StaffBankDetails | null> {
  const { data } = await client.get<{ success: true; data: StaffBankDetails | null }>(
    '/staff/me/bank-details',
  );
  return data.data;
}

export async function upsertBankDetails(
  client: AxiosInstance,
  payload: UpsertBankDetailsPayload,
): Promise<StaffBankDetails> {
  const { data } = await client.put<{ success: true; data: StaffBankDetails }>(
    '/staff/me/bank-details',
    payload,
  );
  return data.data;
}

// ── Earnings & Targets ────────────────────────────────────────────────────────

export async function getEarnings(
  client: AxiosInstance,
  params?: { from_date?: string; to_date?: string },
): Promise<StaffEarnings> {
  const { data } = await client.get<{ success: true; data: StaffEarnings }>(
    '/staff/me/earnings',
    { params },
  );
  return data.data;
}

export async function getTargets(client: AxiosInstance): Promise<StaffTargets> {
  const { data } = await client.get<{ success: true; data: StaffTargets }>(
    '/staff/me/targets',
  );
  return data.data;
}

export async function getCommissionHistory(client: AxiosInstance): Promise<StaffCommissionEntry[]> {
  const { data } = await client.get<{ success: true; data: StaffCommissionEntry[] }>(
    '/staff/me/commissions',
  );
  return data.data;
}

export async function getWeeklyChart(
  client: AxiosInstance,
): Promise<Array<{ day: string; services: number; earnings: number }>> {
  const { data } = await client.get<{ success: true; data: Array<{ day: string; services: number; earnings: number }> }>(
    '/staff/me/weekly-chart',
  );
  return data.data;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function listReviews(
  client: AxiosInstance,
  params?: { limit?: number; offset?: number },
): Promise<StaffReview[]> {
  const { data } = await client.get<{ success: true; data: StaffReview[] }>(
    '/staff/me/reviews',
    { params },
  );
  return data.data;
}

export async function getReviewSummary(client: AxiosInstance): Promise<StaffReviewSummary> {
  const { data } = await client.get<{ success: true; data: StaffReviewSummary }>(
    '/staff/me/reviews/summary',
  );
  return data.data;
}
