// ─────────────────────────────────────────────────────────────────────────────
// Public Stats Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type { PublicStats } from '../types/public-stats.types';

/** B1: Public homepage stats. PUBLIC, no auth required. Backend memoizes
 *  the underlying counts for 5 minutes. */
export async function getPublicStats(client: AxiosInstance): Promise<PublicStats> {
  const { data } = await client.get<{ success: true; data: PublicStats }>(
    '/public/stats',
  );
  return data.data;
}
