// ─────────────────────────────────────────────────────────────────────────────
// KYC — @kshuri/api-client
// Flat re-export of KYC types and service functions.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  KycDocumentType,
  KycStatus,
  KycConfidence,
  KycCheckResultDto,
  KycSubmissionDto,
  KycPlanDto,
  KycStatusResponse,
  KycSubmitPayload,
  KycDecisionPayload,
  KycPendingItem,
} from './types/kyc.types';

export {
  submitKyc,
  getKycStatus,
  listPendingKyc,
  decideKyc,
} from './services/kyc.service';
