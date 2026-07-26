// ─────────────────────────────────────────────────────────────────────────────
// API Module: Engagement — kshuri-salon-dashboard (B2B Vendor)
// Backend: /api/v1/engagement
// Covers: Notifications for vendors
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

export interface Notification {
  id: string;
  type: 'new_booking' | 'booking_cancelled' | 'review_received' | 'payout_processed' | 'system';
  title: string;
  body: string;
  is_read: boolean;
  metadata?: {
    appointment_id?: string;
    customer_name?: string;
    amount?: number;
  };
  created_at: string;
}

/** Get all notifications for the authenticated vendor */
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

/** Mark a single notification as read */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/engagement/notifications/${notificationId}/read`);
}

/** Mark all notifications as read */
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/engagement/notifications/read-all');
}
