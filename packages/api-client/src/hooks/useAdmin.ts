// ─────────────────────────────────────────────────────────────────────────────
// Admin Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as adminService from '../services/admin.service';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ['admin'] as const,
  platformKPIs: () => [...adminKeys.all, 'platform-kpis'] as const,
  kycApplications: (status?: string) =>
    [...adminKeys.all, 'kyc', status ?? 'all'] as const,
  platformUsers: (params?: Record<string, unknown>) =>
    [...adminKeys.all, 'users', params ?? {}] as const,
  categories: () => [...adminKeys.all, 'categories'] as const,
  settings: () => [...adminKeys.all, 'settings'] as const,
  subscriptionPlans: () => [...adminKeys.all, 'subscription-plans'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** Platform-wide KPIs */
export function usePlatformKPIs() {
  const client = useApiClient();
  return useQuery({
    queryKey: adminKeys.platformKPIs(),
    queryFn: () => adminService.getPlatformKPIs(client),
  });
}

/** List KYC applications */
export function useKycApplications(status?: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: adminKeys.kycApplications(status),
    queryFn: () => adminService.listKycApplications(client, status ? { status } : undefined),
  });
}

/** List platform users */
export function usePlatformUsers(params?: { role?: string; limit?: number }) {
  const client = useApiClient();
  return useQuery({
    queryKey: adminKeys.platformUsers(params),
    queryFn: () => adminService.listPlatformUsers(client, params),
  });
}

/** List categories (Admin management) */
export function useAdminCategories() {
  const client = useApiClient();
  return useQuery({
    queryKey: adminKeys.categories(),
    queryFn: () => adminService.listCategories(client),
  });
}

// ── Queries (additional) ─────────────────────────────────────────────────────

/** Platform-level settings */
export function usePlatformSettings() {
  const client = useApiClient();
  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: () => client.get('/admin/settings').then((r) => r.data),
  });
}

/** Available subscription plans */
export function useSubscriptionPlans() {
  const client = useApiClient();
  return useQuery({
    queryKey: adminKeys.subscriptionPlans(),
    queryFn: () => client.get('/admin/subscription-plans').then((r) => r.data),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Approve KYC — accepts { id, notes? } for UI consistency */
export function useApproveKyc() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idOrPayload: string | { id: string; notes?: string }) => {
      const id = typeof idOrPayload === 'string' ? idOrPayload : idOrPayload.id;
      const notes = typeof idOrPayload === 'object' ? idOrPayload.notes : undefined;
      return adminService.approveKyc(client, id, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.kycApplications() });
      queryClient.invalidateQueries({ queryKey: adminKeys.platformKPIs() });
    },
  });
}

/** Reject KYC — accepts { id, reason } for UI consistency */
export function useRejectKyc() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, notes }: { id: string; reason?: string; notes?: string }) =>
      adminService.rejectKyc(client, id, reason ?? notes ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.kycApplications() });
    },
  });
}

/** Toggle user status — accepts { userId, status: 'active'|'suspended'|'banned' } */
export function useToggleUserStatus() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status, isActive }: { userId: string; status?: string; isActive?: boolean }) =>
      adminService.toggleUserStatus(client, userId, status !== undefined ? status !== 'banned' && status !== 'suspended' : isActive ?? true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.platformUsers() });
    },
  });
}

/** Create a new category */
export function useCreateCategory() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; parent_id?: string }) =>
      adminService.createCategory(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
  });
}

