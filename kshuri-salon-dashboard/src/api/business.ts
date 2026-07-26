// ─────────────────────────────────────────────────────────────────────────────
// API Module: Business Management — kshuri-salon-dashboard (B2B Manager)
// Backend: /api/v1/business
// Endpoints: BIZ-01 … BIZ-11
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BusinessProfile {
  id: string;
  legal_business_name: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  billing_method?: 'per_booking' | 'subscription';
  payment_gateway?: 'stripe' | 'razorpay' | 'mock';
  is_active: boolean;
}

export interface SalonLocation {
  id: string;
  business_account_id: string;
  display_name: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  role: 'senior_stylist' | 'junior_stylist' | 'manager' | 'receptionist';
  commission_percentage: number;
  is_active: boolean;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface InviteStaffPayload {
  email: string;
  role: StaffMember['role'];
  commission_percentage: number;
  location_id: string;
}

export interface StaffSchedule {
  shifts: Array<{
    id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    type: string;
    is_approved: boolean;
  }>;
}

export interface Subscription {
  plan: 'free' | 'standard' | 'pro';
  status: 'active' | 'past_due' | 'cancelled';
  current_period_end: string;
  features: string[];
}

// ── API Functions ─────────────────────────────────────────────────────────────

/** BIZ-01: Get the business profile */
export async function getBusinessProfile(): Promise<BusinessProfile> {
  const { data } = await apiClient.get<{ success: true; data: BusinessProfile }>(
    '/business/profile',
  );
  return data.data;
}

/** BIZ-02: Update the business profile */
export async function updateBusinessProfile(
  payload: Partial<Pick<BusinessProfile, 'display_name' | 'description' | 'logo_url' | 'website_url'>>,
): Promise<BusinessProfile> {
  const { data } = await apiClient.put<{ success: true; data: BusinessProfile }>(
    '/business/profile',
    payload,
  );
  return data.data;
}

/** BIZ-03: Get a specific salon location */
export async function getLocation(locationId: string): Promise<SalonLocation> {
  const { data } = await apiClient.get<{ success: true; data: SalonLocation }>(
    `/business/locations/${locationId}`,
  );
  return data.data;
}

/** BIZ-04: Update a salon location's details */
export async function updateLocation(
  locationId: string,
  payload: Partial<Omit<SalonLocation, 'id' | 'business_account_id'>>,
): Promise<SalonLocation> {
  const { data } = await apiClient.put<{ success: true; data: SalonLocation }>(
    `/business/locations/${locationId}`,
    payload,
  );
  return data.data;
}

/** BIZ-05: List all staff members for the business */
export async function listStaff(): Promise<StaffMember[]> {
  const { data } = await apiClient.get<{ success: true; data: StaffMember[] }>(
    '/business/staff',
  );
  return data.data;
}

/** BIZ-06: Get a single staff member */
export async function getStaffMember(staffId: string): Promise<StaffMember> {
  const { data } = await apiClient.get<{ success: true; data: StaffMember }>(
    `/business/staff/${staffId}`,
  );
  return data.data;
}

/** BIZ-07: Invite a new staff member (sends invite email) */
export async function inviteStaff(payload: InviteStaffPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ success: true; data: { message: string } }>(
    '/business/staff/invite',
    payload,
  );
  return data.data;
}

/** BIZ-08: Update staff details (role, commission) */
export async function updateStaff(
  staffId: string,
  payload: Partial<Pick<StaffMember, 'role' | 'commission_percentage' | 'is_active'>>,
): Promise<StaffMember> {
  const { data } = await apiClient.put<{ success: true; data: StaffMember }>(
    `/business/staff/${staffId}`,
    payload,
  );
  return data.data;
}

/** BIZ-09: Get the schedule for a specific staff member */
export async function getStaffSchedule(staffId: string): Promise<StaffSchedule> {
  const { data } = await apiClient.get<{ success: true; data: StaffSchedule }>(
    `/business/staff/${staffId}/schedule`,
  );
  return data.data;
}

/** BIZ-10: Get current subscription plan */
export async function getSubscription(): Promise<Subscription> {
  const { data } = await apiClient.get<{ success: true; data: Subscription }>(
    '/business/subscription',
  );
  return data.data;
}

/** BIZ-11: Update billing method (per_booking / subscription) */
export async function updateBillingMethod(payload: {
  billing_method: BusinessProfile['billing_method'];
  payment_gateway: BusinessProfile['payment_gateway'];
}): Promise<BusinessProfile> {
  const { data } = await apiClient.patch<{ success: true; data: BusinessProfile }>(
    '/business/billing-method',
    payload,
  );
  return data.data;
}
