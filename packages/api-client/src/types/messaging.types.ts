// ─────────────────────────────────────────────────────────────────────────────
// Messaging Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

export interface MessageDto {
  id: string;
  thread_id: string;
  sender_id: string;
  seq: number;
  body: string;
  media_id: string | null;
  read_by_recipient_at: string | null;
  created_at: string;
}

export interface ThreadDto {
  id: string;
  customer_id: string;
  vendor_type: 'freelancer' | 'salon_location';
  vendor_id: string;
  vendor_user_id: string;
  appointment_id: string | null;
  last_message_at: string | null;
  last_message_seq: number;
  created_at: string;
}

export interface ThreadSummaryDto {
  id: string;
  peer_id: string;
  peer_name: string;
  peer_avatar_url?: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
}

export interface ThreadDetailDto {
  thread: ThreadDto;
  messages: MessageDto[]; // last N, ascending by seq
}

export interface OpenThreadPayload {
  vendor_type: 'freelancer' | 'salon_location';
  vendor_id: string;
  appointment_id?: string;
}

export interface SendMessagePayload {
  body: string;
  media_id?: string;
}
