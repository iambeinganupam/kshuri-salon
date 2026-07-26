// ─────────────────────────────────────────────────────────────────────────────
// API Module: Service Catalog — kshuri-salon-dashboard (B2B)
// Backend: /api/v1/catalog
// Endpoints: CAT-01 … CAT-05
// Replaces: Former direct Supabase `vendor_services` queries
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VendorService {
  id: string;
  name: string;
  description?: string;
  category: { id: string; name: string };
  default_price: number;
  duration_minutes: number;
  is_active: boolean;
  staff_overrides?: Array<{
    staff_id: string;
    staff_name: string;
    override_price?: number;
    override_duration?: number;
  }>;
}

export interface CreateServicePayload {
  category_id: string;
  name: string;
  description?: string;
  default_price: number;
  duration_minutes: number;
}

export interface StaffPriceOverride {
  override_price?: number | null;
  override_duration?: number | null;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * CAT-01: List all services for the current vendor (from JWT tenant context)
 */
export async function listServices(): Promise<VendorService[]> {
  const { data } = await apiClient.get<{ success: true; data: VendorService[] }>(
    '/catalog/services',
  );
  return data.data;
}

/**
 * CAT-02: Create a new service
 */
export async function createService(payload: CreateServicePayload): Promise<VendorService> {
  const { data } = await apiClient.post<{ success: true; data: VendorService }>(
    '/catalog/services',
    payload,
  );
  return data.data;
}

/**
 * CAT-03: Update an existing service (partial update)
 */
export async function updateService(
  serviceId: string,
  payload: Partial<CreateServicePayload> & { is_active?: boolean },
): Promise<VendorService> {
  const { data } = await apiClient.put<{ success: true; data: VendorService }>(
    `/catalog/services/${serviceId}`,
    payload,
  );
  return data.data;
}

/**
 * CAT-04: Soft-delete a service (sets is_active = false)
 */
export async function deleteService(serviceId: string): Promise<void> {
  await apiClient.delete(`/catalog/services/${serviceId}`);
}

/**
 * CAT-05: Set or clear a staff price override for a service
 * Passing null for override_price / override_duration removes the override.
 */
export async function setStaffPriceOverride(
  serviceId: string,
  staffId: string,
  override: StaffPriceOverride,
): Promise<void> {
  await apiClient.put(
    `/catalog/services/${serviceId}/overrides/${staffId}`,
    override,
  );
}

// Legacy compatibility — keeps pages using CatalogAPI.getMyServices/updateServicePrice working
export const CatalogAPI = {
  getMyServices: (_freelancerId: string) => listServices(),
  updateServicePrice: (serviceId: string, newPrice: number) =>
    updateService(serviceId, { default_price: newPrice }),
};
