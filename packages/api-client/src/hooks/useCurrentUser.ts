/**
 * Cross-cutting hooks for the authenticated session.
 *
 * Apps today reach into per-app AuthContexts to get the current user, tenant,
 * and role. These helpers centralise the access pattern on top of
 * `useProfile()` so the same shape is available everywhere.
 *
 * Adoption is gradual — existing local AuthContexts continue to work.
 */

import { useProfile } from './useAuth';

interface ProfileLike {
  id?: string;
  user_id?: string;
  role?: string;
  tenant_id?: string;
  business_id?: string;
  business_account_id?: string;
  profile_id?: string;
  [key: string]: unknown;
}

/**
 * The authenticated user's profile. Thin alias over `useProfile()` so the
 * name reads naturally at call sites — `useCurrentUser()` rather than
 * `useProfile()` (which is ambiguous: profile of whom?).
 */
export function useCurrentUser() {
  return useProfile();
}

/**
 * The tenant id for the authenticated user. Falls back across the common
 * shapes the backend has shipped historically:
 *   - `tenant_id` (most modules)
 *   - `business_account_id` (business_admin)
 *   - `business_id` (salon staff)
 *
 * Returns `undefined` while the profile is loading or unauthenticated.
 */
export function useCurrentTenantId(): string | undefined {
  const { data } = useProfile();
  const profile = data as ProfileLike | undefined;
  if (!profile) return undefined;
  return profile.tenant_id ?? profile.business_account_id ?? profile.business_id;
}

/**
 * The role for the authenticated user. `undefined` while loading. Useful for
 * gating UI without dragging the full profile around.
 */
export function useCurrentRole(): string | undefined {
  const { data } = useProfile();
  return (data as ProfileLike | undefined)?.role;
}

/**
 * Whether the user is authenticated. `false` while loading and after an
 * auth failure. Use `useCurrentUser().isLoading` to distinguish loading
 * from unauthenticated.
 */
export function useIsAuthenticated(): boolean {
  const { data } = useProfile();
  return data != null;
}
