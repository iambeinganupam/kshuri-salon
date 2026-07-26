'use client';
// ─────────────────────────────────────────────────────────────────────────────
// NotificationBell — bell icon with unread badge + dropdown popover.
// ─────────────────────────────────────────────────────────────────────────────

import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useUnreadCount } from '@kshuri/api-client';
import type { NotificationDto } from '@kshuri/api-client';
import { Popover, PopoverTrigger, PopoverContent } from '../components/popover';
import { NotificationList } from './NotificationList';

interface Props {
  onItemClick?: (n: NotificationDto) => void;
}

export function NotificationBell({ onItemClick }: Props) {
  const [open, setOpen] = useState(false);
  const { data } = useUnreadCount();
  const count = data ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b px-3 py-2 font-medium">Notifications</div>
        <NotificationList
          onItemClick={(n) => {
            setOpen(false);
            onItemClick?.(n);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
