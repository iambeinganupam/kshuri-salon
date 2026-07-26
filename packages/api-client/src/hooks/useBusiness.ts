// ─────────────────────────────────────────────────────────────────────────────
// Business Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as businessService from '../services/business.service';
import type { BusinessProfile, InviteStaffPayload, StaffMember } from '../types/business.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const businessKeys = {
  all: ['business'] as const,
  profile: () => [...businessKeys.all, 'profile'] as const,
  locations: () => [...businessKeys.all, 'locations'] as const,
  location: (id: string) => [...businessKeys.all, 'location', id] as const,
  staff: () => [...businessKeys.all, 'staff'] as const,
  staffMember: (id: string) => [...businessKeys.all, 'staff', id] as const,
  staffSchedule: (id: string) => [...businessKeys.all, 'staff', id, 'schedule'] as const,
  subscription: () => [...businessKeys.all, 'subscription'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** Get business profile */
export function useBusinessProfile() {
  const client = useApiClient();
  return useQuery({
    queryKey: businessKeys.profile(),
    queryFn: () => businessService.getBusinessProfile(client),
  });
}

/** List the business's salon locations */
export function useBusinessLocations() {
  const client = useApiClient();
  return useQuery({
    queryKey: businessKeys.locations(),
    queryFn: () => businessService.listLocations(client),
  });
}

/** Get a salon location */
export function useLocation(locationId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: businessKeys.location(locationId),
    queryFn: () => businessService.getLocation(client, locationId),
    enabled: !!locationId,
  });
}

/** List all staff members */
export function useStaffList() {
  const client = useApiClient();
  return useQuery({
    queryKey: businessKeys.staff(),
    queryFn: () => businessService.listStaff(client),
  });
}

/** Get a single staff member */
export function useStaffMember(staffId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: businessKeys.staffMember(staffId),
    queryFn: () => businessService.getStaffMember(client, staffId),
    enabled: !!staffId,
  });
}

/** Get staff schedule */
export function useStaffSchedule(staffId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: businessKeys.staffSchedule(staffId),
    queryFn: () => businessService.getStaffSchedule(client, staffId),
    enabled: !!staffId,
  });
}

/** Get staff attendance records */
export function useStaffAttendance(staffId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: [...businessKeys.staffMember(staffId), 'attendance'] as const,
    queryFn: () => client.get(`/business/staff/${staffId}/attendance`).then((r) => r.data.data ?? r.data),
    enabled: !!staffId,
  });
}

/** Get appointments assigned to a specific staff member */
export function useStaffAppointments(staffId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: [...businessKeys.staffMember(staffId), 'appointments'] as const,
    queryFn: () => client.get(`/business/staff/${staffId}/appointments`).then((r) => r.data.data ?? r.data),
    enabled: !!staffId,
  });
}

/** Get salary/commission summary for a staff member */
export function useStaffSalary(staffId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: [...businessKeys.staffMember(staffId), 'salary'] as const,
    queryFn: () => client.get(`/business/staff/${staffId}/salary`).then((r) => r.data.data ?? r.data),
    enabled: !!staffId,
  });
}

/** Get subscription plan */
export function useSubscription() {
  const client = useApiClient();
  return useQuery({
    queryKey: businessKeys.subscription(),
    queryFn: () => businessService.getSubscription(client),
  });
}

/** Get engagement metrics (views, favorites, reviews) */
export function useEngagementMetrics() {
  const client = useApiClient();
  return useQuery({
    queryKey: [...businessKeys.all, 'engagement'] as const,
    queryFn: () => businessService.getEngagementMetrics(client),
    // Profile-views update slowly; 60s stale time is plenty.
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Update business profile */
export function useUpdateBusinessProfile() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Pick<BusinessProfile,
      'brand_name' | 'display_name' | 'description' | 'tagline' | 'specializations' | 'languages'
      | 'logo_url' | 'cover_image_url' | 'website_url' | 'instagram_url' | 'youtube_url'
      | 'contact_email' | 'contact_phone'
      | 'address_line1' | 'address_line2' | 'city' | 'state' | 'postal_code'
      | 'years_in_business' | 'certifications' | 'amenities'
      | 'upi_id' | 'upi_display_name'
    >>) => businessService.updateBusinessProfile(client, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(businessKeys.profile(), data);
    },
  });
}

/** Invite a new staff member */
export function useInviteStaff() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteStaffPayload) =>
      businessService.inviteStaff(client, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.staff() });
    },
  });
}

/** Update staff details */
export function useUpdateStaff() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, payload }: {
      staffId: string;
      payload: Partial<Pick<StaffMember, 'role' | 'commission_percentage' | 'is_active'>>;
    }) => businessService.updateStaff(client, staffId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.staff() });
    },
  });
}

/** Update billing method */
export function useUpdateBillingMethod() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      billing_method: BusinessProfile['billing_method'];
      payment_gateway: BusinessProfile['payment_gateway'];
    }) => businessService.updateBillingMethod(client, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(businessKeys.profile(), data);
    },
  });
}
