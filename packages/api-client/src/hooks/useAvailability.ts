// ─────────────────────────────────────────────────────────────────────────────
// Availability Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as availabilityService from '../services/availability.service';
import type {
  GetSlotsParams,
  WorkingHoursEntry,
  ShiftEntry,
  CreateTimeBlockPayload,
} from '../types/availability.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const availabilityKeys = {
  all: ['availability'] as const,
  slots: (params: GetSlotsParams) => [...availabilityKeys.all, 'slots', params] as const,
  workingHours: () => [...availabilityKeys.all, 'working-hours'] as const,
  calendar: (start: string, end: string) =>
    [...availabilityKeys.all, 'calendar', start, end] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** Get available time slots for a vendor */
export function useAvailableSlots(params: GetSlotsParams, enabled = true) {
  const client = useApiClient();
  return useQuery({
    queryKey: availabilityKeys.slots(params),
    queryFn: () => availabilityService.getAvailableSlots(client, params),
    enabled,
  });
}

/** Get working hours for current vendor */
export function useWorkingHours() {
  const client = useApiClient();
  return useQuery({
    queryKey: availabilityKeys.workingHours(),
    queryFn: () => availabilityService.getWorkingHours(client),
  });
}

/** Get calendar events for date range */
export function useCalendar(startDate: string, endDate: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: availabilityKeys.calendar(startDate, endDate),
    queryFn: () =>
      availabilityService.getCalendar(client, {
        start_date: startDate,
        end_date: endDate,
      }),
    enabled: !!startDate && !!endDate,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Update working hours */
export function useUpdateWorkingHours() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hours: WorkingHoursEntry[]) =>
      availabilityService.updateWorkingHours(client, hours),
    onSuccess: (data) => {
      queryClient.setQueryData(availabilityKeys.workingHours(), data);
    },
  });
}

/** Create a time block */
export function useCreateTimeBlock() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTimeBlockPayload) =>
      availabilityService.createTimeBlock(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}

/** Delete a time block */
export function useDeleteTimeBlock() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) =>
      availabilityService.deleteTimeBlock(client, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}

/** Batch-assign shifts (Manager only) */
export function useBatchAssignShifts() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shifts: ShiftEntry[]) =>
      availabilityService.batchAssignShifts(client, shifts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}

/** Approve/reject a shift */
export function useUpdateShift() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, isApproved }: { shiftId: string; isApproved: boolean }) =>
      availabilityService.updateShift(client, shiftId, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}
