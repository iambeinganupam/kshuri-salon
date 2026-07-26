// ─────────────────────────────────────────────────────────────────────────────
// Admin Categories Hooks — @kshuri/api-client
//
// React Query hooks for the super_admin taxonomy governance surface. All
// queries + mutations share the `adminCategoriesKeys.all` root for trivial
// blanket-invalidation on writes.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as adminCategoriesService from '../services/admin-categories.service';
import type {
  AdminCategoryListQuery,
  AdminCategoryCreatePayload,
  AdminCategoryUpdatePayload,
  AdminCategoryReorderPayload,
} from '../types/admin-categories.types';

// ── Query Keys ──────────────────────────────────────────────────────────────

export const adminCategoriesKeys = {
  all: ['admin', 'categories'] as const,
  list: (q: AdminCategoryListQuery) => [...adminCategoriesKeys.all, 'list', q] as const,
  tree: (q: AdminCategoryListQuery) => [...adminCategoriesKeys.all, 'tree', q] as const,
  detail: (id: string) => [...adminCategoriesKeys.all, 'detail', id] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

export function useAdminCategories(query: AdminCategoryListQuery = {}, enabled = true) {
  const client = useApiClient();
  return useQuery({
    queryKey: adminCategoriesKeys.list(query),
    queryFn: () => adminCategoriesService.listAdminCategories(client, query),
    enabled,
    staleTime: 60_000,
  });
}

export function useAdminCategoryTree(query: AdminCategoryListQuery = {}, enabled = true) {
  const client = useApiClient();
  return useQuery({
    queryKey: adminCategoriesKeys.tree(query),
    queryFn: () => adminCategoriesService.getAdminCategoryTree(client, query),
    enabled,
    staleTime: 60_000,
  });
}

export function useAdminCategory(id: string | null | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: adminCategoriesKeys.detail(id ?? ''),
    queryFn: () => adminCategoriesService.getAdminCategory(client, id as string),
    enabled: !!id,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────────

export function useCreateAdminCategory() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminCategoryCreatePayload) =>
      adminCategoriesService.createAdminCategory(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.all });
      // The customer + vendor caches also depend on the global taxonomy.
      queryClient.invalidateQueries({ queryKey: ['discover', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'vendor-categories'] });
    },
  });
}

export function useUpdateAdminCategory() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminCategoryUpdatePayload }) =>
      adminCategoriesService.updateAdminCategory(client, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: ['discover', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'vendor-categories'] });
    },
  });
}

export function useDeleteAdminCategory() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      adminCategoriesService.deleteAdminCategory(client, id, { force }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: ['discover', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'vendor-categories'] });
    },
  });
}

/** Promote a vendor-scoped custom row to global. */
export function usePromoteAdminCategory() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminCategoriesService.promoteAdminCategory(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: ['discover', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'vendor-categories'] });
    },
  });
}

export function useReorderAdminCategories() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminCategoryReorderPayload) =>
      adminCategoriesService.reorderAdminCategories(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: ['discover', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'vendor-categories'] });
    },
  });
}
