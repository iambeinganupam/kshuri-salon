// ─────────────────────────────────────────────────────────────────────────────
// Events Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as eventsService from '../services/events.service';
import type { CreateEventPayload, EventBooking } from '../types/events.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const eventsKeys = {
  all: ['events'] as const,
  list: () => [...eventsKeys.all, 'list'] as const,
  event: (id: string) => [...eventsKeys.all, 'event', id] as const,
  attendees: (eventId: string) => [...eventsKeys.all, 'attendees', eventId] as const,
  budget: (eventId: string) => [...eventsKeys.all, 'budget', eventId] as const,
  templates: () => [...eventsKeys.all, 'templates'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** List events */
export function useEventList() {
  const client = useApiClient();
  return useQuery({
    queryKey: eventsKeys.list(),
    queryFn: () => eventsService.listEvents(client),
  });
}

/** Get a single event */
export function useEvent(eventId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: eventsKeys.event(eventId),
    queryFn: () => eventsService.getEvent(client, eventId),
    enabled: !!eventId,
  });
}

/** Get event attendees */
export function useEventAttendees(eventId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: eventsKeys.attendees(eventId),
    queryFn: () => eventsService.getEventAttendees(client, eventId),
    enabled: !!eventId,
  });
}

/** Get event budget */
export function useEventBudget(eventId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: eventsKeys.budget(eventId),
    queryFn: () => eventsService.getEventBudget(client, eventId),
    enabled: !!eventId,
  });
}

/** List event templates */
export function useEventTemplates() {
  const client = useApiClient();
  return useQuery({
    queryKey: eventsKeys.templates(),
    queryFn: () => eventsService.listEventTemplates(client),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create an event */
export function useCreateEvent() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) =>
      eventsService.createEvent(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
    },
  });
}

/** Assign vendors to attendees */
export function useAssignVendors() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, assignments }: {
      eventId: string;
      assignments: Array<{ attendee_id: string; vendor_id: string; vendor_type: string }>;
    }) => eventsService.assignVendors(client, eventId, assignments),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: eventsKeys.attendees(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: eventsKeys.budget(variables.eventId),
      });
    },
  });
}

/** Update event status */
export function useUpdateEventStatus() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: {
      eventId: string;
      status: EventBooking['status'];
    }) => eventsService.updateEventStatus(client, eventId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.event(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
    },
  });
}
