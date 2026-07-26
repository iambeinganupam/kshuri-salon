// ─────────────────────────────────────────────────────────────────────────────
// Entitlements Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

export type FeatureValueKind = 'boolean' | 'count' | 'enum';

export interface FeatureDefinitionDto {
  code: string;
  display_name: string;
  description: string | null;
  value_kind: FeatureValueKind;
  enum_values: string[] | null;
  default_value: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanEntitlementDto {
  plan_code: string;
  feature_code: string;
  value: unknown;
  updated_at: string;
}

export interface VendorOverrideDto {
  id: string;
  vendor_type: 'freelancer' | 'salon_location';
  vendor_id: string;
  feature_code: string;
  value: unknown;
  reason: string;
  expires_at: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateFeaturePayload {
  code: string;
  display_name: string;
  description?: string;
  value_kind: FeatureValueKind;
  enum_values?: string[];
  default_value: unknown;
}

export interface UpdateFeaturePayload extends Partial<Omit<FeatureDefinitionDto, 'code' | 'created_at' | 'updated_at'>> {}

export interface CreateOverridePayload {
  vendor_type: 'freelancer' | 'salon_location';
  vendor_id: string;
  value: unknown;
  reason: string;
  expires_at?: string;
}
