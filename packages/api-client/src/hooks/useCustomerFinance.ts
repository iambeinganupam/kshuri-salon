// ─────────────────────────────────────────────────────────────────────────────
// Customer Finance Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as customerFinanceService from '../services/customer-finance.service';
import type {
  CustomerTransactionsListParams,
  CustomerRefundsListParams,
} from '../types/customer-finance.types';

export const customerFinanceKeys = {
  all: ['customer-finance'] as const,
  transactions: (params?: CustomerTransactionsListParams) =>
    [...customerFinanceKeys.all, 'transactions', params ?? {}] as const,
  transaction: (id: string) => [...customerFinanceKeys.all, 'transaction', id] as const,
  refunds: (params?: CustomerRefundsListParams) =>
    [...customerFinanceKeys.all, 'refunds', params ?? {}] as const,
};

/** List the customer's own transactions (cursor-paginated). */
export function useCustomerTransactions(params?: CustomerTransactionsListParams) {
  const client = useApiClient();
  return useQuery({
    queryKey: customerFinanceKeys.transactions(params),
    queryFn: () => customerFinanceService.listTransactions(client, params),
    staleTime: 30_000,
  });
}

/** Fetch a single transaction by id. */
export function useCustomerTransaction(id: string | null | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: id ? customerFinanceKeys.transaction(id) : [...customerFinanceKeys.all, 'transaction', null],
    queryFn: () => customerFinanceService.getTransaction(client, id as string),
    enabled: !!id,
  });
}

/** List the customer's own refunds (subset of transactions with refund info). */
export function useCustomerRefunds(params?: CustomerRefundsListParams) {
  const client = useApiClient();
  return useQuery({
    queryKey: customerFinanceKeys.refunds(params),
    queryFn: () => customerFinanceService.listRefunds(client, params),
    staleTime: 30_000,
  });
}
