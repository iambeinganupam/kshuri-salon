// ─────────────────────────────────────────────────────────────────────────────
// Types Barrel Export — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Re-exports all domain types from a single entry point.
// Usage: import type { AuthUser, Appointment, VendorService } from '@kshuri/api-client/types';
// ─────────────────────────────────────────────────────────────────────────────

export * from './common.types';
export * from './auth.types';
export * from './catalog.types';
export * from './admin-categories.types';
export * from './booking.types';
export * from './discovery.types';
export * from './business.types';
export * from './finance.types';
export * from './availability.types';
export type {
  Review,
  VendorReviewItem,
  VendorReviewSummary,
  VendorReviewsResponse,
  SubmitReviewPayload,
  Favorite,
  Notification,
} from './engagement.types';
export * from './notification.types';
export * from './media.types';
export * from './analytics.types';
export * from './staff.types';
export * from './cms.types';
export * from './admin.types';
export * from './events.types';
export * from './event-manager.types';
export * from './freelancer.types';
export * from './assignment.types';
export * from './plans.types';
export * from './devices.types';
export * from './address.types';
export * from './kyc.types';
export * from './entitlements.types';
export * from './messaging.types';
export * from './meta.types';
export * from './public-stats.types';
export * from './customer-finance.types';

// Re-export AudienceKey from the client module so consumers can do
// `import type { AudienceKey } from '@kshuri/api-client/types'` alongside
// the other public types.
export type { AudienceKey } from '../client/types';
