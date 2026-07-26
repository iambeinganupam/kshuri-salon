// ─────────────────────────────────────────────────────────────────────────────
// API Module: Auth — kshuri-freelancer-dashboard
// Backend: /api/v1/auth
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '../lib/apiClient';
import type { AuthUser } from '../lib/auth-context';

export interface AuthTokenResponse {
  access_token: string;
  user: AuthUser;
}

/** Login with email + password */
export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<{ success: true; data: AuthTokenResponse }>(
    '/auth/login',
    { email, password },
  );
  return data.data;
}

/** Get current user's profile */
export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ success: true; data: AuthUser }>('/auth/me');
  return data.data;
}

/** Update profile */
export async function updateMe(
  payload: Partial<Pick<AuthUser, 'first_name' | 'last_name' | 'avatar_url'>>,
): Promise<AuthUser> {
  const { data } = await apiClient.put<{ success: true; data: AuthUser }>('/auth/me', payload);
  return data.data;
}

/** Logout — clears server cookie */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
