// ─────────────────────────────────────────────────────────────────────────────
// Admin Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  KycApplication,
  PlatformUser,
  PlatformKPI,
} from '../types/admin.types';
import type { ServiceCategory } from '../types/catalog.types';

/** Get platform-wide KPIs */
export async function getPlatformKPIs(client: AxiosInstance): Promise<PlatformKPI> {
  const { data } = await client.get<{ success: true; data: PlatformKPI }>(
    '/admin/dashboard',
  );
  return data.data;
}

/** List KYC applications */
export async function listKycApplications(
  client: AxiosInstance,
  params?: { status?: string },
): Promise<KycApplication[]> {
  const { data } = await client.get<{ success: true; data: KycApplication[] }>(
    '/admin/kyc',
    { params },
  );
  return data.data;
}

/** Approve a KYC application */
export async function approveKyc(
  client: AxiosInstance,
  applicationId: string,
  notes?: string,
): Promise<KycApplication> {
  const { data } = await client.post<{ success: true; data: KycApplication }>(
    `/admin/kyc/${applicationId}/approve`,
    { reviewer_notes: notes },
  );
  return data.data;
}

/** Reject a KYC application */
export async function rejectKyc(
  client: AxiosInstance,
  applicationId: string,
  notes: string,
): Promise<KycApplication> {
  const { data } = await client.post<{ success: true; data: KycApplication }>(
    `/admin/kyc/${applicationId}/reject`,
    { reviewer_notes: notes },
  );
  return data.data;
}

/** List platform users */
export async function listPlatformUsers(
  client: AxiosInstance,
  params?: { role?: string; limit?: number; cursor?: string },
): Promise<PlatformUser[]> {
  const { data } = await client.get<{ success: true; data: PlatformUser[] }>(
    '/admin/users',
    { params },
  );
  return data.data;
}

/** Toggle user active status */
export async function toggleUserStatus(
  client: AxiosInstance,
  userId: string,
  isActive: boolean,
): Promise<PlatformUser> {
  const { data } = await client.patch<{ success: true; data: PlatformUser }>(
    `/admin/users/${userId}/status`,
    { is_active: isActive },
  );
  return data.data;
}

/** List service categories (Admin management) */
export async function listCategories(client: AxiosInstance): Promise<ServiceCategory[]> {
  const { data } = await client.get<{ success: true; data: ServiceCategory[] }>(
    '/admin/categories',
  );
  return data.data;
}

/** Create a new service category */
export async function createCategory(
  client: AxiosInstance,
  payload: { name: string; parent_id?: string },
): Promise<ServiceCategory> {
  const { data } = await client.post<{ success: true; data: ServiceCategory }>(
    '/admin/categories',
    payload,
  );
  return data.data;
}
