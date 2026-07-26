// ─────────────────────────────────────────────────────────────────────────────
// API Module: Auth — kshuri-salon-dashboard (B2B Freelancer / Manager)
// Backend: /api/v1/auth
// Endpoints: AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-09
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';
import type { AuthUser } from '@/lib/auth-context';

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'freelancer' | 'business_admin';
  business_name?: string;          // required if role === 'freelancer'
  legal_business_name?: string;    // required if role === 'business_admin'
}

export interface AuthTokenResponse {
  access_token: string;
  user: AuthUser;
  context?: { active_location_id?: string };
}

/**
 * AUTH-03: Register a new freelancer or business admin
 */
export async function register(payload: RegisterPayload): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/register',
    payload,
  );
  return data.data;
}

/**
 * AUTH-04: Login with email + password
 */
export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/login',
    { email, password },
  );
  return data.data;
}

/**
 * AUTH-06: Get current authenticated user's profile
 */
export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ success: true; data: AuthUser }>('/auth/me');
  return data.data;
}

/**
 * AUTH-07: Update profile fields (business_name, bio, etc.)
 */
export async function updateMe(
  payload: Partial<Pick<AuthUser, 'business_name' | 'bio'>>,
): Promise<AuthUser> {
  const { data } = await apiClient.put<{ success: true; data: AuthUser }>(
    '/auth/me',
    payload,
  );
  return data.data;
}

/**
 * AUTH-09: Logout — clears server-side session and httpOnly cookie
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

/**
 * AUTH-08a: Request a password reset email
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ success: true; data: { message: string } }>(
    '/auth/forgot-password',
    { email },
  );
  return data.data;
}
