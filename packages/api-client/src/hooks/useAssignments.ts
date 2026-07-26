// ─────────────────────────────────────────────────────────────────────────────
// Assignments Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Tanstack Query wrappers around assignments.service. Every mutation
// invalidates the list + detail cache so both salon and freelancer dashboards
// re-fetch promptly after an action.
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as assignmentsService from '../services/assignments.service';
import type {
  Assignment,
  AssignmentActionPayload,
  CreateAssignmentPayload,
  ListAssignmentsParams,
} from '../types/assignment.types';

// ── Query Keys ───────────────────────────────────────────────────────────────

export const assignmentsKeys = {
  all: ['assignments'] as const,
  list: (params: ListAssignmentsParams = {}) =>
    [...assignmentsKeys.all, 'list', params] as const,
  detail: (id: string) => [...assignmentsKeys.all, 'detail', id] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

export function useAssignments(params: ListAssignmentsParams = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: assignmentsKeys.list(params),
    queryFn: () => assignmentsService.listAssignments(client, params),
  });
}

export function useAssignment(id: string | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: id ? assignmentsKeys.detail(id) : assignmentsKeys.all,
    queryFn: () => assignmentsService.getAssignment(client, id as string),
    enabled: !!id,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useCreateAssignment() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) =>
      assignmentsService.createAssignment(client, payload),
    onSuccess: (data: Assignment) => {
      queryClient.setQueryData(assignmentsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.all });
    },
  });
}

export function useAssignmentAction() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: AssignmentActionPayload & { id: string }) =>
      assignmentsService.applyAssignmentAction(client, id, payload),
    onSuccess: (data: Assignment) => {
      queryClient.setQueryData(assignmentsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.all });
    },
  });
}
