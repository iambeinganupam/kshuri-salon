// ─────────────────────────────────────────────────────────────────────────────
// Finance Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as financeService from '../services/finance.service';
import type {
  ListTransactionsParams,
  ProcessPayoutsPayload,
  GenerateBillPayload,
  RecordSettlementPayload,
} from '../types/finance.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const financeKeys = {
  all: ['finance'] as const,
  transactions: (params?: ListTransactionsParams) =>
    [...financeKeys.all, 'transactions', params ?? {}] as const,
  transaction: (id: string) => [...financeKeys.all, 'transaction', id] as const,
  bill: (id: string) => [...financeKeys.all, 'bill', id] as const,
  pendingPayouts: (period: string) =>
    [...financeKeys.all, 'pending-payouts', period] as const,
  settlements: () => [...financeKeys.all, 'settlements'] as const,
  bankAccount: () => [...financeKeys.all, 'bank-account'] as const,
  summary: () => [...financeKeys.all, 'summary'] as const,
  dues: () => [...financeKeys.all, 'dues'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** List transactions (paginated) */
export function useTransactions(params?: ListTransactionsParams) {
  const client = useApiClient();
  return useQuery({
    queryKey: financeKeys.transactions(params),
    queryFn: () => financeService.listTransactions(client, params),
  });
}

/** Get a single transaction */
export function useTransaction(transactionId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: financeKeys.transaction(transactionId),
    queryFn: () => financeService.getTransaction(client, transactionId),
    enabled: !!transactionId,
  });
}

/** Fetch the printable bill / invoice for a transaction. Pass an empty string
 *  to disable — the modal does this when no bill has been opened yet. */
export function useBill(transactionId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: financeKeys.bill(transactionId),
    queryFn: () => financeService.getBill(client, transactionId),
    enabled: !!transactionId,
  });
}

/** Get pending payouts */
export function usePendingPayouts(period: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: financeKeys.pendingPayouts(period),
    queryFn: () => financeService.getPendingPayouts(client, period),
    enabled: !!period,
  });
}

/** Get settlement history */
export function useSettlements() {
  const client = useApiClient();
  return useQuery({
    queryKey: financeKeys.settlements(),
    queryFn: () => financeService.getSettlements(client),
  });
}

/** Get bank account */
export function useBankAccount() {
  const client = useApiClient();
  return useQuery({
    queryKey: financeKeys.bankAccount(),
    queryFn: () => financeService.getBankAccount(client),
  });
}

/** Revenue summary */
export function useRevenueSummary() {
  const client = useApiClient();
  return useQuery({
    queryKey: financeKeys.summary(),
    queryFn: () => financeService.getRevenueSummary(client),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Generate a bill for a completed appointment (COD or gateway-mediated) */
export function useGenerateBill() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateBillPayload) => financeService.generateBill(client, payload),
    onSuccess: () => {
      // A new bill changes: transactions list, revenue summary, dashboard analytics,
      // and the appointment's payment status (denormalised in some queries).
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

/** Process batch payout */
export function useProcessPayouts() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcessPayoutsPayload) =>
      financeService.processPayouts(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

/** Update bank account */
export function useUpdateBankAccount() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof financeService.updateBankAccount>[1]) =>
      financeService.updateBankAccount(client, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(financeKeys.bankAccount(), data);
    },
  });
}

// ── Vendor-collected payments (Phase 1: manual UPI) ─────────────────────────

/** Build a UPI deep-link / QR payload for a completed appointment.
 *  The salon dashboard renders the returned `upi_link` as a QR code via
 *  the `qrcode` library so the customer can scan-to-pay. */
export function useGenerateUpiQr() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (payload: { appointment_id: string; amount?: number }) =>
      financeService.generateUpiQr(client, payload),
  });
}

/** Vendor's outstanding dues + recent ledger entries. */
export function useVendorDues() {
  const client = useApiClient();
  return useQuery({
    queryKey: financeKeys.dues(),
    queryFn: () => financeService.getVendorDues(client),
    // Dues update on every booking + settlement — keep stale-time short
    // so the "Outstanding" KPI is always live.
    staleTime: 30 * 1000,
  });
}

/** Record a settlement — invalidates dues + transactions immediately. */
export function useRecordSettlement() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordSettlementPayload) =>
      financeService.recordSettlement(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.dues() });
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}
