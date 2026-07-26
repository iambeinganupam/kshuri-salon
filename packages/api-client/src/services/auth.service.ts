// ─────────────────────────────────────────────────────────────────────────────
// Auth Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from per-app api/auth.ts files.
// All functions accept an AxiosInstance parameter to avoid coupling to context.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  AuthUser,
  AuthTokenResponse,
  RegisterPayload,
  ProfileUpdatePayload,
} from '../types/auth.types';

/** POST /auth/request-otp — B2C phone auth */
export async function requestOtp(client: AxiosInstance, phoneNumber: string) {
  const { data } = await client.post<{ success: true; data: { token_id: string } }>(
    '/auth/request-otp',
    { phone_number: phoneNumber },
  );
  return data.data;
}

/** POST /auth/verify-otp — B2C phone login */
export async function verifyOtp(
  client: AxiosInstance,
  phoneNumber: string,
  otpCode: string,
) {
  const { data } = await client.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/verify-otp',
    { phone_number: phoneNumber, otp_code: otpCode },
  );
  return data.data;
}

/** POST /auth/register — B2B freelancer/manager registration */
export async function register(client: AxiosInstance, payload: RegisterPayload) {
  const { data } = await client.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/register',
    payload,
  );
  return data.data;
}

/** POST /auth/login — B2B email/password login */
export async function login(client: AxiosInstance, email: string, password: string) {
  const { data } = await client.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/login',
    { email, password },
  );
  return data.data;
}

/** GET /auth/me — Get current user profile */
export async function getProfile(client: AxiosInstance): Promise<AuthUser> {
  const { data } = await client.get<{ success: true; data: AuthUser }>('/auth/me');
  return data.data;
}

/** PUT /auth/me — Update current user profile */
export async function updateProfile(
  client: AxiosInstance,
  payload: ProfileUpdatePayload,
): Promise<AuthUser> {
  const { data } = await client.put<{ success: true; data: AuthUser }>(
    '/auth/me',
    payload,
  );
  return data.data;
}

/** POST /auth/logout — Invalidate sessions */
export async function logout(client: AxiosInstance): Promise<void> {
  await client.post('/auth/logout');
}

/** POST /auth/refresh — Refresh access token (cookie-based) */
export async function refreshToken(client: AxiosInstance) {
  const { data } = await client.post<{
    success: true;
    data: { access_token: string };
  }>('/auth/refresh');
  return data.data;
}

/** POST /auth/forgot-password */
export async function forgotPassword(client: AxiosInstance, email: string) {
  const { data } = await client.post<{ success: true; data: { message: string } }>(
    '/auth/forgot-password',
    { email },
  );
  return data.data;
}

/** POST /auth/reset-password */
export async function resetPassword(
  client: AxiosInstance,
  token: string,
  newPassword: string,
) {
  const { data } = await client.post<{ success: true; data: { message: string } }>(
    '/auth/reset-password',
    { token, new_password: newPassword },
  );
  return data.data;
}

/** POST /auth/change-password — authenticated in-session password rotation. */
export async function changePassword(
  client: AxiosInstance,
  currentPassword: string,
  newPassword: string,
) {
  const { data } = await client.post<{ success: true; data: { message: string } }>(
    '/auth/change-password',
    { current_password: currentPassword, new_password: newPassword },
  );
  return data.data;
}

/** POST /auth/oauth/google */
export async function googleOAuth(
  client: AxiosInstance,
  idToken: string,
  role?: string,
) {
  const { data } = await client.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/oauth/google',
    { id_token: idToken, role },
  );
  return data.data;
}

/** POST /auth/oauth/firebase-phone */
export async function verifyFirebaseToken(
  client: AxiosInstance,
  payload: {
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
  }
) {
  const { data } = await client.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/oauth/firebase-phone',
    payload,
  );
  return data.data;
}
