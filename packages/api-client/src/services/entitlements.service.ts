// ─────────────────────────────────────────────────────────────────────────────
// Entitlements Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  FeatureDefinitionDto,
  PlanEntitlementDto,
  VendorOverrideDto,
  CreateFeaturePayload,
  UpdateFeaturePayload,
  CreateOverridePayload,
} from '../types/entitlements.types';

/** GET /admin/features */
export async function listFeatures(
  client: AxiosInstance,
  activeOnly?: boolean,
): Promise<FeatureDefinitionDto[]> {
  const { data } = await client.get<{ success: true; data: FeatureDefinitionDto[] }>(
    '/admin/features',
    { params: activeOnly ? { active_only: true } : {} },
  );
  return data.data;
}

/** GET /admin/features/:code */
export async function getFeature(
  client: AxiosInstance,
  code: string,
): Promise<FeatureDefinitionDto> {
  const { data } = await client.get<{ success: true; data: FeatureDefinitionDto }>(
    `/admin/features/${code}`,
  );
  return data.data;
}

/** POST /admin/features */
export async function createFeature(
  client: AxiosInstance,
  payload: CreateFeaturePayload,
): Promise<FeatureDefinitionDto> {
  const { data } = await client.post<{ success: true; data: FeatureDefinitionDto }>(
    '/admin/features',
    payload,
  );
  return data.data;
}

/** PATCH /admin/features/:code */
export async function updateFeature(
  client: AxiosInstance,
  code: string,
  patch: UpdateFeaturePayload,
): Promise<FeatureDefinitionDto> {
  const { data } = await client.patch<{ success: true; data: FeatureDefinitionDto }>(
    `/admin/features/${code}`,
    patch,
  );
  return data.data;
}

/** GET /admin/features/:code/plans */
export async function listPlanEntitlementsForFeature(
  client: AxiosInstance,
  code: string,
): Promise<PlanEntitlementDto[]> {
  const { data } = await client.get<{ success: true; data: PlanEntitlementDto[] }>(
    `/admin/features/${code}/plans`,
  );
  return data.data;
}

/** PUT /admin/features/:code/plans/:plan_code */
export async function setPlanEntitlement(
  client: AxiosInstance,
  code: string,
  planCode: string,
  value: unknown,
): Promise<PlanEntitlementDto> {
  const { data } = await client.put<{ success: true; data: PlanEntitlementDto }>(
    `/admin/features/${code}/plans/${planCode}`,
    { value },
  );
  return data.data;
}

/** DELETE /admin/features/:code/plans/:plan_code */
export async function deletePlanEntitlement(
  client: AxiosInstance,
  code: string,
  planCode: string,
): Promise<void> {
  await client.delete(`/admin/features/${code}/plans/${planCode}`);
}

/** GET /admin/features/:code/overrides */
export async function listOverridesForFeature(
  client: AxiosInstance,
  code: string,
): Promise<VendorOverrideDto[]> {
  const { data } = await client.get<{ success: true; data: VendorOverrideDto[] }>(
    `/admin/features/${code}/overrides`,
  );
  return data.data;
}

/** POST /admin/features/:code/overrides */
export async function createOverride(
  client: AxiosInstance,
  code: string,
  payload: CreateOverridePayload,
): Promise<VendorOverrideDto> {
  const { data } = await client.post<{ success: true; data: VendorOverrideDto }>(
    `/admin/features/${code}/overrides`,
    payload,
  );
  return data.data;
}

/** DELETE /admin/overrides/:id */
export async function deleteOverride(client: AxiosInstance, id: string): Promise<void> {
  await client.delete(`/admin/overrides/${id}`);
}
