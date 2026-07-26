// ─────────────────────────────────────────────────────────────────────────────
// Engagement — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

export const createReviewSchema = z.object({
  appointment_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const replyReviewSchema = z.object({
  reply_text: z.string().min(1).max(1000),
});

export const reviewIdParam = z.object({ id: z.string().uuid() });

export const favoriteSchema = z.object({
  vendor_type: z.enum(['freelancer', 'salon_location']),
  vendor_id: z.string().uuid(),
});

// Vendor-side reviews list (salon admin / freelancer reading their own reviews).
// Tenant ownership of `vendor_id` is enforced in the service layer.
export const listVendorReviewsSchema = z.object({
  vendor_type: z.enum(['freelancer', 'salon_location']),
  vendor_id: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const favoriteIdParam = z.object({ id: z.string().uuid() });

export const notificationListSchema = z.object({
  // Query-string booleans need explicit string-equality coercion. `z.coerce.boolean()`
  // would treat the literal string 'false' as truthy, so `?is_read=false` would be
  // interpreted as `is_read=true` and unread-only filtering would silently fail.
  is_read: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const notificationIdParam = z.object({ id: z.string().uuid() });

// Skill endorsements — any authenticated user can endorse another user's skill once.
export const skillEndorsementParamSchema = z.object({ skillId: z.string().uuid('Invalid skill ID') });

// ─────────────────────────────────────────────────────────────────────────────
// Polymorphic review schemas (R1 — vendor / service_line / product targets).
// Mirror the `review_target_kind` enum in backend migration 075.
// ─────────────────────────────────────────────────────────────────────────────

const targetKindEnum = z.enum(['vendor', 'service_line', 'product']);

const photoItem = z.object({
  url: z.string().url(),
  w:   z.number().int().positive(),
  h:   z.number().int().positive(),
});

// Request body for POST /reviews. The service tier picks the underlying
// appointment_id from the customer's completed appointments for the target
// (eligibility already proved one exists for vendor + service_line kinds);
// callers do not pass it explicitly.
export const createReviewBody = z.object({
  target_kind: targetKindEnum,
  target_id:   z.string().uuid(),
  rating:      z.number().int().min(1).max(5),
  title:       z.string().min(1).max(120).optional(),
  comment:     z.string().min(1).max(2000).optional(),
  photos:      z.array(photoItem).max(5).default([]),
});

export const listReviewsQuery = z.object({
  target_kind: targetKindEnum,
  target_id:   z.string().uuid(),
  sort:        z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).default('recent'),
  // Query-string boolean — `.transform(s => s === 'true')` so `'false'` is honoured.
  with_photos: z.string().transform((s) => s === 'true').optional(),
  limit:       z.coerce.number().int().min(1).max(50).default(20),
  cursor:      z.string().optional(),
});

export const reportReviewBody = z.object({
  reason: z.string().min(3).max(500),
});

export const reviewAggregatesQuery = z.object({
  target_kind: targetKindEnum,
  target_ids:  z
    .string()
    .transform((s) => s.split(',').filter(Boolean))
    .pipe(z.array(z.string().uuid()).min(1).max(50)),
});
