// ─────────────────────────────────────────────────────────────────────────────
// Plans Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as plansService from '../services/plans.service';
import type { SubscribePayload } from '../types/plans.types';

export const planKeys = {
  all: ['plans'] as const,
  list: () => [...planKeys.all, 'list'] as const,
  me: () => [...planKeys.all, 'me'] as const,
};

/** Public catalog — used by the Settings → Plan tab. */
export function usePlans() {
  const client = useApiClient();
  return useQuery({
    queryKey: planKeys.list(),
    queryFn: () => plansService.listPlans(client),
    // Plans are admin-tunable but rarely change — cache for 30 min.
    staleTime: 30 * 60 * 1000,
  });
}

/** Vendor's currently effective plan (active subscription or fallback). */
export function useMyPlan() {
  const client = useApiClient();
  return useQuery({
    queryKey: planKeys.me(),
    queryFn: () => plansService.getMyPlan(client),
  });
}

/** Switch to a paid plan. Invalidates the vendor's effective plan, the
 *  dues view (subscription fee was just invoiced) and the catalog. */
export function useSubscribeToPlan() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubscribePayload) => plansService.subscribeToPlan(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.me() });
      queryClient.invalidateQueries({ queryKey: ['finance', 'dues'] });
    },
  });
}
