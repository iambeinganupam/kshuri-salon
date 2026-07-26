// ─────────────────────────────────────────────────────────────────────────────
// KYC — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

const AADHAAR_RE = /^\d{12}$/;
const PAN_RE     = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const submitKycSchema = z.object({
  document_type:   z.enum(['aadhaar', 'pan']),
  document_number: z.string().trim(),
  media_id:        z.string().uuid(),
  plan_code:       z.string().regex(/^[a-z][a-z0-9_]{1,63}$/),
}).superRefine((v, ctx) => {
  if (v.document_type === 'aadhaar' && !AADHAAR_RE.test(v.document_number)) {
    ctx.addIssue({ code: 'custom', path: ['document_number'], message: 'aadhaar must be 12 digits' });
  }
  if (v.document_type === 'pan' && !PAN_RE.test(v.document_number.toUpperCase())) {
    ctx.addIssue({ code: 'custom', path: ['document_number'], message: 'invalid PAN format' });
  }
});

export const kycDecisionSchema = z.object({
  action:      z.enum(['approve', 'reject']),
  target_type: z.enum(['freelancer', 'salon_location']).optional(),
  reason:      z.string().trim().min(10).max(1000).optional(),
}).superRefine((v, ctx) => {
  if (v.action === 'reject' && (!v.reason || v.reason.trim().length < 10)) {
    ctx.addIssue({ code: 'custom', path: ['reason'], message: 'rejection requires a reason of at least 10 characters' });
  }
});

export const kycIdParam = z.object({ id: z.string().uuid() });
