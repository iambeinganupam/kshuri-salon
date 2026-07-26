// ─────────────────────────────────────────────────────────────────────────────
// Messaging — @kshuri/api-client
// Flat re-export of messaging types, service functions, and hooks.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  MessageDto,
  ThreadDto,
  ThreadSummaryDto,
  ThreadDetailDto,
  OpenThreadPayload,
  SendMessagePayload,
} from './types/messaging.types';

export {
  openThread,
  listThreads,
  getThread,
  sendMessage,
  pollSince,
  markRead as markThreadRead,
  unreadCount as unreadMessagesCount,
} from './services/messaging.service';

export * from './hooks/useMessaging';
