// ─────────────────────────────────────────────────────────────────────────────
// Messaging Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useApiClient } from '../providers/ApiClientProvider';
import * as svc from '../services/messaging.service';
import type {
  OpenThreadPayload,
  SendMessagePayload,
  ThreadDetailDto,
} from '../types/messaging.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const messagingKeys = {
  all: ['messaging'] as const,
  threads: () => [...messagingKeys.all, 'threads'] as const,
  thread: (id: string) => [...messagingKeys.all, 'thread', id] as const,
  unreadCount: () => [...messagingKeys.all, 'unread-count'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** GET /messages/threads — list of thread summaries */
export function useThreads() {
  const client = useApiClient();
  return useQuery({
    queryKey: messagingKeys.threads(),
    queryFn: () => svc.listThreads(client),
  });
}

/** GET /messages/threads/:id — thread + last N messages */
export function useThread(threadId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: messagingKeys.thread(threadId),
    queryFn: () => svc.getThread(client, threadId),
    enabled: !!threadId,
  });
}

/** GET /messages/unread-count — polled every 30s */
export function useUnreadMessagesCount() {
  const client = useApiClient();
  return useQuery({
    queryKey: messagingKeys.unreadCount(),
    queryFn: () => svc.unreadCount(client),
    refetchInterval: 30_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** POST /messages/threads — open or retrieve a thread */
export function useOpenThread() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpenThreadPayload) => svc.openThread(client, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagingKeys.threads() });
    },
  });
}

/** POST /messages/threads/:id/messages — send a message */
export function useSendMessage(threadId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => svc.sendMessage(client, threadId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagingKeys.thread(threadId) });
      qc.invalidateQueries({ queryKey: messagingKeys.threads() });
    },
  });
}

/** PATCH /messages/threads/:id/read — mark messages read up to a seq */
export function useMarkThreadRead() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { threadId: string; uptoSeq: number }) =>
      svc.markRead(client, args.threadId, args.uptoSeq),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagingKeys.threads() });
      qc.invalidateQueries({ queryKey: messagingKeys.unreadCount() });
    },
  });
}

// ── Long-Poll Driver ──────────────────────────────────────────────────────────

/**
 * Drives a long-poll loop against GET /messages/threads/:id/poll.
 *
 * Behaviour:
 * - Starts as soon as `enabled` is true and `threadId` is non-empty.
 * - On each iteration it reads the highest `seq` from the React Query cache
 *   for that thread and uses it as the `since` parameter.
 * - New messages returned by the server are merged into the cached
 *   `ThreadDetailDto` and the threads list is invalidated so unread counts
 *   stay current.
 * - The server holds the connection open until new messages arrive or a
 *   timeout elapses (server-side); the loop then fires another request
 *   immediately, so there is no client-side sleep between iterations.
 * - On any network/server error the loop backs off for 2 s before retrying.
 * - The loop stops (and any in-flight request is aborted) when:
 *     • the component unmounts (cleanup runs), or
 *     • `enabled` becomes false, or
 *     • `threadId` changes (the effect restarts with the new id).
 */
export function useThreadLongPoll(threadId: string, enabled = true) {
  const client = useApiClient();
  const qc = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !threadId) return;
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        const cached = qc.getQueryData<ThreadDetailDto>(messagingKeys.thread(threadId));
        const sinceSeq =
          cached?.messages?.length
            ? Math.max(...cached.messages.map((m) => m.seq))
            : 0;

        try {
          abortRef.current?.abort();
          abortRef.current = new AbortController();

          const newMsgs = await svc.pollSince(client, threadId, sinceSeq, {
            signal: abortRef.current.signal,
          });

          if (cancelled) return;

          if (newMsgs.length > 0) {
            qc.setQueryData<ThreadDetailDto | undefined>(
              messagingKeys.thread(threadId),
              (prev) =>
                prev ? { ...prev, messages: [...prev.messages, ...newMsgs] } : prev,
            );
            qc.invalidateQueries({ queryKey: messagingKeys.threads() });
          }
        } catch (err) {
          if (
            (err as { name?: string })?.name === 'AbortError' ||
            (err as { code?: string })?.code === 'ERR_CANCELED'
          ) {
            return;
          }
          // brief backoff on unexpected errors to avoid hammering the server
          await new Promise<void>((r) => setTimeout(r, 2000));
        }
      }
    }

    loop();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [threadId, enabled, client, qc]);
}
