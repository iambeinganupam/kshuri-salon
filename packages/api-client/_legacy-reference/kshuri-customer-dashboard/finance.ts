// ─────────────────────────────────────────────────────────────────────────────
// API Module: Finance — salon-connect-hub (B2C Customer)
// Backend: /api/v1/finance
// Covers: Customer transaction history and earnings summary
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
  created_at: string;
}

export interface RevenueSummary {
  total_spent: number;
  total_bookings: number;
  avg_per_booking: number;
  currency: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * FIN-01: List transaction history for the current user
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
 * Revenue summary (total spent, bookings count) for earnings page
 */
export async function getRevenueSummary(): Promise<RevenueSummary> {
  const { data } = await apiClient.get<{ success: true; data: RevenueSummary }>(
    '/finance/summary',
  );
  return data.data;
}
