// ─────────────────────────────────────────────────────────────────────────────
// Engagement Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-customer-dashboard/src/api/engagement.ts
//   - kshuri-salon-dashboard/src/api/engagement.ts
//   - kshuri-freelancer-dashboard/src/api/engagement.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { VendorType } from './common.types';

/** Review submitted by a customer after an appointment */
export interface Review {
  id: string;
  appointment_id: string;
  vendor_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

/** A review surfaced to the vendor in their dashboard */
export interface VendorReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  vendor_reply: string | null;
  vendor_reply_at: string | null;
  author_name: string;
  created_at: string;
}

/** Aggregated rating summary returned alongside a vendor's review list */
export interface VendorReviewSummary {
  total_count: number;
  avg_rating: number;
  rating_5: number;
  rating_4: number;
  rating_3: number;
  rating_2: number;
  rating_1: number;
}

export interface VendorReviewsResponse {
  items: VendorReviewItem[];
  summary: VendorReviewSummary;
}

/** Payload for POST /engagement/reviews */
export interface SubmitReviewPayload {
  appointment_id: string;
  vendor_id: string;
  vendor_type: VendorType;
  rating: number;
  comment?: string;
}

/** Favorited vendor */
export interface Favorite {
  id: string;
  vendor_id: string;
  vendor_type: VendorType;
  vendor_name: string;
  /** URL slug for linking to /vendors/[slug]. Null when the vendor has not been
   *  assigned one (legacy rows pre-migration 063). */
  url_slug: string | null;
  logo_url: string | null;
  avg_rating: number | null;
  created_at: string;
}

/** Notification types across the platform */
export type NotificationType =
  | 'new_booking'
  | 'booking_cancelled'
  | 'review_received'
  | 'payout_processed'
  | 'system';

/** User notification */
export interface Notification {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string;
  is_read: boolean;
  metadata?: {
    appointment_id?: string;
    customer_name?: string;
    amount?: number;
    [key: string]: unknown;
  };
  created_at: string;
}

// ── R1 polymorphic reviews ──────────────────────────────────────────────────
// Targets reviews at one of three concrete kinds (vendor / service_line /
// product). The backend resolves vendor_type+vendor_id from `target_id` so the
// client only sends the polymorphic pair.

export type ReviewTargetKind = 'vendor' | 'service_line' | 'product';

export interface ReviewPhoto {
  url: string;
  w: number;
  h: number;
}

/** R1 review list row. vendor_reply is not surfaced by the R1 list endpoint. */
export interface ReviewItem {
  id: string;
  customer_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  photos: ReviewPhoto[];
  helpful_count: number;
  created_at: string;
}

export interface ReviewListResponse {
  items: ReviewItem[];
  nextCursor: string | null;
}

export interface CreateReviewInput {
  target_kind: ReviewTargetKind;
  target_id: string;
  rating: number;
  title?: string;
  comment?: string;
  photos?: ReviewPhoto[];
}

export interface CreatedReview {
  id: string;
  customer_id: string;
  vendor_type: 'freelancer' | 'salon_location';
  vendor_id: string;
  target_kind: ReviewTargetKind;
  target_id: string;
  appointment_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  photos: ReviewPhoto[];
  helpful_count: number;
  created_at: string;
}

export interface ReviewAggregateBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ReviewAggregate {
  targetId: string;
  ratingAvg: number;
  ratingCount: number;
  breakdown: ReviewAggregateBreakdown;
  photoCount: number;
}

export interface ListReviewsParams {
  target_kind: ReviewTargetKind;
  target_id: string;
  sort?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  with_photos?: 'true' | 'false';
  limit?: number;
  cursor?: string;
}

export interface HelpfulToggleResult {
  helpful_count: number;
  voted: boolean;
}
