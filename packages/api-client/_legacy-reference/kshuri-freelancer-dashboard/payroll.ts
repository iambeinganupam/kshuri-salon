// ─────────────────────────────────────────────────────────────────────────────
// API Module: Payroll — kshuri-freelancer-dashboard
// Backend: /api/v1/finance
// Replaces: Direct Supabase RPC `calculate_staff_commissions` call
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '../lib/apiClient';

export interface PendingPayout {
  staff_id: string;
  staff_name: string;
  total_owed: number;
  commission_percentage: number;
  appointment_count: number;
}

export interface ProcessPayoutResult {
  batch_id: string;
  message: string;
}

/**
 * Get pending staff payouts (commissions owed).
 * Replaces: supabase.rpc('calculate_staff_commissions', { p_location_id, p_start_date, p_end_date })
 *
 * The backend correctly scopes this to the authenticated manager's location
 * via the X-Tenant-Id / JWT tenant context — eliminating the IDOR risk.
 */
export async function getStaffCommissionsOwed(
  _locationId: string,   // kept for API compat; backend derives from JWT
  startDate: string,
  endDate: string,
): Promise<PendingPayout[]> {
  const { data } = await apiClient.get<{ success: true; data: PendingPayout[] }>(
    '/finance/payouts/pending',
    { params: { period: `${startDate}_${endDate}` } },
  );
  return data.data;
}

/**
 * Process a batch of staff payouts
 */
export async function processPayouts(payload: {
  staff_ids: string[];
  period_start: string;
  period_end: string;
}): Promise<ProcessPayoutResult> {
  const { data } = await apiClient.post<{ success: true; data: ProcessPayoutResult }>(
    '/finance/payouts/process',
    payload,
  );
  return data.data;
}

/**
 * Get revenue summary for the current vendor/location
 */
export async function getRevenueSummary() {
  const { data } = await apiClient.get('/finance/summary');
  return data.data;
}

/**
 * List transactions for reporting
 */
export async function listTransactions(params?: {
  from_date?: string;
  to_date?: string;
  limit?: number;
}) {
  const { data } = await apiClient.get('/finance/transactions', { params });
  return { items: data.data, has_more: data.meta?.has_more ?? false };
}

// Legacy compatibility — keeps pages using PayrollAPI.getStaffCommissionsOwed working
export const PayrollAPI = {
  getStaffCommissionsOwed,
};
