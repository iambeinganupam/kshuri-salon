// ─────────────────────────────────────────────────────────────────────────────
// Entitlements Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as entitlementsService from '../services/entitlements.service';
import type {
  CreateFeaturePayload,
  UpdateFeaturePayload,
  CreateOverridePayload,
} from '../types/entitlements.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const entitlementKeys = {
  features: ['entitlements', 'features'] as const,
  feature: (code: string) => [...entitlementKeys.features, code] as const,
  planEntitlements: (code: string) => [...entitlementKeys.feature(code), 'plans'] as const,
  overrides: (code: string) => [...entitlementKeys.feature(code), 'overrides'] as const,
};

// ── Feature Queries ───────────────────────────────────────────────────────────

/** GET /admin/features */
export function useFeatures(activeOnly?: boolean) {
  const client = useApiClient();
  return useQuery({
    queryKey: [...entitlementKeys.features, { activeOnly }],
    queryFn: () => entitlementsService.listFeatures(client, activeOnly),
  });
}

/** GET /admin/features/:code */
export function useFeature(code: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: entitlementKeys.feature(code),
    queryFn: () => entitlementsService.getFeature(client, code),
    enabled: !!code,
  });
}

/** GET /admin/features/:code/plans */
export function usePlanEntitlements(code: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: entitlementKeys.planEntitlements(code),
    queryFn: () => entitlementsService.listPlanEntitlementsForFeature(client, code),
    enabled: !!code,
  });
}

/** GET /admin/features/:code/overrides */
export function useFeatureOverrides(code: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: entitlementKeys.overrides(code),
    queryFn: () => entitlementsService.listOverridesForFeature(client, code),
    enabled: !!code,
  });
}

// ── Feature Mutations ─────────────────────────────────────────────────────────

/** POST /admin/features */
export function useCreateFeature() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFeaturePayload) =>
      entitlementsService.createFeature(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entitlementKeys.features });
    },
  });
}

/** PATCH /admin/features/:code */
export function useUpdateFeature() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, patch }: { code: string; patch: UpdateFeaturePayload }) =>
      entitlementsService.updateFeature(client, code, patch),
    onSuccess: (_data, { code }) => {
      queryClient.invalidateQueries({ queryKey: entitlementKeys.features });
      queryClient.invalidateQueries({ queryKey: entitlementKeys.feature(code) });
    },
  });
}

// ── Plan Entitlement Mutations ────────────────────────────────────────────────

/** PUT /admin/features/:code/plans/:plan_code */
export function useSetPlanEntitlement() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      code,
      planCode,
      value,
    }: {
      code: string;
      planCode: string;
      value: unknown;
    }) => entitlementsService.setPlanEntitlement(client, code, planCode, value),
    onSuccess: (_data, { code }) => {
      queryClient.invalidateQueries({ queryKey: entitlementKeys.planEntitlements(code) });
    },
  });
}

/** DELETE /admin/features/:code/plans/:plan_code */
export function useDeletePlanEntitlement() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, planCode }: { code: string; planCode: string }) =>
      entitlementsService.deletePlanEntitlement(client, code, planCode),
    onSuccess: (_data, { code }) => {
      queryClient.invalidateQueries({ queryKey: entitlementKeys.planEntitlements(code) });
    },
  });
}

// ── Override Mutations ────────────────────────────────────────────────────────

/** POST /admin/features/:code/overrides */
export function useCreateOverride() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, payload }: { code: string; payload: CreateOverridePayload }) =>
      entitlementsService.createOverride(client, code, payload),
    onSuccess: (_data, { code }) => {
      queryClient.invalidateQueries({ queryKey: entitlementKeys.overrides(code) });
    },
  });
}

/** DELETE /admin/overrides/:id */
export function useDeleteOverride() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; featureCode: string }) =>
      entitlementsService.deleteOverride(client, id),
    onSuccess: (_data, { featureCode }) => {
      queryClient.invalidateQueries({ queryKey: entitlementKeys.overrides(featureCode) });
    },
  });
}
