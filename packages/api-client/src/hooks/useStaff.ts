// ─────────────────────────────────────────────────────────────────────────────
// Staff Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as staffService from '../services/staff.service';
import type {
  UpdateStaffProfilePayload,
  UploadDocumentPayload,
  UpsertBankDetailsPayload,
} from '../types/staff.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const staffKeys = {
  all:             ['staff'] as const,
  profile:         () => [...staffKeys.all, 'profile'] as const,
  documents:       () => [...staffKeys.all, 'documents'] as const,
  bankDetails:     () => [...staffKeys.all, 'bank-details'] as const,
  clockStatus:     () => [...staffKeys.all, 'clock-status'] as const,
  attendance:      (params?: Record<string, unknown>) =>
                     [...staffKeys.all, 'attendance', params ?? {}] as const,
  schedule:        (params?: Record<string, unknown>) =>
                     [...staffKeys.all, 'schedule', params ?? {}] as const,
  earnings:        (params?: Record<string, unknown>) =>
                     [...staffKeys.all, 'earnings', params ?? {}] as const,
  targets:         () => [...staffKeys.all, 'targets'] as const,
  commissions:     () => [...staffKeys.all, 'commissions'] as const,
  weeklyChart:     () => [...staffKeys.all, 'weekly-chart'] as const,
  reviews:         (params?: Record<string, unknown>) =>
                     [...staffKeys.all, 'reviews', params ?? {}] as const,
  reviewSummary:   () => [...staffKeys.all, 'reviews', 'summary'] as const,
};

// ── Profile ───────────────────────────────────────────────────────────────────

/** Fetch the staff member's own profile */
export function useStaffProfile() {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.profile(),
    queryFn:  () => staffService.getProfile(client),
  });
}

/** Update profile fields (name, email, address, avatar) */
export function useUpdateStaffProfile() {
  const client      = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStaffProfilePayload) =>
      staffService.updateProfile(client, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(staffKeys.profile(), updated);
    },
  });
}

// ── Documents ─────────────────────────────────────────────────────────────────

/** List KYC / ID documents for the current staff member */
export function useStaffDocuments() {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.documents(),
    queryFn:  () => staffService.listDocuments(client),
  });
}

/** Upload or update a document record (upsert by document_type) */
export function useUploadStaffDocument() {
  const client      = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadDocumentPayload) =>
      staffService.uploadDocument(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.documents() });
    },
  });
}

// ── Bank Details ──────────────────────────────────────────────────────────────

/** Fetch the staff member's saved bank account for payouts */
export function useStaffBankDetails() {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.bankDetails(),
    queryFn:  () => staffService.getBankDetails(client),
  });
}

/** Create or update bank account details (upsert — one account per staff member) */
export function useUpdateStaffBankDetails() {
  const client      = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertBankDetailsPayload) =>
      staffService.upsertBankDetails(client, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(staffKeys.bankDetails(), updated);
    },
  });
}

// ── Clock-in / Clock-out ──────────────────────────────────────────────────────

/** Get today's clock status (clocked in / out) */
export function useClockStatus() {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.clockStatus(),
    queryFn:  () => staffService.getClockStatus(client),
  });
}

/** Clock in for the current shift */
export function useClockIn() {
  const client      = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => staffService.clockIn(client),
    onSuccess: (record) => {
      queryClient.setQueryData(staffKeys.clockStatus(), record);
      queryClient.invalidateQueries({ queryKey: staffKeys.attendance() });
    },
  });
}

/** Clock out from the current shift */
export function useClockOut() {
  const client      = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => staffService.clockOut(client),
    onSuccess: (record) => {
      queryClient.setQueryData(staffKeys.clockStatus(), record);
      queryClient.invalidateQueries({ queryKey: staffKeys.attendance() });
    },
  });
}

// ── Attendance ────────────────────────────────────────────────────────────────

/** Attendance history with optional date range filter */
export function useAttendanceHistory(params?: { from_date?: string; to_date?: string }) {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.attendance(params),
    queryFn:  () => staffService.getAttendanceHistory(client, params),
  });
}

// ── Schedule ──────────────────────────────────────────────────────────────────

/** Weekly shift schedule; pass week_start (YYYY-MM-DD) or a single date */
export function useMySchedule(params?: { week_start?: string; date?: string }) {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.schedule(params),
    queryFn:  () => staffService.getMySchedule(client, params),
  });
}

// ── Earnings & Targets ────────────────────────────────────────────────────────

/** Earnings breakdown for a date range (defaults to current month) */
export function useStaffEarnings(params?: { from_date?: string; to_date?: string }) {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.earnings(params),
    queryFn:  () => staffService.getEarnings(client, params),
  });
}

/** Monthly performance targets vs actual achievement */
export function useStaffTargets() {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.targets(),
    queryFn:  () => staffService.getTargets(client),
  });
}

/** 6-month commission / payout history (uses staff_payouts if settled, live fallback otherwise) */
export function useCommissionHistory() {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.commissions(),
    queryFn:  () => staffService.getCommissionHistory(client),
  });
}

/** Services + earnings per day for the current week (for the bar chart) */
export function useWeeklyChart() {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.weeklyChart(),
    queryFn:  () => staffService.getWeeklyChart(client),
  });
}

// ── Reviews ───────────────────────────────────────────────────────────────────

/** Paginated reviews written about this staff member */
export function useStaffReviews(params?: { limit?: number; offset?: number }) {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.reviews(params),
    queryFn:  () => staffService.listReviews(client, params),
  });
}

/** Aggregated rating distribution for the staff member's profile */
export function useStaffReviewSummary() {
  const client = useApiClient();
  return useQuery({
    queryKey: staffKeys.reviewSummary(),
    queryFn:  () => staffService.getReviewSummary(client),
  });
}
