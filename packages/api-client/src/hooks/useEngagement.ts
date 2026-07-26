// ─────────────────────────────────────────────────────────────────────────────
// Engagement Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as engagementService from '../services/engagement.service';
import type {
  SubmitReviewPayload,
  CreateReviewInput,
  ListReviewsParams,
  ReviewTargetKind,
} from '../types/engagement.types';
import type { VendorType } from '../types/common.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const engagementKeys = {
  all: ['engagement'] as const,
  favorites: () => [...engagementKeys.all, 'favorites'] as const,
  notifications: (params?: Record<string, unknown>) =>
    [...engagementKeys.all, 'notifications', params ?? {}] as const,
  ownReviews: (params: { vendor_type: VendorType; vendor_id: string; limit?: number }) =>
    [...engagementKeys.all, 'own-reviews', params] as const,
  skillEndorsement: (skillId: string) =>
    [...engagementKeys.all, 'skill-endorsement', skillId] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** List favorites */
export function useFavorites() {
  const client = useApiClient();
  return useQuery({
    queryKey: engagementKeys.favorites(),
    queryFn: () => engagementService.listFavorites(client),
  });
}

/** List notifications */
export function useNotifications(params?: { unread_only?: boolean; limit?: number }) {
  const client = useApiClient();
  return useQuery({
    queryKey: engagementKeys.notifications(params),
    queryFn: () => engagementService.listNotifications(client, params),
    refetchInterval: 30_000, // Poll for new notifications every 30s
  });
}

/** Vendor's own reviews + rating distribution. Caller must own `vendor_id`.
 *  Distinct from the discovery-side `useVendorReviews` which is public and
 *  drives customer-facing review browsing. */
export function useOwnVendorReviews(params: {
  vendor_type: VendorType;
  vendor_id: string;
  limit?: number;
}) {
  const client = useApiClient();
  return useQuery({
    queryKey: engagementKeys.ownReviews(params),
    queryFn: () => engagementService.listVendorReviews(client, params),
    enabled: !!params.vendor_id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Submit a review */
export function useSubmitReview() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (payload: SubmitReviewPayload) =>
      engagementService.submitReview(client, payload),
  });
}

/** Add favorite (with optimistic update) */
export function useAddFavorite() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, vendorType }: {
      vendorId: string;
      vendorType: 'salon_location' | 'freelancer';
    }) => engagementService.addFavorite(client, vendorId, vendorType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.favorites() });
    },
  });
}

/** Remove favorite (with optimistic update) */
export function useRemoveFavorite() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendorId: string) =>
      engagementService.removeFavorite(client, vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.favorites() });
    },
  });
}

/** Mark notification as read */
export function useMarkNotificationRead() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      engagementService.markNotificationRead(client, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.notifications() });
    },
  });
}

/** Mark all notifications as read */
export function useMarkAllNotificationsRead() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => engagementService.markAllNotificationsRead(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engagementKeys.notifications() });
    },
  });
}

// ── Skill Endorsements ──────────────────────────────────────────────────────

/** Whether the current viewer has endorsed a given skill, plus running count. */
export function useSkillEndorsementStatus(skillId: string, options?: { enabled?: boolean }) {
  const client = useApiClient();
  return useQuery({
    queryKey: engagementKeys.skillEndorsement(skillId),
    queryFn: () => engagementService.getSkillEndorsementStatus(client, skillId),
    enabled: (options?.enabled ?? true) && !!skillId,
  });
}

export function useEndorseSkill() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => engagementService.endorseSkill(client, skillId),
    onSuccess: (data) => {
      queryClient.setQueryData(engagementKeys.skillEndorsement(data.skill_id), {
        skill_id: data.skill_id,
        endorsed: true,
        endorsement_count: data.endorsement_count,
        is_owner: false,
      });
      queryClient.invalidateQueries({ queryKey: ['freelancer', 'skills'] });
    },
  });
}

export function useUnendorseSkill() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => engagementService.unendorseSkill(client, skillId),
    onSuccess: (data) => {
      queryClient.setQueryData(engagementKeys.skillEndorsement(data.skill_id), {
        skill_id: data.skill_id,
        endorsed: false,
        endorsement_count: data.endorsement_count,
        is_owner: false,
      });
      queryClient.invalidateQueries({ queryKey: ['freelancer', 'skills'] });
    },
  });
}

// ── R1 polymorphic reviews ──────────────────────────────────────────────────
// Sibling key namespace so existing v1 callers (engagementKeys.ownReviews
// etc.) keep working untouched. Invalidation predicates here match the prefix
// shape used by useCreateReview.

export const r1EngagementKeys = {
  reviews: (p: Pick<ListReviewsParams, 'target_kind' | 'target_id' | 'sort' | 'with_photos'>) =>
    [
      'engagement',
      'reviews',
      p.target_kind,
      p.target_id,
      p.sort ?? 'recent',
      p.with_photos ?? 'false',
    ] as const,
  aggregates: (kind: ReviewTargetKind, ids: string[]) =>
    ['engagement', 'review-aggregates', kind, ids.slice().sort().join(',')] as const,
};

/** Paginated review list for a single target. The cursor flows through
 *  useInfiniteQuery's pageParam. */
export function useReviewList(
  params: Omit<ListReviewsParams, 'cursor'>,
  enabled = true,
) {
  const client = useApiClient();
  return useInfiniteQuery({
    queryKey: r1EngagementKeys.reviews(params),
    queryFn: ({ pageParam }) =>
      engagementService.listReviews(client, {
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
  });
}

/** Bulk rating aggregate for an array of target_ids (e.g. service cards on a
 *  category landing page). */
export function useReviewAggregates(targetKind: ReviewTargetKind, targetIds: string[]) {
  const client = useApiClient();
  return useQuery({
    queryKey: r1EngagementKeys.aggregates(targetKind, targetIds),
    queryFn: () =>
      engagementService.reviewAggregates(client, {
        target_kind: targetKind,
        target_ids: targetIds.join(','),
      }),
    enabled: targetIds.length > 0,
    staleTime: 60_000,
  });
}

/** Create a review. Invalidates the list + aggregate caches for the
 *  (target_kind, target_id) pair. */
export function useCreateReview() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => engagementService.createReview(client, input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: ['engagement', 'reviews', input.target_kind, input.target_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['engagement', 'review-aggregates', input.target_kind],
      });
    },
  });
}

/** Toggle helpful vote. Returns the new count + vote state so callers can
 *  optimistically update the affected row without a global invalidation. */
export function useToggleReviewHelpful() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (reviewId: string) => engagementService.toggleReviewHelpful(client, reviewId),
  });
}

/** Report a review for moderation. */
export function useReportReview() {
  const client = useApiClient();
  return useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      engagementService.reportReview(client, reviewId, reason),
  });
}
