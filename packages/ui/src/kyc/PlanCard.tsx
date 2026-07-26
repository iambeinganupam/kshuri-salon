'use client';
// ─────────────────────────────────────────────────────────────────────────────
// PlanCard — single selectable plan tile.
// When `plan.is_publicly_selectable === false` the card renders disabled with
// a "Coming soon" badge so vendors can see what's on the roadmap without
// being able to pick it. Admins flip this flag from the platform Plans page.
// ─────────────────────────────────────────────────────────────────────────────

import { Check, Hourglass, Star } from 'lucide-react';
import type { Plan } from '@kshuri/api-client';

interface Props {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, selected, onSelect }: Props) {
  // Plans default to publicly selectable=true if the field is missing
  // (back-compat with older API responses).
  const selectable = plan.is_publicly_selectable !== false;

  return (
    <button
      type="button"
      onClick={selectable ? onSelect : undefined}
      disabled={!selectable}
      aria-disabled={!selectable}
      aria-pressed={selected}
      className={`group relative w-full overflow-hidden rounded-2xl border-2 p-5 text-left transition-all ${
        !selectable
          ? 'cursor-not-allowed border-border/40 bg-muted/10 opacity-60'
          : selected
          ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]'
          : 'border-border/60 bg-card hover:border-primary/50 hover:bg-primary/[0.02]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{plan.display_name}</h3>
            {plan.is_default && selectable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Star className="h-3 w-3" /> Default
              </span>
            )}
          </div>
          {plan.tagline && (
            <p className="mt-0.5 text-sm text-muted-foreground">{plan.tagline}</p>
          )}
        </div>

        {!selectable && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            <Hourglass className="h-3 w-3" /> Coming soon
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">
          ₹{Number(plan.monthly_fee_inr).toLocaleString('en-IN')}
          <span className="ml-1 text-base font-normal text-muted-foreground">/mo</span>
        </p>
        {plan.commission_percent > 0 && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            + {plan.commission_percent}% commission per booking
          </p>
        )}
      </div>

      {/* Features */}
      {Array.isArray(plan.features) && plan.features.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {plan.features.map((f, i) => (
            <li key={i} className="flex gap-2">
              <Check className={`mt-0.5 h-4 w-4 shrink-0 ${selectable ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              <span className={selectable ? 'text-foreground' : 'text-muted-foreground'}>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Inline note for disabled state */}
      {!selectable && (
        <p className="mt-4 text-xs text-muted-foreground">
          Not available yet. We'll let you know the moment it goes live.
        </p>
      )}
    </button>
  );
}
