// ─────────────────────────────────────────────────────────────────────────────
// Meta Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// The backend caches enum responses for 5 minutes (max-age=300). We mirror
// that on the client with React Query staleTime so app navigation does not
// re-hit the network for stable values. Set `gcTime` to one hour so the
// catalogue survives across page transitions even when stale.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as metaService from '../services/meta.service';
import type { EnumName } from '../types/meta.types';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_HOUR_MS     = 60 * 60 * 1000;

export const metaKeys = {
  all:     ['meta'] as const,
  enums:   () => [...metaKeys.all, 'enums'] as const,
  enum:    (name: EnumName) => [...metaKeys.enums(), name] as const,
};

/** Full enum catalogue. Returns `data` as a Record keyed by enum name. */
export function useEnums() {
  const client = useApiClient();
  return useQuery({
    queryKey: metaKeys.enums(),
    queryFn:  () => metaService.listEnums(client),
    staleTime: FIVE_MINUTES_MS,
    gcTime:    ONE_HOUR_MS,
  });
}

/** Single enum's values. Convenience wrapper around `useEnums` for one key. */
export function useEnum(name: EnumName) {
  const client = useApiClient();
  return useQuery({
    queryKey: metaKeys.enum(name),
    queryFn:  () => metaService.getEnum(client, name),
    staleTime: FIVE_MINUTES_MS,
    gcTime:    ONE_HOUR_MS,
  });
}
