// ─────────────────────────────────────────────────────────────────────────────
// NotificationsPage — kshuri-salon-dashboard
// ─────────────────────────────────────────────────────────────────────────────
// Read-only feed of received notifications, mirroring the freelancer
// dashboard's /notifications page. Notification *preferences* (the
// in-app/push/email/SMS toggles) live separately at /settings/notifications.
//
// Data flow:
//   useNotifications()          → poll-based notifications list
//   useMarkNotificationRead()   → mark a single notification read
//   useMarkAllNotificationsRead → bulk mark-all
//
// The presentational UI is the shared <NotificationsFeed/> from @kshuri/ui
// so salon + freelancer stay in lockstep visually.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { toast } from "sonner";
import {
  NotificationsFeed,
  type NotificationFeedItem,
  type NotificationFeedType,
} from "@kshuri/ui";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@kshuri/api-client";

// Map backend notification types onto the small UI palette the shared
// feed component knows about. Anything unrecognised falls back to "system"
// so a future backend type doesn't crash the page.
const TYPE_MAP: Record<string, NotificationFeedType> = {
  new_booking: "booking",
  booking_cancelled: "booking",
  booking_confirmed: "booking",
  booking_completed: "booking",
  booking_reminder: "reminder",
  payout_processed: "payment",
  payment_received: "payment",
  review_received: "review",
  kyc_approved: "system",
  kyc_rejected: "alert",
  system: "system",
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // The hook returns either an array (fallback) or { items, unread_count }.
  // Normalise both shapes — same defensive read the freelancer adapter uses.
  const items = useMemo<NotificationFeedItem[]>(() => {
    if (!data) return [];
    const raw = Array.isArray(data) ? data : (data.items ?? []);
    return raw.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.body,
      time: relativeTime(n.created_at),
      read: n.is_read,
      type: TYPE_MAP[n.type] ?? "system",
    }));
  }, [data]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  const handleMarkRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
    } catch {
      // Cache invalidation already reflects optimistic state; swallow the
      // toast so a transient network hiccup doesn't spam the user.
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Couldn't mark all as read", {
        description: (e as Error).message,
      });
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 max-w-3xl">
      <NotificationsFeed
        items={items}
        unreadCount={unreadCount}
        isLoading={isLoading}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
}
