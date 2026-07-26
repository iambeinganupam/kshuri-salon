// ─────────────────────────────────────────────────────────────────────────────
// Plans — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

export const planCodeSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9_]+$/, 'Plan code must be lowercase snake_case');

export const subscribeToPlanSchema = z.object({
  plan_code: planCodeSchema,
  /** Convenience: caller may opt to skip writing the subscription_fee
   *  ledger entry — useful for migrating existing seed accounts where
   *  the first month is on the house. Defaults to false (do charge). */
  waive_first_month: z.boolean().optional().default(false),
});

export type SubscribeToPlanInput = z.infer<typeof subscribeToPlanSchema>;
