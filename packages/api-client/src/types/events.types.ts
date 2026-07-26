// ─────────────────────────────────────────────────────────────────────────────
// Events Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { VendorType } from './common.types';

/** Event booking (group appointment, e.g., bridal party) */
export interface EventBooking {
  id: string;
  event_name: string;
  event_date: string;
  organizer_id: string;
  organizer_name?: string;
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  total_budget?: number;
  attendee_count: number;
  created_at: string;
}

/** Attendee within an event booking */
export interface EventAttendee {
  id: string;
  event_id: string;
  guest_name: string;
  requested_service_id: string;
  preferred_vendor_id?: string;
  assigned_vendor_id?: string;
  vendor_type?: VendorType;
  status: 'pending' | 'assigned' | 'confirmed' | 'completed';
}

/** Payload for POST /events */
export interface CreateEventPayload {
  event_name: string;
  event_date: string;
  attendees: Array<{
    guest_name: string;
    requested_service_id: string;
    preferred_vendor_id?: string;
  }>;
}

/** Event budget breakdown */
export interface EventBudget {
  estimated_total: number;
  confirmed_total: number;
  paid_total: number;
  breakdown: Array<{
    attendee_name: string;
    service_name: string;
    vendor_name?: string;
    price: number;
    status: 'estimated' | 'confirmed' | 'paid';
  }>;
}

/** Event template for reuse */
export interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  default_services: Array<{
    service_id: string;
    service_name: string;
    default_vendor_id?: string;
  }>;
}
