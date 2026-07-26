// ─────────────────────────────────────────────────────────────────────────────
// Admin Categories Types — @kshuri/api-client
//
// Super-admin governance of the global service_categories taxonomy.
// Mirrors the wire shape of backend/src/modules/admin-categories.
// ─────────────────────────────────────────────────────────────────────────────

import type { CategoryAudience } from './catalog.types';

/** Single row from `GET /admin/categories[/:id]`. */
export interface AdminCategoryRow {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  icon: string | null;
  icon_url: string | null;
  aliases: string[] | null;
  sort_order: number;
  is_active: boolean;
  audience: CategoryAudience | null;
  vendor_type: string | null;
  vendor_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Tree-shaped row for the /admin/categories/tree endpoint. */
export type AdminCategoryTreeNode = AdminCategoryRow & {
  subcategories: AdminCategoryTreeNode[];
};

/** Query params for list + tree endpoints. */
export interface AdminCategoryListQuery {
  audience?: CategoryAudience;
  parent_id?: string | null;
  include_inactive?: boolean;
  search?: string;
}

/** Payload for POST /admin/categories. */
export interface AdminCategoryCreatePayload {
  name: string;
  slug?: string;
  parent_id?: string | null;
  audience?: CategoryAudience;
  description?: string;
  icon?: string;
  aliases?: string[];
  sort_order?: number;
  is_active?: boolean;
}

/** Payload for PATCH /admin/categories/:id. */
export type AdminCategoryUpdatePayload = Partial<AdminCategoryCreatePayload> & {
  description?: string | null;
  icon?: string | null;
};

/** Payload for POST /admin/categories/reorder. `ids` is the new sibling
 *  order under `parent_id` (null for top-level). */
export interface AdminCategoryReorderPayload {
  parent_id: string | null;
  ids: string[];
}
