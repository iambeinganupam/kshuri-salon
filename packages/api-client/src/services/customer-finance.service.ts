// ─────────────────────────────────────────────────────────────────────────────
// Customer Finance Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  CustomerTransaction,
  CustomerTransactionsListParams,
  CustomerRefundsListParams,
} from '../types/customer-finance.types';
import type { PaginatedResult } from '../client/types';

type CursorPage<T> = PaginatedResult<T> & { next_cursor: string | null };

/** GET /me/transactions — list the customer's own transactions */
export async function listTransactions(
  client: AxiosInstance,
  params?: CustomerTransactionsListParams,
): Promise<CursorPage<CustomerTransaction>> {
  const { data } = await client.get<{
    success: true;
    data: CustomerTransaction[];
    meta?: { has_more: boolean; next_cursor: string | null };
  }>('/me/transactions', { params });
  return {
    items: data.data,
    has_more: data.meta?.has_more ?? false,
    next_cursor: data.meta?.next_cursor ?? null,
  };
}

/** GET /me/transactions/:id */
export async function getTransaction(
  client: AxiosInstance,
  id: string,
): Promise<CustomerTransaction> {
  const { data } = await client.get<{ success: true; data: CustomerTransaction }>(
    `/me/transactions/${id}`,
  );
  return data.data;
}

/** GET /me/refunds — subset of transactions with refund info */
export async function listRefunds(
  client: AxiosInstance,
  params?: CustomerRefundsListParams,
): Promise<CursorPage<CustomerTransaction>> {
  const { data } = await client.get<{
    success: true;
    data: CustomerTransaction[];
    meta?: { has_more: boolean; next_cursor: string | null };
  }>('/me/refunds', { params });
  return {
    items: data.data,
    has_more: data.meta?.has_more ?? false,
    next_cursor: data.meta?.next_cursor ?? null,
  };
}
