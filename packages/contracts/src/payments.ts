// ─────────────────────────────────────────────────────────────────────────────
// Payments — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

// Inlined from backend/src/lib/pagination.ts to keep the contracts package
// backend-independent. Keep in sync if those constants change.
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const paginationLimitSchema = z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE);
const paginationOffsetSchema = z.coerce.number().int().min(0).default(0);

/** Validated payload after HMAC signature check in the webhook controller. */
export const recordPaymentAttemptSchema = z.object({
  appointment_id: z.string().uuid().optional(),
  vendor_id: z.string().uuid(),
  amount_paise: z.number().int().positive(),
  currency: z.string().length(3).default('INR'),
  provider: z.string().min(1).max(64),
  provider_ref: z.string().max(255).optional(),
  status: z.enum(['settled', 'failed', 'pending']),
  payment_method: z.enum(['upi', 'card', 'cash']).optional(),
  gateway_response: z.record(z.unknown()).optional(),
});

export type RecordPaymentAttemptInput = z.infer<typeof recordPaymentAttemptSchema>;

/** Admin-initiated refund request body. */
export const refundRequestSchema = z.object({
  reason: z.string().min(1).max(500),
});

export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

/** URL param for single-transaction operations. */
export const txIdParamSchema = z.object({
  id: z.string().uuid(),
});

/** Query params for admin/vendor transaction listing. */
export const listTransactionsQuerySchema = z.object({
  limit: paginationLimitSchema,
  offset: paginationOffsetSchema,
  status: z.enum(['pending', 'settled', 'refunded']).optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
