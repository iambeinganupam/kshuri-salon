// ─────────────────────────────────────────────────────────────────────────────
// CMS — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

export const createPageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  content: z.string().min(1),
  meta_title: z.string().max(100).optional(),
  meta_description: z.string().max(200).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  meta_title: z.string().max(100).optional(),
  meta_description: z.string().max(200).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const contactFormSchema = z.object({
  first_name: z.string().min(1).max(50),
  email_address: z.string().email(),
  inquiry_type: z.enum(['partnership', 'support', 'feedback', 'press', 'other']),
  message_body: z.string().min(10).max(2000),
});

export const newsletterSchema = z.object({
  email_address: z.string().email(),
});

export const createPlannerEventSchema = z.object({
  event_name: z.string().min(1).max(200),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const toggleTaskSchema = z.object({
  is_completed: z.boolean(),
});

export const pageListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  tag: z.string().optional(),
  cursor: z.string().optional(),
});

export const pageIdParam = z.object({ id: z.string().uuid() });
export const slugParam = z.object({ slug: z.string().min(1).max(200) });
export const plannerEventIdParam = z.object({ id: z.string().uuid() });
export const taskIdParam = z.object({ taskId: z.string().uuid() });

// Platform callouts — admin-managed marketing copy rendered on public pages.
export const calloutQuerySchema = z.object({
  context: z.string().min(1).max(50).default('auth_page'),
});

export const createCalloutSchema = z.object({
  context: z.string().min(1).max(50).default('auth_page'),
  key: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(50),
  text: z.string().min(1).max(500),
  sort_order: z.number().int().min(0).max(1000).default(0),
  is_active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateCalloutSchema = z.object({
  context: z.string().min(1).max(50).optional(),
  key: z.string().min(1).max(50).nullable().optional(),
  icon: z.string().min(1).max(50).optional(),
  text: z.string().min(1).max(500).optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (v) => Object.keys(v).length > 0,
  { message: 'At least one field is required' },
);

export const calloutIdParam = z.object({ id: z.string().uuid() });

export const testimonialQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
