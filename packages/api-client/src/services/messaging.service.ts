// ─────────────────────────────────────────────────────────────────────────────
// Messaging Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  ThreadDto,
  ThreadSummaryDto,
  ThreadDetailDto,
  MessageDto,
  OpenThreadPayload,
  SendMessagePayload,
} from '../types/messaging.types';

/** POST /messages/threads */
export async function openThread(
  client: AxiosInstance,
  payload: OpenThreadPayload,
): Promise<ThreadDto> {
  const { data } = await client.post<{ success: true; data: ThreadDto }>(
    '/messages/threads',
    payload,
  );
  return data.data;
}

/** GET /messages/threads */
export async function listThreads(client: AxiosInstance): Promise<ThreadSummaryDto[]> {
  const { data } = await client.get<{ success: true; data: ThreadSummaryDto[] }>(
    '/messages/threads',
  );
  return data.data;
}

/** GET /messages/threads/:id */
export async function getThread(
  client: AxiosInstance,
  threadId: string,
): Promise<ThreadDetailDto> {
  const { data } = await client.get<{ success: true; data: ThreadDetailDto }>(
    `/messages/threads/${threadId}`,
  );
  return data.data;
}

/** POST /messages/threads/:id/messages */
export async function sendMessage(
  client: AxiosInstance,
  threadId: string,
  payload: SendMessagePayload,
): Promise<MessageDto> {
  const { data } = await client.post<{ success: true; data: MessageDto }>(
    `/messages/threads/${threadId}/messages`,
    payload,
  );
  return data.data;
}

/** GET /messages/threads/:id/poll?since=<seq> */
export async function pollSince(
  client: AxiosInstance,
  threadId: string,
  sinceSeq: number,
  options?: { signal?: AbortSignal },
): Promise<MessageDto[]> {
  const { data } = await client.get<{ success: true; data: MessageDto[] | null }>(
    `/messages/threads/${threadId}/poll`,
    { params: { since: sinceSeq }, signal: options?.signal },
  );
  return data.data ?? [];
}

/** PATCH /messages/threads/:id/read */
export async function markRead(
  client: AxiosInstance,
  threadId: string,
  uptoSeq: number,
): Promise<{ marked: number }> {
  const { data } = await client.patch<{ success: true; data: { marked: number } }>(
    `/messages/threads/${threadId}/read`,
    { upto_seq: uptoSeq },
  );
  return data.data;
}

/** GET /messages/unread-count */
export async function unreadCount(client: AxiosInstance): Promise<number> {
  const { data } = await client.get<{ success: true; data: { count: number } }>(
    '/messages/unread-count',
  );
  return data.data.count;
}
