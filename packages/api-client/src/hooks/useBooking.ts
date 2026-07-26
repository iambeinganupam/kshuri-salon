// ─────────────────────────────────────────────────────────────────────────────
// Booking Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as bookingService from '../services/booking.service';
import type {
  CreateIntentPayload,
  ListAppointmentsParams,
  AppointmentAction,
  WalkInPayload,
} from '../types/booking.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const bookingKeys = {
  all: ['booking'] as const,
  /** Prefix for any appointments-list query (use for invalidation). */
  appointmentsRoot: () => [...bookingKeys.all, 'appointments'] as const,
  appointments: (params?: ListAppointmentsParams) =>
    [...bookingKeys.all, 'appointments', params ?? {}] as const,
  appointment: (id: string) => [...bookingKeys.all, 'appointment', id] as const,
  intents: () => [...bookingKeys.all, 'intents'] as const,
  intent: (id: string) => [...bookingKeys.all, 'intent', id] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** List appointments (paginated) */
export function useAppointments(params?: ListAppointmentsParams) {
  const client = useApiClient();
  return useQuery({
    queryKey: bookingKeys.appointments(params),
    queryFn: () => bookingService.listAppointments(client, params),
  });
}

/** Get a single appointment by ID */
export function useAppointment(appointmentId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: bookingKeys.appointment(appointmentId),
    queryFn: () => bookingService.getAppointment(client, appointmentId),
    enabled: !!appointmentId,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create a booking intent (slot lock) */
export function useCreateIntent() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (payload: CreateIntentPayload) =>
      bookingService.createBookingIntent(client, payload),
  });
}

/** Lock intent (confirm services) */
export function useLockIntent() {
  const client = useApiClient();
  return useMutation({
    mutationFn: ({ intentId, serviceIds }: { intentId: string; serviceIds: string[] }) =>
      bookingService.lockBookingIntent(client, intentId, serviceIds),
  });
}

/**
 * Confirm booking (POST /booking/intents/:id/convert).
 *
 * Variables shape mirrors the wire payload:
 *   { intentId, payment_method?, customer_address_id? }
 *
 * payment_method is sent from the confirm step's PaymentMethodSelect;
 * customer_address_id is included whenever the cart has at least one
 * home-delivery service.
 */
export interface ConfirmBookingVariables {
  intentId: string;
  payment_method?: 'upi' | 'card' | 'cash' | 'online';
  customer_address_id?: string;
}

export function useConfirmBooking() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ intentId, ...payload }: ConfirmBookingVariables) =>
      bookingService.confirmBooking(client, intentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

/** Fetch a booking intent by id (rehydration / liveness check on confirm step). */
export function useBookingIntent(intentId: string | null | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: intentId ? bookingKeys.intent(intentId) : [...bookingKeys.all, 'intent', null],
    queryFn: () => bookingService.getBookingIntent(client, intentId as string),
    enabled: !!intentId,
    staleTime: 5_000,
    retry: false,
  });
}

/** Release a locked intent (free the slot immediately on user back-navigation). */
export function useReleaseIntent() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (intentId: string) => bookingService.releaseBookingIntent(client, intentId),
    onSuccess: (_data, intentId) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.intent(intentId) });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

/** Perform state-transition action on an appointment */
export function useAppointmentAction() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, action, extra }: {
      appointmentId: string;
      action: AppointmentAction;
      extra?: { cancellation_reason?: string; otp_code?: string };
    }) => bookingService.appointmentAction(client, appointmentId, action, extra),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.appointment(variables.appointmentId),
      });
      queryClient.invalidateQueries({ queryKey: bookingKeys.appointmentsRoot() });
    },
  });
}

/** Create a walk-in appointment (business_admin only) */
export function useCreateWalkIn() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WalkInPayload) => bookingService.createWalkIn(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

/** Reschedule an appointment */
export function useRescheduleAppointment() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, newSlotStart, newSlotEnd }: {
      appointmentId: string;
      newSlotStart: string;
      newSlotEnd: string;
    }) => bookingService.rescheduleAppointment(client, appointmentId, newSlotStart, newSlotEnd),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.appointment(variables.appointmentId),
      });
      queryClient.invalidateQueries({ queryKey: bookingKeys.appointmentsRoot() });
    },
  });
}
