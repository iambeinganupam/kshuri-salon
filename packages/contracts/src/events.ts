// ─────────────────────────────────────────────────────────────────────────────
// Events — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

export const createEventSchema = z.object({
  event_name: z.string().min(1).max(200),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  notes: z.string().max(2000).optional(),
});

export const updateEventSchema = z.object({
  event_name: z.string().min(1).max(200).optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
});

export const addAttendeeSchema = z.object({
  guest_name: z.string().min(1).max(100),
  service_id: z.string().uuid(),
  preferred_vendor_id: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const updateAttendeeSchema = z.object({
  guest_name: z.string().min(1).max(100).optional(),
  service_id: z.string().uuid().optional(),
  preferred_vendor_id: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const checkoutEventSchema = z.object({
  payment_method: z.enum(['upi', 'card', 'cash']),
  payment_gateway_ref: z.string().optional(),
});

export const eventIdParam = z.object({ id: z.string().uuid() });
export const attendeeIdParam = z.object({ eventId: z.string().uuid(), attendeeId: z.string().uuid() });
