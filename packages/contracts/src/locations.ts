// ─────────────────────────────────────────────────────────────────────────────
// Locations — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

// Inlined from backend/src/lib/pagination.ts so this package stays
// backend-independent. Keep in sync if MAX_PAGE_SIZE changes there.
const MAX_PAGE_SIZE = 100;

export const citiesQuerySchema = z.object({
  search: z.string().trim().min(1).max(64).optional(),
  limit:  z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(MAX_PAGE_SIZE),
});

export type CitiesQuery = z.infer<typeof citiesQuerySchema>;
