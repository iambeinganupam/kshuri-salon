// ─────────────────────────────────────────────────────────────────────────────
// @kshuri/api-client — Main Entry Point
// ─────────────────────────────────────────────────────────────────────────────
// The shared API client for the Kshuri platform monorepo.
//
// Replaces 6 duplicate copies of apiClient.ts, auth-context.tsx, and api/*.ts
// files across the monorepo with a single, centralized package.
//
// Architecture:
//   client/   → Axios factory + token manager (HTTP plumbing)
//   types/    → All domain types (consolidated from per-app duplicates)
//   services/ → HTTP call functions (one per backend module)
//   hooks/    → React Query hooks (primary consumer interface)
//   providers/ → React context for injecting the Axios client
//
// Usage in any app:
//   import { createApiClient, TokenManager } from '@kshuri/api-client/client';
//   import { ApiClientProvider } from '@kshuri/api-client';
//   import { useProfile, useServices } from '@kshuri/api-client/hooks';
//   import type { AuthUser, VendorService } from '@kshuri/api-client/types';
// ─────────────────────────────────────────────────────────────────────────────

// ── Client (HTTP layer) ──────────────────────────────────────────────────────
export { createApiClient } from './client/create-api-client';
export { TokenManager } from './client/token-manager';
export type { TenantContext } from './client/token-manager';
export type {
  ApiClientConfig,
  ApiSuccessResponse,
  ApiPaginatedResponse,
  ApiErrorResponse,
  PaginationMeta,
  PaginatedResult,
} from './client/types';

// ── Provider ─────────────────────────────────────────────────────────────────
export { ApiClientProvider, useApiClient } from './providers/ApiClientProvider';
export type { ApiClientProviderProps } from './providers/ApiClientProvider';

// ── Types (re-export everything) ──────────────────────────────────────────────
export * from './types/index';

// ── Hooks (re-export everything) ──────────────────────────────────────────────
export * from './hooks/index';

// ── Utils ────────────────────────────────────────────────────────────────────
export { extractApiErrorMessage, extractApiErrorCode } from './utils/errors';
export {
  RoleMismatchError,
  assertExpectedRole,
  isRoleMismatchError,
  isPhoneNotRegisteredError,
  ROLE_LABEL,
  ROLE_DASHBOARD_SLUG,
} from './utils/roles';
export { directionsUrl, haversineKm } from './utils/geo';
export { useOptimisticMutation } from './utils/optimistic';
export type {
  UseOptimisticMutationOptions,
  OptimisticContext,
} from './utils/optimistic';
export { createFeatureFlags } from './utils/feature-flags';
export { createQueryClient } from './utils/query-client';

// ── Notifications (flat facade) ───────────────────────────────────────────────
export * from './notifications';

// ── KYC (flat facade) ─────────────────────────────────────────────────────────
export * from './kyc';

// ── Entitlements (flat facade) ────────────────────────────────────────────────
export * from './entitlements';

// ── Messaging (flat facade) ───────────────────────────────────────────────────
export * from './messaging';
