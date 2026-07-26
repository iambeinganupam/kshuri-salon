// ─────────────────────────────────────────────────────────────────────────────
// API Module: Catalog — kshuri-freelancer-dashboard
// Backend: /api/v1/catalog
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '../lib/apiClient';

export interface VendorService {
  id: string;
  name: string;
  category: { id: string; name: string };
  default_price: number;
  duration_minutes: number;
  is_active: boolean;
}

/** List services for current vendor */
export async function listServices(): Promise<VendorService[]> {
  const { data } = await apiClient.get('/catalog/services');
  return data.data;
}

/** Create a new service */
export async function createService(payload: {
  category_id: string;
  name: string;
  default_price: number;
  duration_minutes: number;
  description?: string;
}): Promise<VendorService> {
  const { data } = await apiClient.post('/catalog/services', payload);
  return data.data;
}

/** Update a service */
export async function updateService(
  serviceId: string,
  payload: Partial<{ name: string; default_price: number; duration_minutes: number; is_active: boolean }>,
): Promise<VendorService> {
  const { data } = await apiClient.put(`/catalog/services/${serviceId}`, payload);
  return data.data;
}

/** Soft-delete a service */
export async function deleteService(serviceId: string): Promise<void> {
  await apiClient.delete(`/catalog/services/${serviceId}`);
}
