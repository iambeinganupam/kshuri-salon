// ─────────────────────────────────────────────────────────────────────────────
// Messaging — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

export const createThreadSchema = z.object({
  vendor_type:    z.enum(['freelancer', 'salon_location']),
  vendor_id:      z.string().uuid(),
  appointment_id: z.string().uuid().optional(),
});

export const sendMessageSchema = z.object({
  body:     z.string().trim().min(1).max(4000),
  media_id: z.string().uuid().optional(),
});

export const pollQuerySchema = z.object({
  since: z.coerce.number().int().min(0).default(0),
});

export const markReadSchema = z.object({
  upto_seq: z.coerce.number().int().min(1),
});

export const threadIdParam = z.object({ id: z.string().uuid() });

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type SendMessageInput  = z.infer<typeof sendMessageSchema>;
export type PollQuery         = z.infer<typeof pollQuerySchema>;
export type MarkReadInput     = z.infer<typeof markReadSchema>;
