'use client';
// ─────────────────────────────────────────────────────────────────────────────
// NotificationItem — single notification row with type icon, title, body,
// timestamp, and unread dot.
// ─────────────────────────────────────────────────────────────────────────────

import type { NotificationDto } from '@kshuri/api-client';

interface Props {
  notification: NotificationDto;
  onClick?: () => void;
}

const TYPE_ICON: Record<string, string> = {
  new_booking:              '📅',
  booking_confirmed:        '📅',
  booking_cancelled:        '❌',
  booking_completed:        '✅',
  review_received:          '⭐',
  payment_received:         '💰',
  payout_processed:         '🏦',
  kyc_submitted:            '📄',
  kyc_approved:             '✅',
  kyc_rejected:             '⚠️',
  kyc_resubmit_requested:   '🔁',
  message_received:         '💬',
  plan_activated:           '🎉',
  plan_expired:             '⏰',
  promotional:              '🎁',
  system:                   'ℹ️',
};

export function NotificationItem({ notification, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors flex gap-3 ${notification.is_read ? '' : 'bg-accent/30'}`}
    >
      <span className="text-xl shrink-0">{TYPE_ICON[notification.type] ?? '🔔'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{notification.title}</p>
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(notification.created_at).toLocaleString()}
        </p>
      </div>
    </button>
  );
}
