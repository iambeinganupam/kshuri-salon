'use client';
import { useThreads } from '@kshuri/api-client';
import { ThreadListItem } from './ThreadListItem';

interface Props {
  selectedThreadId?: string;
  onSelect: (id: string) => void;
}

export function ThreadsList({ selectedThreadId, onSelect }: Props) {
  const { data, isLoading } = useThreads();
  if (isLoading) return <p className="p-4 text-sm text-muted-foreground">Loading…</p>;
  const threads = data ?? [];
  if (threads.length === 0) return <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>;

  return (
    <div className="divide-y border-r h-full overflow-y-auto">
      {threads.map((t) => (
        <ThreadListItem key={t.id} thread={t} active={selectedThreadId === t.id} onClick={() => onSelect(t.id)} />
      ))}
    </div>
  );
}
