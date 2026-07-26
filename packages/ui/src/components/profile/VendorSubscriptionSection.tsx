'use client';
// ─────────────────────────────────────────────────────────────────────────────
// VendorSubscriptionSection — self-contained subscription / plan management
// block for vendor Settings pages. Same shape used by both the salon and
// freelancer dashboards, so plan UX stays in lockstep.
//
// Renders:
//   1. "Currently active" banner showing the vendor's current plan + the
//      commission / monthly-fee tradeoff.
//   2. A grid of publicly-selectable plans (filtered via
//      is_publicly_selectable so admin-hidden tiers don't appear). Grid
//      adapts to plan count so a single-plan view doesn't get squeezed at
//      narrow widths like Settings' max-w-3xl column.
//   3. Per-plan Upgrade / Current Plan / Default CTAs wired through
//      useSubscribeToPlan.
//
// Fetches its own data via useVendorCategories-style hooks (usePlans,
// useMyPlan, useSubscribeToPlan from @kshuri/api-client) so callers can
// drop it in without threading props.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { Check, Crown } from 'lucide-react';
import { usePlans, useMyPlan, useSubscribeToPlan } from '@kshuri/api-client';
import type { Plan } from '@kshuri/api-client/types';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Button } from '../button';
import { Badge } from '../badge';
import { Separator } from '../separator';
import { cn } from '../../lib/utils';

export interface VendorSubscriptionSectionProps {
  /** Confirmation prompt fired before switching plans. Falls back to
   *  `window.confirm` when omitted. Provide a real dialog for production. */
  confirm?: (message: string) => boolean | Promise<boolean>;
  /** Toast hook — defaults to a no-op. */
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
  onInfo?: (msg: string) => void;
  className?: string;
}

export function VendorSubscriptionSection({
  confirm,
  onSuccess,
  onError,
  onInfo,
  className,
}: VendorSubscriptionSectionProps) {
  const { data: plansData } = usePlans();
  const { data: myPlan } = useMyPlan();
  const subscribeMutation = useSubscribeToPlan();

  // Only show plans the admin has marked publicly selectable — keeps the
  // grid in sync with whatever the admin configured. is_active is already
  // filtered server-side.
  const plans: Plan[] = (Array.isArray(plansData) ? plansData : []).filter(
    (p) => p.is_publicly_selectable !== false,
  );

  const handleSubscribePlan = useCallback(
    async (plan: Plan) => {
      if (plan.is_default) {
        onInfo?.(
          "You're already on Pay-as-you-go. To downgrade from a paid plan, let the current cycle expire.",
        );
        return;
      }
      if (myPlan?.code === plan.code && myPlan.is_subscribed) {
        onInfo?.("You're already on this plan");
        return;
      }
      const message = `Switch to ${plan.display_name}? You'll be invoiced ₹${plan.monthly_fee_inr} per month — pay via UPI from Payments → Outstanding.`;
      const proceed = confirm
        ? await confirm(message)
        : typeof window !== 'undefined' && window.confirm(message);
      if (!proceed) return;
      subscribeMutation.mutate(
        { plan_code: plan.code },
        {
          onSuccess: () => onSuccess?.(`Switched to ${plan.display_name}`),
          onError: () => onError?.('Failed to switch plan'),
        },
      );
    },
    [confirm, myPlan, onError, onInfo, onSuccess, subscribeMutation],
  );

  return (
    <Card className={cn('border-border/30 shadow-soft rounded-2xl bg-card', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Crown className="h-4 w-4 text-primary" />
          </div>
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currently-active banner */}
        {myPlan && (
          <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Currently active
              </p>
              {/* div wrapper: contains Badge children (<div>), so <p> would
                  trigger validateDOMNesting (block-in-inline). */}
              <div className="text-base font-serif font-bold mt-1 flex items-center gap-2 flex-wrap">
                {myPlan.display_name}
                {myPlan.is_subscribed ? (
                  <Badge className="text-[10px] bg-success/15 text-success border border-success/25">
                    Subscribed
                  </Badge>
                ) : (
                  <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {myPlan.is_subscribed
                  ? `₹${myPlan.monthly_fee_inr.toLocaleString('en-IN')}/mo · No per-booking commission`
                  : `${myPlan.commission_percent}% commission per booking · No monthly fee`}
              </p>
            </div>
            {myPlan.subscription_active_until && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">Renews / expires</p>
                <p className="text-xs font-semibold mt-0.5">
                  {new Date(myPlan.subscription_active_until).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Plan grid — adapts to plan count so a single-plan view stays
            readable at narrow widths (Settings' max-w-3xl). */}
        {plans.length > 0 && (
          <div
            className={cn(
              'grid gap-3',
              plans.length >= 2 && 'sm:grid-cols-2',
            )}
          >
            {plans.map((plan) => {
              const isCurrent =
                myPlan?.code === plan.code && (myPlan.is_subscribed || plan.is_default);
              return (
                <PlanTile
                  key={plan.id}
                  plan={plan}
                  isCurrent={isCurrent}
                  isSubmitting={subscribeMutation.isPending}
                  onChoose={() => handleSubscribePlan(plan)}
                />
              );
            })}
          </div>
        )}
        {plans.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No plans available right now. Contact support if you need to upgrade.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Internal: per-plan tile ─────────────────────────────────────────────────
interface PlanTileProps {
  plan: Plan;
  isCurrent: boolean;
  isSubmitting: boolean;
  onChoose: () => void;
}

function PlanTile({ plan, isCurrent, isSubmitting, onChoose }: PlanTileProps) {
  const showCommission = plan.commission_percent > 0;
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 flex flex-col gap-3 transition-all',
        isCurrent ? 'border-primary/40 ring-1 ring-primary/30' : 'border-border/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif font-bold text-base leading-tight">{plan.display_name}</h3>
          {plan.tagline && (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{plan.tagline}</p>
          )}
        </div>
        {isCurrent && (
          <Badge className="bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
            Current Plan
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-serif font-bold text-primary tracking-tight">
          ₹{plan.monthly_fee_inr.toLocaleString('en-IN')}
        </span>
        <span className="text-xs text-muted-foreground/60">/month</span>
      </div>

      {showCommission ? (
        <Badge
          variant="outline"
          className="text-[10px] border-amber-500/40 text-amber-400 w-fit"
        >
          {plan.commission_percent}% commission per booking
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="text-[10px] border-success/40 text-success w-fit"
        >
          Zero commission
        </Badge>
      )}

      <Separator className="bg-border/30" />

      <ul className="space-y-1.5 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px]">
            <Check className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-muted-foreground/80">{f}</span>
          </li>
        ))}
      </ul>

      <Button
        size="sm"
        className="w-full h-9 rounded-lg text-xs"
        variant={isCurrent ? 'outline' : 'default'}
        disabled={isCurrent || isSubmitting}
        onClick={onChoose}
      >
        {isCurrent
          ? 'Current Plan'
          : isSubmitting
            ? 'Switching…'
            : plan.is_default
              ? 'Default'
              : 'Upgrade'}
      </Button>
    </div>
  );
}

export default VendorSubscriptionSection;
