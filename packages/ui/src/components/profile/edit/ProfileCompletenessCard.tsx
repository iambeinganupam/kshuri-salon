'use client';
// ─────────────────────────────────────────────────────────────────────────────
// ProfileCompletenessCard — shared completeness widget for vendor Edit pages.
//
// Mirrors the salon dashboard's Profile-Edit completeness card so every vendor
// surface (salon, freelancer, future event-manager) renders the same visual:
// title + percentage on the right, a thin progress bar, and a two-column
// checklist of remaining items. Once at 100 %, the card switches to a success-
// tinted shell with a "Profile complete" headline.
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { cn } from '../../../lib/utils';

export interface CompletenessCheck {
  key: string;
  label: string;
  done: boolean;
}

interface Props {
  /** 0–100 inclusive. */
  pct: number;
  checks: CompletenessCheck[];
  /** Microcopy shown when not yet 100 %. Defaults to a sensible vendor message. */
  helper?: string;
  className?: string;
}

export function ProfileCompletenessCard({ pct, checks, helper, className }: Props) {
  const completedCount = checks.filter((c) => c.done).length;
  const isComplete = pct === 100;

  const subhead = isComplete
    ? "Great work — customers see a fully filled-out profile."
    : helper ??
      `${completedCount} of ${checks.length} done. A complete profile drives more bookings.`;

  return (
    <Card
      className={cn(
        'border-border/40',
        isComplete && 'border-success/40 bg-success/5',
        className,
      )}
    >
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" />
                Profile complete
              </>
            ) : (
              <>Complete your profile</>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{subhead}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold font-serif">{pct}%</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              isComplete ? 'bg-success' : 'bg-primary',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!isComplete && checks.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {checks.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-xs">
                {c.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                )}
                <span
                  className={cn(
                    c.done ? 'text-muted-foreground line-through' : 'text-foreground',
                  )}
                >
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default ProfileCompletenessCard;
