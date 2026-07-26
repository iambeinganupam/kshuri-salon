'use client';
import type { MessageDto } from '@kshuri/api-client';

interface Props {
  message: MessageDto;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  const ts = new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {ts}
          {isOwn && message.read_by_recipient_at && <span className="ml-1">· ✓ Read</span>}
        </p>
      </div>
    </div>
  );
}
