// ─────────────────────────────────────────────────────────────────────────────
// API Module: Financial Ledger — kshuri-salon-dashboard (B2B)
// Backend: /api/v1/finance
// Endpoints: FIN-01 … FIN-07
// Replaces: Empty ledger.ts stub
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TransactionStatus = 'pending' | 'settled' | 'refunded' | 'failed';

export interface Transaction {
  id: string;
  appointment_id: string;
  gross_amount: number;
  platform_fee: number;
  net_payout: number;
  currency: string;
  status: TransactionStatus;
  payment_method?: string;
  vendor_name?: string;
  service_names?: string[];
  created_at: string;
}

export interface PendingPayout {
  staff_id: string;
  staff_name: string;
  total_owed: number;
  commission_percentage: number;
  appointment_count: number;
}

export interface Settlement {
  id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  staff_count: number;
  status: 'pending' | 'processed';
  processed_at?: string;
}

export interface BankAccount {
  id: string;
  account_holder_name: string;
  account_number_last4: string;
  bank_name: string;
  ifsc_code?: string;
  upi_id?: string;
}

export interface RevenueSummary {
  total_revenue: number;
  total_bookings: number;
  avg_per_booking: number;
  platform_fees_paid: number;
  net_payout: number;
  currency: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * FIN-01: List transactions (paginated + filterable)
 */
export async function listTransactions(params?: {
  status?: TransactionStatus;
  from_date?: string;
  to_date?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: Transaction[]; has_more: boolean }> {
  const { data } = await apiClient.get<{
    success: true;
    data: Transaction[];
    meta: { has_more: boolean };
  }>('/finance/transactions', { params });
  return { items: data.data, has_more: data.meta?.has_more ?? false };
}

/**
 * FIN-02: Get a single transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction> {
  const { data } = await apiClient.get<{ success: true; data: Transaction }>(
    `/finance/transactions/${transactionId}`,
  );
  return data.data;
}

/**
 * FIN-03: Get pending payouts for staff (Manager only)
 */
export async function getPendingPayouts(period: string): Promise<PendingPayout[]> {
  const { data } = await apiClient.get<{ success: true; data: PendingPayout[] }>(
    '/finance/payouts/pending',
    { params: { period } },
  );
  return data.data;
}

/**
 * FIN-04: Process a batch payout to multiple staff members (Manager only)
 */
export async function processPayouts(payload: {
  staff_ids: string[];
  period_start: string;
  period_end: string;
}): Promise<{ batch_id: string; message: string }> {
  const { data } = await apiClient.post<{
    success: true;
    data: { batch_id: string; message: string };
  }>('/finance/payouts/process', payload);
  return data.data;
}

/**
 * FIN-05: Get settlement history
 */
export async function getSettlements(): Promise<Settlement[]> {
  const { data } = await apiClient.get<{ success: true; data: Settlement[] }>(
    '/finance/settlements',
  );
  return data.data;
}

/**
 * FIN-06a: Get bank account details
 */
export async function getBankAccount(): Promise<BankAccount | null> {
  const { data } = await apiClient.get<{ success: true; data: BankAccount | null }>(
    '/finance/bank-account',
  );
  return data.data;
}

/**
 * FIN-06b: Update bank account details
 */
export async function updateBankAccount(
  payload: Omit<BankAccount, 'id' | 'account_number_last4'> & { account_number: string },
): Promise<BankAccount> {
  const { data } = await apiClient.put<{ success: true; data: BankAccount }>(
    '/finance/bank-account',
    payload,
  );
  return data.data;
}

/**
 * FIN-07: Export financial report (CSV or JSON)
 */
export async function exportReport(params: {
  type: 'transactions' | 'payouts' | 'settlements';
  start_date: string;
  end_date: string;
  format?: 'json' | 'csv';
}): Promise<Blob | unknown[]> {
  const response = await apiClient.get('/finance/export', {
    params,
    responseType: params.format === 'csv' ? 'blob' : 'json',
  });
  return response.data;
}

/**
 * Revenue summary for dashboard
 */
export async function getRevenueSummary(): Promise<RevenueSummary> {
  const { data } = await apiClient.get<{ success: true; data: RevenueSummary }>(
    '/finance/summary',
  );
  return data.data;
}

// Legacy compat — keeps pages using PayrollAPI.getStaffCommissionsOwed working
export const PayrollAPI = {
  getStaffCommissionsOwed: (locationId: string, startDate: string, endDate: string) =>
    getPendingPayouts(`${startDate}_${endDate}`),
};
