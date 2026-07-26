// ─────────────────────────────────────────────────────────────────────────────
// Media — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

export const mediaUploadSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  caption: z.string().max(200).optional(),
  media_type: z.enum(['portfolio', 'before_after', 'profile', 'cover', 'kyc']).default('portfolio'),
  is_public: z.coerce.boolean().default(true),
  is_featured: z.coerce.boolean().default(false),
  service_id: z.string().uuid().optional(),
  /**
   * Caller's intent hint. When `purpose === 'kyc'` the controller forces
   * `media_type='kyc'` + `is_public=false` regardless of what the client
   * sent — so an old client that doesn't know about the new media_type
   * still uploads KYC docs into the right bucket and they never leak into
   * the portfolio gallery.
   */
  purpose: z.enum(['portfolio', 'kyc']).optional(),
});

export const mediaUpdateSchema = z.object({
  caption: z.string().max(200).optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  is_public: z.boolean().optional(),
  service_id: z.string().uuid().nullable().optional(),
});

export const mediaListQuerySchema = z.object({
  category_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
});

export const mediaIdParam = z.object({ id: z.string().uuid() });
