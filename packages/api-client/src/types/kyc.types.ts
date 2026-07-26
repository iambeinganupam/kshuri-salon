// ─────────────────────────────────────────────────────────────────────────────
// KYC Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

export type KycDocumentType = 'aadhaar' | 'pan';
export type KycStatus =
  | 'not_started'
  | 'submitted'
  | 'auto_passed'
  | 'auto_flagged'
  | 'approved'
  | 'rejected';
export type KycConfidence = 'high' | 'medium' | 'low';

export interface KycCheckResultDto {
  check: string;
  passed: boolean;
  score: number;
  detail?: string;
}

export interface KycSubmissionDto {
  id: string;
  vendor_type: 'freelancer' | 'salon_location';
  vendor_id: string;
  user_id: string;
  document_type: KycDocumentType;
  document_number: string; // masked for non-admin reads
  document_media_id: string;
  selected_plan_code: string;
  status: KycStatus;
  auto_check_results: KycCheckResultDto[];
  auto_confidence: KycConfidence | null;
  auto_checked_at: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface KycPlanDto {
  code: string;
  display_name: string;
}

export interface KycStatusResponse {
  status: KycStatus;
  submission?: KycSubmissionDto;
  plan: KycPlanDto;
}

export interface KycSubmitPayload {
  document_type: KycDocumentType;
  document_number: string;
  media_id: string;
  plan_code: string;
}

export interface KycDecisionPayload {
  action: 'approve' | 'reject';
  target_type?: 'freelancer' | 'salon_location';
  reason?: string;
}

export interface KycPendingItem extends KycSubmissionDto {
  // Vendor entity
  vendor_name?: string | null;
  brand_name?: string | null;
  gstin?: string | null;
  trade_license?: string | null;
  // Owner identity
  owner_first_name?: string | null;
  owner_last_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  owner_role?: 'customer' | 'freelancer' | 'business_admin' | 'staff' | 'event_manager' | 'super_admin' | null;
  owner_created_at?: string | null;
  // Primary address
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  gender_preference?: 'unisex' | 'men' | 'women' | null;
  // Plan
  plan_name?: string | null;
  plan_monthly_fee_inr?: number | null;
  plan_commission_percent?: number | null;
  // Document signed URL (admin-only)
  document_url?: string | null;
}
