// ─────────────────────────────────────────────────────────────────────────────
// Entitlements — @kshuri/api-client
// Flat re-export of entitlements types and service functions.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  FeatureValueKind,
  FeatureDefinitionDto,
  PlanEntitlementDto,
  VendorOverrideDto,
  CreateFeaturePayload,
  UpdateFeaturePayload,
  CreateOverridePayload,
} from './types/entitlements.types';

export {
  listFeatures,
  getFeature,
  createFeature,
  updateFeature,
  listPlanEntitlementsForFeature,
  setPlanEntitlement,
  deletePlanEntitlement,
  listOverridesForFeature,
  createOverride,
  deleteOverride,
} from './services/entitlements.service';
