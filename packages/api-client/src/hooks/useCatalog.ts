// ─────────────────────────────────────────────────────────────────────────────
// Catalog Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as catalogService from '../services/catalog.service';
import type {
  CreateServicePayload,
  StaffPriceOverridePayload,
  CreateProductPayload,
  CreateVendorCategoryPayload,
  CategoryAudience,
} from '../types/catalog.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const catalogKeys = {
  all: ['catalog'] as const,
  services: () => [...catalogKeys.all, 'services'] as const,
  service: (id: string) => [...catalogKeys.all, 'service', id] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  /** Vendor-scoped category list (global + own customs). Separate from
   *  `categories()` which hits the public /discover endpoint. */
  vendorCategories: (audience?: CategoryAudience) =>
    [...catalogKeys.all, 'vendor-categories', audience ?? 'all'] as const,
  vendorCategoryTree: (audience?: CategoryAudience) =>
    [...catalogKeys.all, 'vendor-categories', 'tree', audience ?? 'all'] as const,
  products: () => [...catalogKeys.all, 'products'] as const,
  product: (id: string) => [...catalogKeys.all, 'product', id] as const,
  /** R1 public reads keyed by id (no auth context, so id alone is enough). */
  servicePublic: (id: string) => [...catalogKeys.all, 'service-public', id] as const,
  productPublic: (id: string) => [...catalogKeys.all, 'product-public', id] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** List all services for the current vendor */
export function useServices() {
  const client = useApiClient();
  return useQuery({
    queryKey: catalogKeys.services(),
    queryFn: () => catalogService.listServices(client),
  });
}

/** Get service categories */
export function useCategories() {
  const client = useApiClient();
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: () => catalogService.getCategories(client),
    staleTime: 30 * 60 * 1000, // Categories rarely change — 30 min
  });
}

/** List all products for the current vendor */
export function useProducts() {
  const client = useApiClient();
  return useQuery({
    queryKey: catalogKeys.products(),
    queryFn: () => catalogService.listProducts(client),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create a new service */
export function useCreateService() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateServicePayload) =>
      catalogService.createService(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.services() });
    },
  });
}

/** Update a service */
export function useUpdateService() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, payload }: {
      serviceId: string;
      payload: Partial<CreateServicePayload> & {
        is_active?: boolean;
        is_trending?: boolean;
        is_featured?: boolean;
      };
    }) => catalogService.updateService(client, serviceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.services() });
    },
  });
}

/** Delete (soft) a service */
export function useDeleteService() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => catalogService.deleteService(client, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.services() });
    },
  });
}

/** Set/clear staff price override */
export function useSetStaffOverride() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, staffId, override }: {
      serviceId: string;
      staffId: string;
      override: StaffPriceOverridePayload;
    }) => catalogService.setStaffPriceOverride(client, serviceId, staffId, override),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.services() });
    },
  });
}

// ── Products Mutations ──

export function useCreateProduct() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      catalogService.createProduct(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.products() });
    },
  });
}

export function useUpdateProduct() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: {
      productId: string;
      payload: Partial<CreateProductPayload>;
    }) => catalogService.updateProduct(client, productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.products() });
    },
  });
}

export function useDeleteProduct() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => catalogService.deleteProduct(client, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.products() });
    },
  });
}

// ── Vendor-scoped categories ───────────────────────────────────────────────
// Vendor sees: global rows (admin-curated) + their own customs.
//
// Two shapes available:
//   • useVendorCategories(audience?)    — flat list (when the picker wants
//                                          to group itself)
//   • useVendorCategoryTree(audience?)  — pre-built tree (preferred for
//                                          the shared <CategoryPicker />)
export function useVendorCategories(audience?: CategoryAudience) {
  const client = useApiClient();
  return useQuery({
    queryKey: catalogKeys.vendorCategories(audience),
    queryFn: () => catalogService.listVendorCategories(client, { audience }),
    // Categories rarely change; stay fresh for 5 minutes so the picker
    // doesn't re-fetch on every focus.
    staleTime: 5 * 60 * 1000,
  });
}

/** Pre-built tree (roots with `subcategories` nested). Same vendor scoping
 *  as `useVendorCategories`. */
export function useVendorCategoryTree(audience?: CategoryAudience) {
  const client = useApiClient();
  return useQuery({
    queryKey: catalogKeys.vendorCategoryTree(audience),
    queryFn: () => catalogService.listVendorCategoryTree(client, { audience }),
    staleTime: 5 * 60 * 1000,
  });
}

/** Vendor creates a custom category / subcategory. Invalidates both the
 *  flat list and the tree caches. */
export function useCreateVendorCategory() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVendorCategoryPayload) =>
      catalogService.createVendorCategory(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...catalogKeys.all, 'vendor-categories'] });
    },
  });
}

// ── R1 public detail reads (no auth) ────────────────────────────────────────
// Powers the Next.js portal's /services/[id] and /products/[id] detail pages.

export function usePublicService(id: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: catalogKeys.servicePublic(id),
    queryFn: () => catalogService.getPublicService(client, id),
    enabled: !!id,
  });
}

export function usePublicProduct(id: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: catalogKeys.productPublic(id),
    queryFn: () => catalogService.getPublicProduct(client, id),
    enabled: !!id,
  });
}

