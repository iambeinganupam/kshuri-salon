// ─────────────────────────────────────────────────────────────────────────────
// Public Stats Hook — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as publicStatsService from '../services/public-stats.service';

export const publicStatsKeys = {
  all: ['public-stats'] as const,
};

/** Homepage hero counters. Cached 5 minutes on the server; we add a 5-minute
 *  staleTime here so a portal navigation back to `/` doesn't re-fetch. */
export function usePublicStats(enabled = true) {
  const client = useApiClient();
  return useQuery({
    queryKey: publicStatsKeys.all,
    queryFn: () => publicStatsService.getPublicStats(client),
    enabled,
    staleTime: 5 * 60_000,
  });
}
