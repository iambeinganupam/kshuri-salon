// ─────────────────────────────────────────────────────────────────────────────
// Finance Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-salon-dashboard/src/api/ledger.ts
//   - kshuri-customer-dashboard/src/api/finance.ts
//   - kshuri-freelancer-dashboard/src/api/payroll.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { VendorType } from './common.types';

/** Transaction lifecycle states */
export type TransactionStatus = 'pending' | 'settled' | 'refunded' | 'failed';

/** Financial transaction record */
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

/** Pending staff payout (commissions owed) */
export interface PendingPayout {
  staff_id: string;
  staff_name: string;
  total_owed: number;
  commission_percentage: number;
  appointment_count: number;
}

/** Batch settlement record */
export interface Settlement {
  id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  staff_count: number;
  status: 'pending' | 'processed';
  processed_at?: string;
}

/** Bank account (for payouts) */
export interface BankAccount {
  id: string;
  account_holder_name: string;
  account_number_last4: string;
  bank_name: string;
  ifsc_code?: string;
  upi_id?: string;
}

/** Revenue summary for dashboard KPI cards */
export interface RevenueSummary {
  total_revenue: number;
  total_spent?: number;
  total_bookings: number;
  avg_per_booking: number;
  platform_fees_paid?: number;
  net_payout?: number;
  currency: string;
}

/** Params for GET /finance/transactions */
export interface ListTransactionsParams {
  status?: TransactionStatus;
  from_date?: string;
  to_date?: string;
  limit?: number;
  cursor?: string;
}

/** Payload for POST /finance/payouts/process */
export interface ProcessPayoutsPayload {
  staff_ids: string[];
  period_start: string;
  period_end: string;
}

/** Params for GET /finance/export */
export interface ExportReportParams {
  type: 'transactions' | 'payouts' | 'settlements';
  start_date: string;
  end_date: string;
  format?: 'json' | 'csv';
}

/** Payload for POST /finance/payments — generate a bill for a completed appointment */
export interface GenerateBillPayload {
  appointment_id: string;
  payment_method: 'upi' | 'card' | 'cash' | 'online';
  /** Optional override; server uses appointment.total_amount when omitted (preferred). */
  amount?: number;
  currency?: string;
}

/** Customer-facing invoice payload from GET /finance/transactions/:id/bill.
 *  Same shape regardless of customer type (walk-in / registered / Kshuri). */
export interface BillView {
  transaction_id: string;
  bill_number: string;
  /** All numeric fields are strings on the wire (Postgres NUMERIC) — coerce in the hook. */
  total: number;
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  currency: string;
  payment_method: string;
  status: string;
  issued_at: string;
  vendor_id: string;
  business: {
    name: string | null;
    legal_name: string | null;
    gstin: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  };
  customer: {
    name: string;
    phone: string | null;
    email: string | null;
    customer_type: 'walkin' | 'registered';
    is_registered: boolean;
  };
  appointment_id: string | null;
  start_time: string | null;
  end_time: string | null;
  booking_type: string | null;
  appointment_notes: string | null;
  line_items: Array<{
    service_id: string;
    service_name: string;
    duration_minutes: number;
    price: number;
  }>;
}

// ── Vendor-collected payments (Phase 1: manual UPI) ──────────────────────────

/** Returned by POST /finance/payments/qr — payload for the customer-facing QR. */
export interface UpiPaymentRequest {
  /** `upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…&tr=…` deep-link. */
  upi_link: string;
  /** Server-rendered SVG markup of the QR code — wrap as a
   *  `data:image/svg+xml;utf8,…` URI for safe embedding in an `<img>` tag. */
  qr_svg: string;
  vpa: string;
  payee_name: string;
  amount: number;
  /** Stable reference (the appointment id) — duplicate scans converge. */
  transaction_ref: string;
}

export type LedgerEntryType =
  | 'commission_accrual'
  | 'settlement_payment'
  | 'subscription_fee'
  | 'adjustment';

export interface LedgerEntry {
  id: string;
  entry_type: LedgerEntryType;
  /** Signed: positive = vendor owes platform, negative = vendor paid platform. */
  amount: number;
  /** Running balance snapshot after this entry. */
  balance_after: number;
  transaction_id: string | null;
  notes: string | null;
  external_ref: string | null;
  created_at: string;
}

export interface VendorDues {
  /** Current outstanding balance in INR. Positive → vendor owes platform. */
  outstanding: number;
  /** When `outstanding >= block_threshold`, new bookings are blocked. */
  block_threshold: number;
  is_blocked: boolean;
  last_settlement_at: string | null;
  /** Platform's UPI VPA (where the vendor sends settlements). */
  platform_collection_vpa: string | null;
  platform_collection_name: string;
  recent_entries: LedgerEntry[];
}

export interface RecordSettlementPayload {
  amount: number;
  external_ref?: string;
  notes?: string;
  /** Super-admin only — settle on behalf of another vendor. Omit for self. */
  vendor_id?: string;
  vendor_type?: VendorType;
}
