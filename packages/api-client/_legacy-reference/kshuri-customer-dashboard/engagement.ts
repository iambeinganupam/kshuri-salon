// ─────────────────────────────────────────────────────────────────────────────
// API Module: Engagement — salon-connect-hub (B2C Customer)
// Backend: /api/v1/engagement
// Covers: Reviews, Favorites, Notifications
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubmitReviewPayload {
  appointment_id: string;
  vendor_id: string;
  vendor_type: 'salon_location' | 'freelancer';
  rating: number;       // 1–5
  comment?: string;
}

export interface Review {
  id: string;
  appointment_id: string;
  vendor_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Favorite {
  id: string;
  vendor_id: string;
  vendor_type: 'salon_location' | 'freelancer';
  vendor_name: string;
  created_at: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Submit a review after a completed appointment
 */
export async function submitReview(payload: SubmitReviewPayload): Promise<Review> {
  const { data } = await apiClient.post<{ success: true; data: Review }>(
    '/engagement/reviews',
    payload,
  );
  return data.data;
}

/**
 * Add a vendor to favorites
 */
export async function addFavorite(
  vendorId: string,
  vendorType: 'salon_location' | 'freelancer',
): Promise<Favorite> {
  const { data } = await apiClient.post<{ success: true; data: Favorite }>(
    '/engagement/favorites',
    { vendor_id: vendorId, vendor_type: vendorType },
  );
  return data.data;
}

/**
 * Remove a vendor from favorites
 */
export async function removeFavorite(vendorId: string): Promise<void> {
  await apiClient.delete(`/engagement/favorites/${vendorId}`);
}

/**
 * Get list of favorites for current customer
 */
export async function listFavorites(): Promise<Favorite[]> {
  const { data } = await apiClient.get<{ success: true; data: Favorite[] }>(
    '/engagement/favorites',
  );
  return data.data;
}

/**
 * Get all notifications for current user (paginated)
 */
export async function listNotifications(params?: {
  unread_only?: boolean;
  limit?: number;
  cursor?: string;
}): Promise<{ items: Notification[]; unread_count: number }> {
  const { data } = await apiClient.get<{
    success: true;
    data: Notification[];
    meta: { unread_count: number };
  }>('/engagement/notifications', { params });
  return { items: data.data, unread_count: data.meta?.unread_count ?? 0 };
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/engagement/notifications/${notificationId}/read`);
}

/**
 * Mark ALL notifications as read
 */
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/engagement/notifications/read-all');
}
