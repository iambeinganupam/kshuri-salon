// ─────────────────────────────────────────────────────────────────────────────
// Notifications — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

export const listNotificationsQuery = z.object({
  cursor: z.string().datetime().optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  unread: z.coerce.boolean().optional(),
});

export const markReadSchema = z.union([
  z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }),
  z.object({ all: z.literal(true) }),
]);

export const updatePreferencesSchema = z.object({
  in_app_enabled:  z.boolean().optional(),
  push_enabled:    z.boolean().optional(),
  email_enabled:   z.boolean().optional(),
  sms_enabled:     z.boolean().optional(),
  type_overrides:  z.record(z.string(), z.record(z.string(), z.boolean())).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;
export type MarkReadInput          = z.infer<typeof markReadSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
