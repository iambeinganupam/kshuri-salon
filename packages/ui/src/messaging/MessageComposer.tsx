'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { useSendMessage } from '@kshuri/api-client';

interface Props { threadId: string; disabled?: boolean }

export function MessageComposer({ threadId, disabled }: Props) {
  const [body, setBody] = useState('');
  const send = useSendMessage(threadId);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed || disabled) return;
    setBody('');   // optimistic clear
    try {
      await send.mutateAsync({ body: trimmed });
    } catch (err) {
      // restore body on error
      setBody(trimmed);
    }
  }

  return (
    <div className="flex gap-2 p-3 border-t bg-background">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder={disabled ? 'You can\'t message in this thread' : 'Type a message…'}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled || !body.trim() || send.isPending}
        className="px-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
        aria-label="Send"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
