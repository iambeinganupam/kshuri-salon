'use client';
// ─────────────────────────────────────────────────────────────────────────────
// NotificationList — scrollable list with mark-all-read and cursor pagination.
// ─────────────────────────────────────────────────────────────────────────────

import { useNotificationList, useMarkRead } from '@kshuri/api-client';
import type { NotificationDto } from '@kshuri/api-client';
import { Button } from '../components/button';
import { NotificationItem } from './NotificationItem';

interface Props {
  unreadOnly?: boolean;
  onItemClick?: (n: NotificationDto) => void;
}

export function NotificationList({ unreadOnly, onItemClick }: Props) {
  const { data, isLoading } = useNotificationList(
    unreadOnly ? { unread: true } : {},
  );
  const markRead = useMarkRead();

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading…</p>;
  }

  const items = data?.data ?? [];

  if (items.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No notifications</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-end p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markRead.mutate({ all: true })}
          disabled={markRead.isPending}
        >
          Mark all read
        </Button>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y">
        {items.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onClick={() => {
              if (!n.is_read) markRead.mutate({ ids: [n.id] });
              onItemClick?.(n);
            }}
          />
        ))}
      </div>
    </div>
  );
}
