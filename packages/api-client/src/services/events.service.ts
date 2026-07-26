// ─────────────────────────────────────────────────────────────────────────────
// Events Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  EventBooking,
  EventAttendee,
  CreateEventPayload,
  EventBudget,
  EventTemplate,
} from '../types/events.types';

/** List events for the current user */
export async function listEvents(client: AxiosInstance): Promise<EventBooking[]> {
  const { data } = await client.get<{ success: true; data: EventBooking[] }>(
    '/events',
  );
  return data.data;
}

/** Get a single event by ID */
export async function getEvent(client: AxiosInstance, eventId: string): Promise<EventBooking> {
  const { data } = await client.get<{ success: true; data: EventBooking }>(
    `/events/${eventId}`,
  );
  return data.data;
}

/** Create a new event */
export async function createEvent(
  client: AxiosInstance,
  payload: CreateEventPayload,
): Promise<EventBooking> {
  const { data } = await client.post<{ success: true; data: EventBooking }>(
    '/events',
    payload,
  );
  return data.data;
}

/** Get event attendees */
export async function getEventAttendees(
  client: AxiosInstance,
  eventId: string,
): Promise<EventAttendee[]> {
  const { data } = await client.get<{ success: true; data: EventAttendee[] }>(
    `/events/${eventId}/attendees`,
  );
  return data.data;
}

/** Assign vendors to attendees */
export async function assignVendors(
  client: AxiosInstance,
  eventId: string,
  assignments: Array<{ attendee_id: string; vendor_id: string; vendor_type: string }>,
): Promise<EventAttendee[]> {
  const { data } = await client.post<{ success: true; data: EventAttendee[] }>(
    `/events/${eventId}/assign-vendors`,
    { assignments },
  );
  return data.data;
}

/** Get event budget breakdown */
export async function getEventBudget(
  client: AxiosInstance,
  eventId: string,
): Promise<EventBudget> {
  const { data } = await client.get<{ success: true; data: EventBudget }>(
    `/events/${eventId}/budget`,
  );
  return data.data;
}

/** List event templates */
export async function listEventTemplates(client: AxiosInstance): Promise<EventTemplate[]> {
  const { data } = await client.get<{ success: true; data: EventTemplate[] }>(
    '/events/templates',
  );
  return data.data;
}

/** Update event status */
export async function updateEventStatus(
  client: AxiosInstance,
  eventId: string,
  status: EventBooking['status'],
): Promise<EventBooking> {
  const { data } = await client.patch<{ success: true; data: EventBooking }>(
    `/events/${eventId}/status`,
    { status },
  );
  return data.data;
}
