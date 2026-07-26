// ─────────────────────────────────────────────────────────────────────────────
// Engagement Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  Review,
  SubmitReviewPayload,
  Favorite,
  Notification,
  VendorReviewsResponse,
  CreateReviewInput,
  CreatedReview,
  ListReviewsParams,
  ReviewListResponse,
  ReviewAggregate,
  ReviewTargetKind,
  HelpfulToggleResult,
} from '../types/engagement.types';
import type { VendorType } from '../types/common.types';

/** List the vendor's own reviews + rating distribution. Auth required;
 *  the backend enforces tenant ownership of `vendor_id`. */
export async function listVendorReviews(
  client: AxiosInstance,
  params: { vendor_type: VendorType; vendor_id: string; limit?: number },
): Promise<VendorReviewsResponse> {
  const { data } = await client.get<{ success: true; data: VendorReviewsResponse }>(
    '/engagement/reviews/vendor',
    { params },
  );
  return data.data;
}

/** Submit a review after a completed appointment */
export async function submitReview(
  client: AxiosInstance,
  payload: SubmitReviewPayload,
): Promise<Review> {
  const { data } = await client.post<{ success: true; data: Review }>(
    '/engagement/reviews',
    payload,
  );
  return data.data;
}

/** Add a vendor to favorites */
export async function addFavorite(
  client: AxiosInstance,
  vendorId: string,
  vendorType: 'salon_location' | 'freelancer',
): Promise<Favorite> {
  const { data } = await client.post<{ success: true; data: Favorite }>(
    '/engagement/favorites',
    { vendor_id: vendorId, vendor_type: vendorType },
  );
  return data.data;
}

/** Remove a vendor from favorites */
export async function removeFavorite(client: AxiosInstance, vendorId: string): Promise<void> {
  await client.delete(`/engagement/favorites/${vendorId}`);
}

/** List favorites for current customer */
export async function listFavorites(client: AxiosInstance): Promise<Favorite[]> {
  const { data } = await client.get<{ success: true; data: Favorite[] }>(
    '/engagement/favorites',
  );
  return data.data;
}

/** List notifications (paginated) */
export async function listNotifications(
  client: AxiosInstance,
  params?: { unread_only?: boolean; limit?: number; cursor?: string },
): Promise<{ items: Notification[]; unread_count: number }> {
  const { data } = await client.get<{
    success: true;
    data: Notification[];
    meta: { unread_count: number };
  }>('/engagement/notifications', { params });
  return { items: data.data, unread_count: data.meta?.unread_count ?? 0 };
}

/** Mark a notification as read */
export async function markNotificationRead(
  client: AxiosInstance,
  notificationId: string,
): Promise<void> {
  await client.patch(`/engagement/notifications/${notificationId}/read`);
}

/** Mark all notifications as read */
export async function markAllNotificationsRead(client: AxiosInstance): Promise<void> {
  await client.post('/engagement/notifications/read-all');
}

// ── Skill Endorsements ──────────────────────────────────────────────────────

export interface SkillEndorsementResult {
  skill_id: string;
  endorsed: boolean;
  created?: boolean;
  removed?: boolean;
  endorsement_count: number;
}

export interface SkillEndorsementStatus {
  skill_id: string;
  endorsed: boolean;
  endorsement_count: number;
  is_owner: boolean;
}

export async function endorseSkill(
  client: AxiosInstance,
  skillId: string,
): Promise<SkillEndorsementResult> {
  const { data } = await client.post<{ success: true; data: SkillEndorsementResult }>(
    `/engagement/skills/${skillId}/endorse`,
  );
  return data.data;
}

export async function unendorseSkill(
  client: AxiosInstance,
  skillId: string,
): Promise<SkillEndorsementResult> {
  const { data } = await client.delete<{ success: true; data: SkillEndorsementResult }>(
    `/engagement/skills/${skillId}/endorse`,
  );
  return data.data;
}

export async function getSkillEndorsementStatus(
  client: AxiosInstance,
  skillId: string,
): Promise<SkillEndorsementStatus> {
  const { data } = await client.get<{ success: true; data: SkillEndorsementStatus }>(
    `/engagement/skills/${skillId}/endorsement`,
  );
  return data.data;
}

// ── R1 polymorphic reviews ──────────────────────────────────────────────────
// Distinct from v1 submitReview / listVendorReviews above — these target the
// new polymorphic surface (target_kind + target_id). The list endpoint is
// PUBLIC; create/helpful/report require roleGuard('customer') server-side.

/** POST /engagement/reviews — customer creates a review against vendor /
 *  service_line / product. */
export async function createReview(
  client: AxiosInstance,
  input: CreateReviewInput,
): Promise<CreatedReview> {
  const { data } = await client.post<{ success: true; data: CreatedReview }>(
    '/engagement/reviews',
    input,
  );
  return data.data;
}

/** GET /engagement/reviews — public, cursor-paginated. Backend emits
 *  `meta.nextCursor` (camelCase, matching discovery's convention). */
export async function listReviews(
  client: AxiosInstance,
  params: ListReviewsParams,
): Promise<ReviewListResponse> {
  const { data } = await client.get<{
    success: true;
    data: ReviewListResponse['items'];
    meta: { nextCursor: string | null };
  }>('/engagement/reviews', { params });
  return { items: data.data, nextCursor: data.meta?.nextCursor ?? null };
}

/** GET /engagement/reviews/aggregates — bulk rating breakdown for an array of
 *  target_ids (comma-separated string per the controller schema). */
export async function reviewAggregates(
  client: AxiosInstance,
  params: { target_kind: ReviewTargetKind; target_ids: string },
): Promise<ReviewAggregate[]> {
  const { data } = await client.get<{ success: true; data: ReviewAggregate[] }>(
    '/engagement/reviews/aggregates',
    { params },
  );
  return data.data;
}

/** POST /engagement/reviews/:id/helpful — toggles the caller's helpful vote. */
export async function toggleReviewHelpful(
  client: AxiosInstance,
  reviewId: string,
): Promise<HelpfulToggleResult> {
  const { data } = await client.post<{ success: true; data: HelpfulToggleResult }>(
    `/engagement/reviews/${reviewId}/helpful`,
  );
  return data.data;
}

/** POST /engagement/reviews/:id/report — files a moderation report. */
export async function reportReview(
  client: AxiosInstance,
  reviewId: string,
  reason: string,
): Promise<{ id: string }> {
  const { data } = await client.post<{ success: true; data: { id: string } }>(
    `/engagement/reviews/${reviewId}/report`,
    { reason },
  );
  return data.data;
}
