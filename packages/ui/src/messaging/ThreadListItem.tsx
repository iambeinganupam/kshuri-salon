'use client';
import type { ThreadSummaryDto } from '@kshuri/api-client';

interface Props {
  thread: ThreadSummaryDto;
  active?: boolean;
  onClick: () => void;
}

export function ThreadListItem({ thread, active, onClick }: Props) {
  const initials = thread.peer_name?.split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase() ?? '?';
  const when = thread.last_message_at ? new Date(thread.last_message_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 flex gap-3 hover:bg-accent transition-colors ${active ? 'bg-accent' : ''}`}
    >
      {thread.peer_avatar_url
        ? <img src={thread.peer_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        : <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium">{initials}</div>}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <p className="font-medium truncate">{thread.peer_name}</p>
          <span className="text-xs text-muted-foreground shrink-0">{when}</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className="text-sm text-muted-foreground truncate">{thread.last_message_preview ?? 'No messages yet.'}</p>
          {thread.unread_count > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shrink-0">
              {thread.unread_count > 9 ? '9+' : thread.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
