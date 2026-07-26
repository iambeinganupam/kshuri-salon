// ─────────────────────────────────────────────────────────────────────────────
// Business Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  BusinessProfile,
  SalonLocation,
  StaffMember,
  InviteStaffPayload,
  StaffSchedule,
  Subscription,
} from '../types/business.types';

/** BIZ-01: Get business profile */
export async function getBusinessProfile(client: AxiosInstance): Promise<BusinessProfile> {
  const { data } = await client.get<{ success: true; data: BusinessProfile }>(
    '/business/profile',
  );
  return data.data;
}

/** Aggregated engagement metrics for the salon dashboard's stat tiles. */
export interface EngagementMetrics {
  primary_location_id: string | null;
  view_count: number;
  favorite_count: number;
  review_count: number;
  avg_rating: number;
}

/** BIZ-14: Get engagement metrics (views, favorites, reviews) */
export async function getEngagementMetrics(client: AxiosInstance): Promise<EngagementMetrics> {
  const { data } = await client.get<{ success: true; data: EngagementMetrics }>(
    '/business/profile/engagement',
  );
  return data.data;
}

/** BIZ-02: Update business profile */
export async function updateBusinessProfile(
  client: AxiosInstance,
  payload: Partial<Pick<BusinessProfile,
    'brand_name' | 'display_name' | 'description' | 'tagline' | 'specializations' | 'languages'
    | 'logo_url' | 'cover_image_url' | 'website_url' | 'instagram_url' | 'youtube_url'
    | 'contact_email' | 'contact_phone'
    | 'address_line1' | 'address_line2' | 'city' | 'state' | 'postal_code'
    | 'years_in_business' | 'certifications' | 'amenities'
    | 'upi_id' | 'upi_display_name'
  >>,
): Promise<BusinessProfile> {
  const { data } = await client.put<{ success: true; data: BusinessProfile }>(
    '/business/profile',
    payload,
  );
  return data.data;
}

/** BIZ-03a: List the business's salon locations */
export async function listLocations(client: AxiosInstance): Promise<SalonLocation[]> {
  const { data } = await client.get<{ success: true; data: SalonLocation[] }>(
    '/business/locations',
  );
  return data.data;
}

/** BIZ-03: Get a salon location */
export async function getLocation(client: AxiosInstance, locationId: string): Promise<SalonLocation> {
  const { data } = await client.get<{ success: true; data: SalonLocation }>(
    `/business/locations/${locationId}`,
  );
  return data.data;
}

/** BIZ-04: Update a salon location */
export async function updateLocation(
  client: AxiosInstance,
  locationId: string,
  payload: Partial<Omit<SalonLocation, 'id' | 'business_account_id'>>,
): Promise<SalonLocation> {
  const { data } = await client.put<{ success: true; data: SalonLocation }>(
    `/business/locations/${locationId}`,
    payload,
  );
  return data.data;
}

/** BIZ-05: List staff members */
export async function listStaff(client: AxiosInstance): Promise<StaffMember[]> {
  const { data } = await client.get<{ success: true; data: StaffMember[] }>(
    '/business/staff',
  );
  return data.data;
}

/** BIZ-06: Get a single staff member */
export async function getStaffMember(client: AxiosInstance, staffId: string): Promise<StaffMember> {
  const { data } = await client.get<{ success: true; data: StaffMember }>(
    `/business/staff/${staffId}`,
  );
  return data.data;
}

/** BIZ-07: Invite a new staff member */
export async function inviteStaff(
  client: AxiosInstance,
  payload: InviteStaffPayload,
): Promise<{ message: string }> {
  const { data } = await client.post<{ success: true; data: { message: string } }>(
    '/business/staff/invite',
    payload,
  );
  return data.data;
}

/** BIZ-08: Update staff details */
export async function updateStaff(
  client: AxiosInstance,
  staffId: string,
  payload: Partial<Pick<StaffMember, 'role' | 'commission_percentage' | 'is_active'>>,
): Promise<StaffMember> {
  const { data } = await client.put<{ success: true; data: StaffMember }>(
    `/business/staff/${staffId}`,
    payload,
  );
  return data.data;
}

/** BIZ-09: Get staff schedule */
export async function getStaffSchedule(client: AxiosInstance, staffId: string): Promise<StaffSchedule> {
  const { data } = await client.get<{ success: true; data: StaffSchedule }>(
    `/business/staff/${staffId}/schedule`,
  );
  return data.data;
}

/** BIZ-10: Get subscription plan */
export async function getSubscription(client: AxiosInstance): Promise<Subscription> {
  const { data } = await client.get<{ success: true; data: Subscription }>(
    '/business/subscription',
  );
  return data.data;
}

/** BIZ-11: Update billing method */
export async function updateBillingMethod(
  client: AxiosInstance,
  payload: {
    billing_method: BusinessProfile['billing_method'];
    payment_gateway: BusinessProfile['payment_gateway'];
  },
): Promise<BusinessProfile> {
  const { data } = await client.patch<{ success: true; data: BusinessProfile }>(
    '/business/billing-method',
    payload,
  );
  return data.data;
}
