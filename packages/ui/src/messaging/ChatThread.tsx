'use client';
import { useEffect, useRef } from 'react';
import { useThread, useThreadLongPoll, useMarkThreadRead } from '@kshuri/api-client';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

interface Props {
  threadId: string;
  currentUserId: string;
}

export function ChatThread({ threadId, currentUserId }: Props) {
  const { data, isLoading } = useThread(threadId);
  const markRead = useMarkThreadRead();
  useThreadLongPoll(threadId, !!threadId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [data?.messages?.length]);

  // Mark read up to last seq seen
  useEffect(() => {
    if (data?.messages && data.messages.length > 0) {
      const lastSeq = data.messages[data.messages.length - 1].seq;
      // Only mark read if there are messages from the other party that aren't yet read
      const hasUnreadFromOther = data.messages.some((m) => m.sender_id !== currentUserId && !m.read_by_recipient_at);
      if (hasUnreadFromOther) markRead.mutate({ threadId, uptoSeq: lastSeq });
    }
  }, [data?.messages?.length, currentUserId, markRead, threadId]);

  if (isLoading) return <p className="p-4 text-sm text-muted-foreground">Loading thread…</p>;
  if (!data) return <p className="p-4 text-sm text-muted-foreground">Thread not found.</p>;

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        {data.messages.map((m) => (
          <MessageBubble key={m.id} message={m} isOwn={m.sender_id === currentUserId} />
        ))}
        {data.messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">Say hi 👋</p>
        )}
      </div>
      <MessageComposer threadId={threadId} />
    </div>
  );
}
