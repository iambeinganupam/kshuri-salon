// ─────────────────────────────────────────────────────────────────────────────
// Plans Types — @kshuri/api-client
//
// Mirrors `subscription_plans` rows + the vendor's effective plan resolution
// (active subscription || default fallback).
// ─────────────────────────────────────────────────────────────────────────────

export type PlanCode = 'pay_as_you_go' | 'basic' | 'professional' | 'enterprise' | string;

export interface Plan {
  id: string;
  code: PlanCode;
  display_name: string;
  tagline: string | null;
  monthly_fee_inr: number;
  commission_percent: number;
  /** null = unlimited */
  included_bookings_per_month: number | null;
  features: string[];
  is_active: boolean;
  is_default: boolean;
  /**
   * Whether vendors can pick this plan during onboarding / from billing.
   * When false, render the card as "Coming soon" — visible but not clickable.
   * Admins toggle this from the platform Plans page.
   */
  is_publicly_selectable: boolean;
  sort_order: number;
}

/** Returned by GET /plans/me — vendor's currently effective plan + status. */
export interface EffectivePlan extends Plan {
  /** ISO datetime, or null when on the default fallback. */
  subscription_active_until: string | null;
  /** True when resolved via an active paid subscription. */
  is_subscribed: boolean;
}

export interface SubscribePayload {
  plan_code: PlanCode;
  /** Skip the first month's invoice (super-admin promo). */
  waive_first_month?: boolean;
}

export interface SubscribeResult {
  plan: Plan;
  /** ISO datetime — end of the just-purchased subscription window. */
  active_until: string;
}
