// ─────────────────────────────────────────────────────────────────────────────
// KYC Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as kycService from '../services/kyc.service';
import type { KycSubmitPayload, KycDecisionPayload } from '../types/kyc.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const kycKeys = {
  all: ['kyc'] as const,
  me: () => [...kycKeys.all, 'me'] as const,
  pending: () => [...kycKeys.all, 'pending'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** GET /kyc/me — vendor's own KYC status */
export function useKycStatus() {
  const client = useApiClient();
  return useQuery({
    queryKey: kycKeys.me(),
    queryFn: () => kycService.getKycStatus(client),
  });
}

/** GET /admin/kyc/pending — super_admin: list pending submissions */
export function usePendingKyc() {
  const client = useApiClient();
  return useQuery({
    queryKey: kycKeys.pending(),
    queryFn: () => kycService.listPendingKyc(client),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** POST /kyc/submit */
export function useSubmitKyc() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: KycSubmitPayload) => kycService.submitKyc(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all });
    },
  });
}

/** PATCH /admin/kyc/:id — super_admin: approve or reject */
export function useDecideKyc() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: KycDecisionPayload }) =>
      kycService.decideKyc(client, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.pending() });
    },
  });
}
