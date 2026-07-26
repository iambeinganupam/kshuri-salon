// ─────────────────────────────────────────────────────────────────────────────
// API Module: Auth — salon-connect-hub (B2C Customer)
// Backend: /api/v1/auth
// Endpoints: AUTH-01 … AUTH-10
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';
import type { AuthUser } from '@/lib/auth-context';

// ── Response Types ────────────────────────────────────────────────────────────

export interface AuthTokenResponse {
  access_token: string;
  user: AuthUser;
  is_new_user?: boolean;
}

export interface ProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender_preference?: 'male' | 'female' | 'any';
  marketing_opt_in?: boolean;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * AUTH-01: Request OTP via phone number (B2C login step 1)
 */
export async function requestOtp(phoneNumber: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ success: true; data: { message: string } }>(
    '/auth/request-otp',
    { phone_number: phoneNumber },
  );
  return data.data;
}

/**
 * AUTH-02: Verify OTP (B2C login step 2)
 * Returns access_token (in-memory) — refresh_token is set as httpOnly cookie by server.
 */
export async function verifyOtp(
  phoneNumber: string,
  otpCode: string,
): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/verify-otp',
    { phone_number: phoneNumber, otp_code: otpCode },
  );
  return data.data;
}

/**
 * AUTH-06: Get current user profile
 */
export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ success: true; data: AuthUser }>('/auth/me');
  return data.data;
}

/**
 * AUTH-07: Update customer profile
 */
export async function updateMe(payload: ProfileUpdatePayload): Promise<AuthUser> {
  const { data } = await apiClient.put<{ success: true; data: AuthUser }>(
    '/auth/me',
    payload,
  );
  return data.data;
}

/**
 * AUTH-09: Logout — clears httpOnly cookie server-side
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

/**
 * AUTH-10: Google OAuth login/register
 */
export async function googleOAuth(idToken: string): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/oauth/google',
    { id_token: idToken, role: 'customer' },
  );
  return data.data;
}
