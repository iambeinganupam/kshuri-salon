// ─────────────────────────────────────────────────────────────────────────────
// Notification Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'review_received'
  | 'payment_received'
  | 'payout_processed'
  | 'promotional'
  | 'system'
  | 'kyc_submitted'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'kyc_resubmit_requested'
  | 'message_received'
  | 'plan_activated'
  | 'plan_expired';

export type DeliveryStatus = 'pending' | 'partial' | 'delivered' | 'failed' | 'skipped';

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';

export interface NotificationDto {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  dedupe_key: string | null;
  channels: NotificationChannel[];
  delivery_status: DeliveryStatus;
  created_at: string;
  updated_at: string;
}

export interface NotificationListPage {
  data: NotificationDto[];
  meta: { next_cursor: string | null };
}

export interface NotificationPreferencesDto {
  user_id: string;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  type_overrides: Record<NotificationType, Partial<Record<NotificationChannel, boolean>>>;
  updated_at: string;
}
