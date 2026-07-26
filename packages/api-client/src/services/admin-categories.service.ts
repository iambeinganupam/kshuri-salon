// ─────────────────────────────────────────────────────────────────────────────
// Admin Categories Service — @kshuri/api-client
//
// Thin axios wrappers for the super_admin taxonomy CRUD surface. All routes
// require an authenticated super_admin token; the ApiClientProvider attaches
// it automatically.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  AdminCategoryRow,
  AdminCategoryTreeNode,
  AdminCategoryListQuery,
  AdminCategoryCreatePayload,
  AdminCategoryUpdatePayload,
  AdminCategoryReorderPayload,
} from '../types/admin-categories.types';

/** Build URLSearchParams safely from optional fields (skip undefined). */
function buildParams(q: AdminCategoryListQuery): Record<string, string> {
  const out: Record<string, string> = {};
  if (q.audience) out.audience = q.audience;
  if (q.parent_id !== undefined) out.parent_id = q.parent_id ?? '';
  if (q.include_inactive !== undefined) out.include_inactive = String(q.include_inactive);
  if (q.search) out.search = q.search;
  return out;
}

/** GET /admin/categories — flat list, filterable. */
export async function listAdminCategories(
  client: AxiosInstance,
  query: AdminCategoryListQuery = {},
): Promise<AdminCategoryRow[]> {
  const { data } = await client.get<{ success: true; data: AdminCategoryRow[] }>(
    '/admin/categories',
    { params: buildParams(query) },
  );
  return data.data;
}

/** GET /admin/categories/tree — nested roots + subs. */
export async function getAdminCategoryTree(
  client: AxiosInstance,
  query: AdminCategoryListQuery = {},
): Promise<AdminCategoryTreeNode[]> {
  const { data } = await client.get<{ success: true; data: AdminCategoryTreeNode[] }>(
    '/admin/categories/tree',
    { params: buildParams(query) },
  );
  return data.data;
}

/** GET /admin/categories/:id — single row. 404s for vendor-scoped customs. */
export async function getAdminCategory(
  client: AxiosInstance,
  id: string,
): Promise<AdminCategoryRow> {
  const { data } = await client.get<{ success: true; data: AdminCategoryRow }>(
    `/admin/categories/${id}`,
  );
  return data.data;
}

/** POST /admin/categories — create a global root or sub. */
export async function createAdminCategory(
  client: AxiosInstance,
  payload: AdminCategoryCreatePayload,
): Promise<AdminCategoryRow> {
  const { data } = await client.post<{ success: true; data: AdminCategoryRow }>(
    '/admin/categories',
    payload,
  );
  return data.data;
}

/** PATCH /admin/categories/:id — partial update. At least one field required. */
export async function updateAdminCategory(
  client: AxiosInstance,
  id: string,
  payload: AdminCategoryUpdatePayload,
): Promise<AdminCategoryRow> {
  const { data } = await client.patch<{ success: true; data: AdminCategoryRow }>(
    `/admin/categories/${id}`,
    payload,
  );
  return data.data;
}

/** DELETE /admin/categories/:id — soft delete. Server refuses by default when
 *  dependents exist; pass `force: true` to override. */
export async function deleteAdminCategory(
  client: AxiosInstance,
  id: string,
  opts?: { force?: boolean },
): Promise<void> {
  await client.delete(`/admin/categories/${id}`, {
    params: opts?.force ? { force: 'true' } : undefined,
  });
}

/** POST /admin/categories/:id/promote — flip a vendor-scoped row to global.
 *  Idempotent. Preserves the row id so existing services.category_id FKs
 *  inherit global status silently. */
export async function promoteAdminCategory(
  client: AxiosInstance,
  id: string,
): Promise<AdminCategoryRow> {
  const { data } = await client.post<{ success: true; data: AdminCategoryRow }>(
    `/admin/categories/${id}/promote`,
  );
  return data.data;
}

/** POST /admin/categories/reorder — bulk sort_order under a parent. */
export async function reorderAdminCategories(
  client: AxiosInstance,
  payload: AdminCategoryReorderPayload,
): Promise<{ updated: number }> {
  const { data } = await client.post<{ success: true; data: { updated: number } }>(
    '/admin/categories/reorder',
    payload,
  );
  return data.data;
}
