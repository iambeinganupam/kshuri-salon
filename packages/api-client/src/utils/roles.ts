// ─────────────────────────────────────────────────────────────────────────────
// Role Helpers — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Each dashboard is the home of one (or, for staff, two) roles. A user signing
// in with a different role must NOT be seated — neither on fresh login nor on
// silent refresh of a stale session cookie. The auth context throws this
// `RoleMismatchError` and the LoginPage surfaces it inline with a deep-link to
// the correct dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import type { AuthUser, UserRole } from '../types/auth.types';

/** Human-friendly label for a role (used in error UIs and toasts). */
export const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  freelancer: 'Freelancer',
  business_admin: 'Salon Admin',
  staff: 'Staff',
  event_manager: 'Event Manager',
  super_admin: 'Platform Admin',
};

/** Slug of the dashboard each role is meant to use. */
export const ROLE_DASHBOARD_SLUG: Record<UserRole, string> = {
  customer: 'customer',
  freelancer: 'freelancer',
  business_admin: 'salon',
  staff: 'staff',
  event_manager: 'events',
  super_admin: 'admin',
};

/**
 * Thrown by the auth context when a signed-in user's role is not one this
 * dashboard accepts. Carries enough context for the UI to render an actionable
 * error (label, suggested dashboard slug) without re-mapping the role itself.
 */
export class RoleMismatchError extends Error {
  readonly name = 'RoleMismatchError';
  constructor(
    readonly actualRole: UserRole,
    readonly expectedRoles: readonly UserRole[],
  ) {
    super(
      `This account is registered as ${ROLE_LABEL[actualRole]}. `
      + `This dashboard is for: ${expectedRoles.map((r) => ROLE_LABEL[r]).join(', ')}.`,
    );
  }
}

/**
 * Throw `RoleMismatchError` if `user.role` is not in `expectedRoles`.
 * No-ops on success so callers can treat it as an assertion.
 */
export function assertExpectedRole(
  user: Pick<AuthUser, 'role'>,
  expectedRoles: readonly UserRole[],
): void {
  if (!expectedRoles.includes(user.role)) {
    throw new RoleMismatchError(user.role, expectedRoles);
  }
}

/**
 * True if `err` represents a role/audience mismatch — either thrown locally
 * by `assertExpectedRole` or returned by the backend with the
 * `AUTH_ROLE_MISMATCH` error code (HTTP 403). Callers can use this single
 * check to surface a "create the right account" UI regardless of where the
 * mismatch was caught.
 */
export function isRoleMismatchError(err: unknown): boolean {
  if (err instanceof RoleMismatchError) return true;

  // Backend AppError envelope from axios:
  //   err.response.data = { success: false, error: { code: 'AUTH_ROLE_MISMATCH', ... } }
  const e = err as {
    response?: { status?: number; data?: { error?: { code?: string } } };
  } | undefined;
  const code = e?.response?.data?.error?.code;
  return code === 'AUTH_ROLE_MISMATCH';
}

/**
 * True when a phone-OTP login (`lookup_only=true`) verified successfully
 * but no account exists for the calling dashboard. Login pages should
 * route the user into the signup flow with the just-verified idToken
 * handoff (state.idToken + idTokenIssuedAt) so they can finish
 * onboarding without re-typing their phone or resolving another OTP.
 */
export function isPhoneNotRegisteredError(err: unknown): boolean {
  const e = err as {
    response?: { status?: number; data?: { error?: { code?: string } } };
  } | undefined;
  return e?.response?.data?.error?.code === 'AUTH_PHONE_NOT_REGISTERED';
}
