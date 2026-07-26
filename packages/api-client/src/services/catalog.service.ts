// ─────────────────────────────────────────────────────────────────────────────
// Catalog Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  VendorService,
  CreateServicePayload,
  StaffPriceOverridePayload,
  ServiceCategory,
  VendorProduct,
  CreateProductPayload,
  RawVendorServiceRow,
  RawStaffOverrideRow,
  VendorCategoryNode,
  VendorCategoryTreeNode,
  CreateVendorCategoryPayload,
  CategoryAudience,
  PublicServiceDetail,
  PublicProductDetail,
} from '../types/catalog.types';

function coerceService(s: RawVendorServiceRow): VendorService {
  // pg returns DECIMAL as strings; DB column is "price" not "default_price"
  const price = Number(s.price ?? s.default_price ?? 0);
  // `inclusions` is JSONB — pg parses to an array, but be defensive against
  // a NULL row or an accidentally-stringified payload during migration.
  const inclusions: string[] = Array.isArray(s.inclusions)
    ? (s.inclusions as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category ?? { id: '', name: '' },
    price,
    default_price: price,
    duration_minutes: Number(s.duration_minutes ?? 0),
    is_active: s.is_active ?? true,
    is_trending: s.is_trending,
    is_featured: s.is_featured,
    inclusions,
    service_location:
      s.service_location === 'home' || s.service_location === 'both' || s.service_location === 'onsite'
        ? s.service_location
        : 'onsite',
    staff_overrides: (s.staff_overrides ?? []).map((o: RawStaffOverrideRow) => ({
      staff_id: o.staff_id,
      staff_name: o.staff_name,
      override_price: o.override_price != null ? Number(o.override_price) : undefined,
      override_duration: o.override_duration != null ? Number(o.override_duration) : undefined,
    })),
  };
}

/** CAT-01: List services for current vendor */
export async function listServices(client: AxiosInstance): Promise<VendorService[]> {
  const { data } = await client.get<{ success: true; data: RawVendorServiceRow[] }>(
    '/catalog/services',
  );
  return (data.data ?? []).map(coerceService);
}

/** CAT-02: Create a new service */
export async function createService(
  client: AxiosInstance,
  payload: CreateServicePayload,
): Promise<VendorService> {
  const { data } = await client.post<{ success: true; data: RawVendorServiceRow }>(
    '/catalog/services',
    payload,
  );
  return coerceService(data.data);
}

/** CAT-03: Update a service */
export async function updateService(
  client: AxiosInstance,
  serviceId: string,
  payload: Partial<CreateServicePayload> & {
    is_active?: boolean;
    is_trending?: boolean;
    is_featured?: boolean;
  },
): Promise<VendorService> {
  const { data } = await client.put<{ success: true; data: RawVendorServiceRow }>(
    `/catalog/services/${serviceId}`,
    payload,
  );
  return coerceService(data.data);
}

/** CAT-04: Delete (soft) a service */
export async function deleteService(client: AxiosInstance, serviceId: string): Promise<void> {
  await client.delete(`/catalog/services/${serviceId}`);
}

/** CAT-05: Set/clear staff price override */
export async function setStaffPriceOverride(
  client: AxiosInstance,
  serviceId: string,
  staffId: string,
  override: StaffPriceOverridePayload,
): Promise<void> {
  await client.put(`/catalog/services/${serviceId}/overrides/${staffId}`, override);
}

/** Get service categories (customer-facing /discover surface). */
export async function getCategories(
  client: AxiosInstance,
  opts?: { audience?: CategoryAudience },
): Promise<ServiceCategory[]> {
  const { data } = await client.get<{ success: true; data: ServiceCategory[] }>(
    '/discover/categories',
    { params: opts?.audience ? { audience: opts.audience } : undefined },
  );
  return data.data;
}

/**
 * Vendor-scoped taxonomy — list all categories visible to the caller (global
 * rows + their own customs), as a flat array. Audience filter narrows the
 * roots; subs come along with their parent regardless of their own audience.
 */
export async function listVendorCategories(
  client: AxiosInstance,
  opts?: { audience?: CategoryAudience },
): Promise<VendorCategoryNode[]> {
  const { data } = await client.get<{ success: true; data: VendorCategoryNode[] }>(
    '/catalog/categories',
    { params: opts?.audience ? { audience: opts.audience } : undefined },
  );
  return data.data ?? [];
}

/**
 * Vendor-scoped taxonomy as a pre-built tree (roots with `subcategories`
 * nested). Use this in pickers instead of `listVendorCategories` so you
 * don't repeat tree construction on every consumer.
 */
export async function listVendorCategoryTree(
  client: AxiosInstance,
  opts?: { audience?: CategoryAudience },
): Promise<VendorCategoryTreeNode[]> {
  const { data } = await client.get<{ success: true; data: VendorCategoryTreeNode[] }>(
    '/catalog/categories/tree',
    { params: opts?.audience ? { audience: opts.audience } : undefined },
  );
  return data.data ?? [];
}

/** Vendor creates a custom category / subcategory. Gated on the
 *  `custom_categories` plan entitlement server-side. */
export async function createVendorCategory(
  client: AxiosInstance,
  payload: CreateVendorCategoryPayload,
): Promise<VendorCategoryNode> {
  const { data } = await client.post<{ success: true; data: VendorCategoryNode }>(
    '/catalog/categories',
    payload,
  );
  return data.data;
}

// ── Products ──

function coerceProduct(p: VendorProduct): VendorProduct {
  return { ...p, price: Number(p.price ?? 0), stock: Number(p.stock ?? 0) };
}

export async function listProducts(client: AxiosInstance): Promise<VendorProduct[]> {
  const { data } = await client.get<{ success: true; data: VendorProduct[] }>(
    '/catalog/products',
  );
  return (data.data ?? []).map(coerceProduct);
}

export async function createProduct(
  client: AxiosInstance,
  payload: CreateProductPayload,
): Promise<VendorProduct> {
  const { data } = await client.post<{ success: true; data: VendorProduct }>(
    '/catalog/products',
    payload,
  );
  return coerceProduct(data.data);
}

export async function updateProduct(
  client: AxiosInstance,
  productId: string,
  payload: Partial<CreateProductPayload>,
): Promise<VendorProduct> {
  const { data } = await client.put<{ success: true; data: VendorProduct }>(
    `/catalog/products/${productId}`,
    payload,
  );
  return coerceProduct(data.data);
}

export async function deleteProduct(client: AxiosInstance, productId: string): Promise<void> {
  await client.delete(`/catalog/products/${productId}`);
}

// ── R1 public reads (no auth) ───────────────────────────────────────────────
// The backend already returns camelCase DTOs (priceInr / serviceMode / etc.);
// no client-side coercion needed beyond the response envelope unwrap.

export async function getPublicService(
  client: AxiosInstance,
  id: string,
): Promise<PublicServiceDetail> {
  const { data } = await client.get<{ success: true; data: PublicServiceDetail }>(
    `/catalog/services/${id}/public`,
  );
  return data.data;
}

export async function getPublicProduct(
  client: AxiosInstance,
  id: string,
): Promise<PublicProductDetail> {
  const { data } = await client.get<{ success: true; data: PublicProductDetail }>(
    `/catalog/products/${id}/public`,
  );
  return data.data;
}

