// ─────────────────────────────────────────────────────────────────────────────
// Catalog Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-salon-dashboard/src/api/catalog.ts
//   - kshuri-freelancer-dashboard/src/api/catalog.ts
// ─────────────────────────────────────────────────────────────────────────────

/** Where a service is delivered — drives the booking flow's address step. */
export type ServiceLocation = 'onsite' | 'home' | 'both';

/** A service offered by a vendor (freelancer or salon location) */
export interface VendorService {
  id: string;
  name: string;
  description?: string;
  category: { id: string; name: string };
  /** Normalised price (same value as default_price; set by coerceService at the API boundary) */
  price: number;
  default_price: number;
  duration_minutes: number;
  is_active: boolean;
  is_trending?: boolean;
  is_featured?: boolean;
  /** Bullet list of "what's included" shown on the service detail sheet and
   *  on the service edit dialog. Persisted as JSONB on `services.inclusions`. */
  inclusions?: string[];
  /** Where the service is delivered: 'onsite' (customer comes to vendor),
   *  'home' (vendor comes to customer), or 'both'. The portal's booking flow
   *  uses this to decide whether to collect a delivery address. */
  service_location?: ServiceLocation;
  staff_overrides?: StaffServiceOverride[];
}

/** Staff-level price/duration override for a service */
export interface StaffServiceOverride {
  staff_id: string;
  staff_name: string;
  override_price?: number;
  override_duration?: number;
}

/** Payload for POST /catalog/services */
export interface CreateServicePayload {
  category_id: string;
  name: string;
  description?: string;
  default_price: number;
  duration_minutes: number;
}

/** Payload for PUT /catalog/services/:id/overrides/:staffId */
export interface StaffPriceOverridePayload {
  override_price?: number | null;
  override_duration?: number | null;
}

/** Audience scoping for service categories. 'both' means the category is
 *  visible to both grooming-side and event-side pickers. */
export type CategoryAudience = 'grooming' | 'wedding' | 'both';

/**
 * Service category surfaced by `GET /discover/categories` (customer + events
 * read path). Subcategories are nested recursively — the backend builds the
 * tree before returning so clients don't need a second join.
 *
 * `vendor_count` is only populated on root rows from /discover.
 */
export interface ServiceCategory {
  id: string;
  name: string;
  /** URL-safe immutable identifier — used by /services/[slug] routing. */
  slug: string | null;
  /** Lucide-react icon name (preferred over icon_url for new rows). */
  icon: string | null;
  /** Legacy CDN image URL — fall back to it when `icon` is null. */
  icon_url: string | null;
  /** Short marketing copy for category landing pages. */
  description: string | null;
  audience: CategoryAudience | null;
  /** Subs share the same shape; depth capped at 2 by the schema. */
  subcategories: ServiceCategory[];
  /** Admin-managed; present on flat-list responses, optional elsewhere. */
  sort_order?: number;
  is_active?: boolean;
  parent_id?: string | null;
  /** Distinct verified vendors offering at least one active service in this
   *  category. Surfaced by /discover/categories for the portal's grid. */
  vendor_count?: number;
}

/**
 * Flat row from `GET /catalog/categories` (vendor-scoped taxonomy: all global
 * rows + this vendor's own custom rows). The picker groups into a tree by
 * `parent_id` — or uses the dedicated tree endpoint via `useCategoryTree()`.
 *
 * `vendor_id === null` ⇒ global / admin-curated. The vendor can pick it but
 * cannot edit it. `vendor_id !== null` ⇒ created by THIS vendor (or another
 * vendor of the same scope) — editable.
 */
export interface VendorCategoryNode {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  icon: string | null;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
  audience: CategoryAudience | null;
  vendor_type: string | null;
  vendor_id: string | null;
}

/** Tree-shaped version of `VendorCategoryNode` returned by
 *  `GET /catalog/categories/tree`. Subs nest recursively. */
export type VendorCategoryTreeNode = VendorCategoryNode & {
  subcategories: VendorCategoryTreeNode[];
};

/** Payload for POST /catalog/categories (vendor creates a custom category). */
export interface CreateVendorCategoryPayload {
  name: string;
  /** Omit / undefined to create a top-level category; set to a parent_id to
   *  nest as a subcategory. Parent must be global or owned by the caller. */
  parent_id?: string;
  /** Override the inherited audience. When omitted, the new row inherits the
   *  parent's audience (or 'grooming' for top-level customs). */
  audience?: CategoryAudience;
}

export interface VendorProduct {
  id: string;
  vendor_type: string;
  vendor_id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  category?: string;
  price: number;
  stock?: number;
  is_active?: boolean;
}

/**
 * Raw API response row before numeric coercion.
 * Postgres returns DECIMAL/NUMERIC columns as strings; the DB column may be
 * named "price" instead of "default_price".
 */
export interface RawStaffOverrideRow {
  staff_id: string;
  staff_name: string;
  override_price?: number | string | null;
  override_duration?: number | string | null;
  [key: string]: unknown;
}

export interface RawVendorServiceRow {
  id: string;
  name: string;
  description?: string;
  category?: { id: string; name: string };
  /** Wire field name from the DB (may differ from default_price) */
  price?: number | string | null;
  default_price?: number | string | null;
  duration_minutes?: number | string | null;
  is_active?: boolean;
  is_trending?: boolean;
  is_featured?: boolean;
  /** JSONB column on `public.services`; pg returns it already parsed as an
   *  array of strings (or null when never set). Coerce defensively. */
  inclusions?: unknown;
  service_location?: string;
  staff_overrides?: RawStaffOverrideRow[];
  [key: string]: unknown;
}

// ── R1 public detail DTOs ───────────────────────────────────────────────────
// camelCase end-to-end (the backend already normalises pg's snake_case +
// NUMERIC strings into these shapes in catalog.service.ts#getPublicService /
// getPublicProduct). These types are used by the Next.js portal's service +
// product detail pages and accept no auth.

export interface PublicVendorMini {
  id: string;
  slug: string | null;
  name: string;
  type: 'freelancer' | 'salon_location';
  ratingAvg: number;
  ratingCount: number;
}

export interface PublicServiceDetail {
  id: string;
  name: string;
  description: string | null;
  /** Integer rupees (backend Math.rounds the NUMERIC). */
  priceInr: number;
  durationMin: number;
  genderTarget: 'male' | 'female' | 'unisex';
  /** Mirrors `services.service_location` end-to-end (errata §8.5.1). */
  serviceMode: 'home' | 'onsite' | 'both';
  photos: string[];
  category: { id: string; slug: string; name: string } | null;
  vendor: PublicVendorMini;
  reviewAggregate: { ratingAvg: number; ratingCount: number };
}

export interface PublicProductDetail {
  id: string;
  name: string;
  description: string | null;
  priceInr: number;
  /** Always [] in R1 — backend returns an empty array; products don't carry
   *  photos yet. Kept for forward-compat with the service shape. */
  photos: string[];
  /** Plain VARCHAR on `vendor_products.category` (not the taxonomy table). */
  category: string | null;
  vendor: PublicVendorMini;
  reviewAggregate: { ratingAvg: number; ratingCount: number };
}

