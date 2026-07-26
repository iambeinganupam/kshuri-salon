// ─────────────────────────────────────────────────────────────────────────────
// Finance Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  Transaction,
  PendingPayout,
  Settlement,
  BankAccount,
  RevenueSummary,
  ListTransactionsParams,
  ProcessPayoutsPayload,
  ExportReportParams,
  GenerateBillPayload,
  BillView,
  UpiPaymentRequest,
  VendorDues,
  RecordSettlementPayload,
  LedgerEntry,
} from '../types/finance.types';
import type { PaginatedResult } from '../client/types';

function coerceTransaction(t: Transaction): Transaction {
  return {
    ...t,
    gross_amount: Number(t.gross_amount ?? 0),
    platform_fee: Number(t.platform_fee ?? 0),
    net_payout: Number(t.net_payout ?? 0),
  };
}

/** FIN-01: List transactions (paginated) */
export async function listTransactions(
  client: AxiosInstance,
  params?: ListTransactionsParams,
): Promise<PaginatedResult<Transaction>> {
  const { data } = await client.get<{
    success: true;
    data: Transaction[];
    meta: { has_more: boolean };
  }>('/finance/transactions', { params });
  return { items: (data.data ?? []).map(coerceTransaction), has_more: data.meta?.has_more ?? false };
}

/** FIN-02: Get a single transaction */
export async function getTransaction(
  client: AxiosInstance,
  transactionId: string,
): Promise<Transaction> {
  const { data } = await client.get<{ success: true; data: Transaction }>(
    `/finance/transactions/${transactionId}`,
  );
  return coerceTransaction(data.data);
}

/** FIN-03: Get pending payouts (Manager only) */
export async function getPendingPayouts(
  client: AxiosInstance,
  period: string,
): Promise<PendingPayout[]> {
  const { data } = await client.get<{ success: true; data: PendingPayout[] }>(
    '/finance/payouts/pending',
    { params: { period } },
  );
  return data.data;
}

/** FIN-04: Process batch payout (Manager only) */
export async function processPayouts(
  client: AxiosInstance,
  payload: ProcessPayoutsPayload,
): Promise<{ batch_id: string; message: string }> {
  const { data } = await client.post<{
    success: true;
    data: { batch_id: string; message: string };
  }>('/finance/payouts/process', payload);
  return data.data;
}

/** FIN-05: Get settlement history */
export async function getSettlements(client: AxiosInstance): Promise<Settlement[]> {
  const { data } = await client.get<{ success: true; data: Settlement[] }>(
    '/finance/settlements',
  );
  return data.data;
}

/** FIN-06a: Get bank account */
export async function getBankAccount(client: AxiosInstance): Promise<BankAccount | null> {
  const { data } = await client.get<{ success: true; data: BankAccount | null }>(
    '/finance/bank-account',
  );
  return data.data;
}

/** FIN-06b: Update bank account */
export async function updateBankAccount(
  client: AxiosInstance,
  payload: Omit<BankAccount, 'id' | 'account_number_last4'> & { account_number: string },
): Promise<BankAccount> {
  const { data } = await client.put<{ success: true; data: BankAccount }>(
    '/finance/bank-account',
    payload,
  );
  return data.data;
}

/** FIN-07: Export financial report */
export async function exportReport(
  client: AxiosInstance,
  params: ExportReportParams,
): Promise<Blob | Transaction[]> {
  const response = await client.get('/finance/export', {
    params,
    responseType: params.format === 'csv' ? 'blob' : 'json',
  });
  return response.data as Blob | Transaction[];
}

/** Fetch the customer-facing bill / printable invoice for a transaction */
export async function getBill(
  client: AxiosInstance,
  transactionId: string,
): Promise<BillView> {
  const { data } = await client.get<{ success: true; data: BillView }>(
    `/finance/transactions/${transactionId}/bill`,
  );
  const b = data.data;
  // Postgres NUMERIC arrives as string; coerce numeric fields once at the boundary.
  return {
    ...b,
    total: Number(b.total ?? 0),
    subtotal: Number(b.subtotal ?? 0),
    tax_amount: Number(b.tax_amount ?? 0),
    tax_rate: Number(b.tax_rate ?? 0),
    line_items: (b.line_items ?? []).map((li) => ({
      ...li,
      price: Number(li.price ?? 0),
      duration_minutes: Number(li.duration_minutes ?? 0),
    })),
  };
}

/** Generate a bill / record a payment for a completed appointment */
export async function generateBill(
  client: AxiosInstance,
  payload: GenerateBillPayload,
): Promise<Transaction> {
  const { data } = await client.post<{ success: true; data: Transaction }>(
    '/finance/payments',
    payload,
  );
  return coerceTransaction(data.data);
}

/** Revenue summary for dashboard */
export async function getRevenueSummary(client: AxiosInstance): Promise<RevenueSummary> {
  const { data } = await client.get<{ success: true; data: RevenueSummary }>(
    '/finance/summary',
  );
  const d = data.data;
  return {
    ...d,
    total_revenue: Number(d.total_revenue ?? 0),
    total_spent: d.total_spent != null ? Number(d.total_spent) : undefined,
    total_bookings: Number(d.total_bookings ?? 0),
    avg_per_booking: Number(d.avg_per_booking ?? 0),
    platform_fees_paid: d.platform_fees_paid != null ? Number(d.platform_fees_paid) : undefined,
    net_payout: d.net_payout != null ? Number(d.net_payout) : undefined,
  };
}

// ── Vendor-collected payments (Phase 1: manual UPI) ──────────────────────────

/** Build a UPI deep-link / QR payload for a completed appointment. */
export async function generateUpiQr(
  client: AxiosInstance,
  payload: { appointment_id: string; amount?: number },
): Promise<UpiPaymentRequest> {
  const { data } = await client.post<{ success: true; data: UpiPaymentRequest }>(
    '/finance/payments/qr',
    payload,
  );
  // Numerics arrive as strings from pg in some passthrough cases.
  return { ...data.data, amount: Number(data.data.amount) };
}

function coerceLedgerEntry(e: LedgerEntry): LedgerEntry {
  return {
    ...e,
    amount: Number(e.amount),
    balance_after: Number(e.balance_after),
  };
}

/** Vendor's outstanding dues + threshold + recent ledger. */
export async function getVendorDues(client: AxiosInstance): Promise<VendorDues> {
  const { data } = await client.get<{ success: true; data: VendorDues }>('/finance/dues');
  const d = data.data;
  return {
    ...d,
    outstanding: Number(d.outstanding),
    block_threshold: Number(d.block_threshold),
    recent_entries: d.recent_entries.map(coerceLedgerEntry),
  };
}

/** Record a vendor → platform settlement (manual or webhook-driven). */
export async function recordSettlement(
  client: AxiosInstance,
  payload: RecordSettlementPayload,
): Promise<LedgerEntry> {
  const { data } = await client.post<{ success: true; data: LedgerEntry }>(
    '/finance/dues/settle',
    payload,
  );
  return coerceLedgerEntry(data.data);
}
