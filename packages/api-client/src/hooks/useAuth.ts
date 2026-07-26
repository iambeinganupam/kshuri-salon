// ─────────────────────────────────────────────────────────────────────────────
// Auth Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as authService from '../services/auth.service';
import type { RegisterPayload, ProfileUpdatePayload } from '../types/auth.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** Fetch the current user's profile (GET /auth/me) */
export function useProfile() {
  const client = useApiClient();
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authService.getProfile(client),
    retry: false, // Don't retry auth failures
    staleTime: 5 * 60 * 1000, // Profile rarely changes — 5 min
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** POST /auth/login */
export function useLogin() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(client, email, password),
    onSuccess: (data) => {
      // Pre-populate profile cache from login response
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
  });
}

/** POST /auth/register */
export function useRegister() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(client, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
  });
}

/** POST /auth/request-otp */
export function useRequestOtp() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (phoneNumber: string) => authService.requestOtp(client, phoneNumber),
  });
}

/** POST /auth/verify-otp */
export function useVerifyOtp() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ phoneNumber, otpCode }: { phoneNumber: string; otpCode: string }) =>
      authService.verifyOtp(client, phoneNumber, otpCode),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
  });
}

/** PUT /auth/me */
export function useUpdateProfile() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) =>
      authService.updateProfile(client, payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(authKeys.profile(), updatedProfile);
    },
  });
}

/** POST /auth/logout */
export function useLogout() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(client),
    onSuccess: () => {
      queryClient.clear(); // Wipe all cached data on logout
    },
  });
}

/** POST /auth/oauth/google */
export function useGoogleOAuth() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idToken, role }: { idToken: string; role?: string }) =>
      authService.googleOAuth(client, idToken, role),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
  });
}

/** POST /auth/forgot-password */
export function useForgotPassword() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(client, email),
  });
}

/** POST /auth/reset-password */
export function useResetPassword() {
  const client = useApiClient();
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(client, token, newPassword),
  });
}

/** POST /auth/change-password — authenticated in-session password rotation.
 *  Other sessions are invalidated server-side; the current session keeps
 *  its access token until natural expiry. */
export function useChangePassword() {
  const client = useApiClient();
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(client, currentPassword, newPassword),
  });
}

/** POST /auth/oauth/firebase-phone */
export function useVerifyFirebaseToken() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id_token: string;
      role?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      business_name?: string;
      legal_business_name?: string;
      address_line1?: string;
      city?: string;
      postal_code?: string;
      outlet_type?: 'unisex' | 'men' | 'women';
      gstin?: string;
      trade_license?: string;
      is_signup?: boolean;
      lookup_only?: boolean;
    }) => authService.verifyFirebaseToken(client, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
  });
}
