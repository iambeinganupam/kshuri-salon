// ─────────────────────────────────────────────────────────────────────────────
// Notifications Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  NotificationDto,
  NotificationListPage,
  NotificationPreferencesDto,
} from '../types/notification.types';

interface ListQuery {
  cursor?: string;
  limit?: number;
  unread?: boolean;
}

/** GET /notifications */
export async function listNotificationPage(
  client: AxiosInstance,
  q: ListQuery = {},
): Promise<NotificationListPage> {
  const { data } = await client.get<{
    success: true;
    data: NotificationDto[];
    meta: { next_cursor: string | null };
  }>('/notifications', { params: q });
  return { data: data.data, meta: data.meta };
}

/** GET /notifications/unread-count */
export async function unreadCount(client: AxiosInstance): Promise<number> {
  const { data } = await client.get<{ success: true; data: { count: number } }>(
    '/notifications/unread-count',
  );
  return data.data.count;
}

/** PATCH /notifications/read */
export async function markRead(
  client: AxiosInstance,
  payload: { ids: string[] } | { all: true },
): Promise<number> {
  const { data } = await client.patch<{ success: true; data: { marked: number } }>(
    '/notifications/read',
    payload,
  );
  return data.data.marked;
}

/** GET /notifications/preferences */
export async function getPreferences(
  client: AxiosInstance,
): Promise<NotificationPreferencesDto> {
  const { data } = await client.get<{ success: true; data: NotificationPreferencesDto }>(
    '/notifications/preferences',
  );
  return data.data;
}

/** PUT /notifications/preferences */
export async function updatePreferences(
  client: AxiosInstance,
  patch: Partial<NotificationPreferencesDto>,
): Promise<NotificationPreferencesDto> {
  const { data } = await client.put<{ success: true; data: NotificationPreferencesDto }>(
    '/notifications/preferences',
    patch,
  );
  return data.data;
}
