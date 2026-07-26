// ─────────────────────────────────────────────────────────────────────────────
// Assignments Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// HTTP layer for /api/v1/assignments. Pure Axios calls; React Query bindings
// live in hooks/useAssignments.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  Assignment,
  AssignmentActionPayload,
  CreateAssignmentPayload,
  ListAssignmentsParams,
} from '../types/assignment.types';

export async function listAssignments(
  client: AxiosInstance,
  params: ListAssignmentsParams = {},
): Promise<Assignment[]> {
  const { data } = await client.get<{ success: true; data: Assignment[] }>(
    '/assignments',
    { params },
  );
  return data.data;
}

export async function getAssignment(
  client: AxiosInstance,
  id: string,
): Promise<Assignment> {
  const { data } = await client.get<{ success: true; data: Assignment }>(
    `/assignments/${id}`,
  );
  return data.data;
}

export async function createAssignment(
  client: AxiosInstance,
  payload: CreateAssignmentPayload,
): Promise<Assignment> {
  const { data } = await client.post<{ success: true; data: Assignment }>(
    '/assignments',
    payload,
  );
  return data.data;
}

export async function applyAssignmentAction(
  client: AxiosInstance,
  id: string,
  payload: AssignmentActionPayload,
): Promise<Assignment> {
  const { data } = await client.post<{ success: true; data: Assignment }>(
    `/assignments/${id}/action`,
    payload,
  );
  return data.data;
}
