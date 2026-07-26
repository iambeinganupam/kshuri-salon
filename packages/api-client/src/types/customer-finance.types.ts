// ─────────────────────────────────────────────────────────────────────────────
// Customer Finance Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Shapes returned by /me/transactions and /me/refunds (customer-side
// read-only finance surface). Refunds are not a separate object on the
// server — they're an optional `refund` block embedded on a transaction
// when refund_amount or refunded_at is set.
// ─────────────────────────────────────────────────────────────────────────────

export type TxStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type CustomerPaymentMethod = 'upi' | 'card' | 'cash' | 'online';

export interface CustomerTransactionRefund {
  amount: number;
  reason: string | null;
  refundedAt: string;
}

export interface CustomerTransaction {
  id: string;
  appointmentId: string | null;
  vendorName: string | null;
  amount: number;
  currency: string;
  method: CustomerPaymentMethod | null;
  status: TxStatus;
  subtotal: number | null;
  tax_amount: number | null;
  billNumber: string | null;
  refund: CustomerTransactionRefund | null;
  createdAt: string;
}

export interface CustomerTransactionsListParams {
  status?: TxStatus;
  method?: CustomerPaymentMethod;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export interface CustomerRefundsListParams {
  cursor?: string;
  limit?: number;
}
