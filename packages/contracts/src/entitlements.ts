// ─────────────────────────────────────────────────────────────────────────────
// Entitlements — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

// ── Feature catalog management ──

export const createFeatureSchema = z.object({
  code:          z.string().regex(/^[a-z][a-z0-9_]{1,63}$/),
  display_name:  z.string().trim().min(1).max(120),
  description:   z.string().trim().max(1000).optional(),
  value_kind:    z.enum(['boolean', 'count', 'enum']),
  enum_values:   z.array(z.string().min(1).max(64)).max(32).optional(),
  default_value: z.unknown(),
});

export const updateFeatureSchema = z.object({
  display_name:  z.string().trim().min(1).max(120).optional(),
  description:   z.string().trim().max(1000).optional(),
  default_value: z.unknown().optional(),
  is_active:     z.boolean().optional(),
});

export const featureCodeParam    = z.object({ code: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/) });
export const planCodeParam        = z.object({ plan_code: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/) });
export const featureAndPlanParams = featureCodeParam.merge(planCodeParam);
export const overrideIdParam      = z.object({ id: z.string().uuid() });

export const setPlanEntitlementSchema = z.object({ value: z.unknown() });

export const createOverrideSchema = z.object({
  vendor_type: z.enum(['freelancer', 'salon_location']),
  vendor_id:   z.string().uuid(),
  value:       z.unknown(),
  reason:      z.string().trim().min(5).max(1000),
  expires_at:  z.string().datetime().optional(),
});

export const listFeaturesQuerySchema = z.object({
  active_only: z
    .string()
    .optional()
    .transform(v => v === 'true'),
});
