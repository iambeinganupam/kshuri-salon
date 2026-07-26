// ─────────────────────────────────────────────────────────────────────────────
// Notifications Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as notificationsService from '../services/notifications.service';
import type { NotificationPreferencesDto } from '../types/notification.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (q: { unread?: boolean }) => [...notificationKeys.all, 'list', q] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** GET /notifications — paginated list (cursor-based) */
export function useNotificationList(query: { unread?: boolean; limit?: number } = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => notificationsService.listNotificationPage(client, query),
  });
}

/** GET /notifications/unread-count — polled every 30s */
export function useUnreadCount() {
  const client = useApiClient();
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.unreadCount(client),
    refetchInterval: 30_000,
  });
}

/** GET /notifications/preferences */
export function useNotificationPreferences() {
  const client = useApiClient();
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationsService.getPreferences(client),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** PATCH /notifications/read — mark one, many, or all as read */
export function useMarkRead() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { ids: string[] } | { all: true }) =>
      notificationsService.markRead(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/** PUT /notifications/preferences */
export function useUpdateNotificationPreferences() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPreferencesDto>) =>
      notificationsService.updatePreferences(client, patch),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationKeys.preferences(), data);
    },
  });
}
