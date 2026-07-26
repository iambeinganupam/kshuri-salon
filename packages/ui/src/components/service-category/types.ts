// ─────────────────────────────────────────────────────────────────────────────
// Internal type used by the shared service-category UI components.
//
// Both `ServiceCategory` (from /discover/categories) and
// `VendorCategoryTreeNode` (from /catalog/categories/tree) satisfy this shape.
// Components coerce inputs to `ServiceCategoryNode` so the rendering layer
// doesn't care which API the data came from.
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceCategoryNode {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  /** Lucide icon name (preferred). Falls back to `icon_url` then to `Tag`. */
  icon: string | null;
  icon_url: string | null;
  /** Optional vendor count for the public read path. */
  vendor_count?: number;
  /** Optional audience tag (grooming / wedding / both). Drives event vs
   *  grooming surface routing on the consumer side. */
  audience?: string | null;
  /** Optional flag: true when the row is this vendor's custom subcategory
   *  (vs an admin-curated global). Surfaced as a tiny "Custom" badge. */
  is_custom?: boolean;
  subcategories: ServiceCategoryNode[];
}
