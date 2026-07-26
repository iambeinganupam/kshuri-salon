'use client';
// ─────────────────────────────────────────────────────────────────────────────
// PlanPicker — grid of PlanCards backed by /plans.
// Disables selection of plans flagged is_publicly_selectable=false and
// auto-selects the first selectable plan so the "Continue" button isn't
// dead-on-arrival when only one plan is currently live.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { usePlans } from '@kshuri/api-client';
import { PlanCard } from './PlanCard';

interface Props {
  value?: string;
  onChange: (planCode: string) => void;
}

export function PlanPicker({ value, onChange }: Props) {
  const { data: plans } = usePlans();

  // Auto-pick the first selectable plan if nothing is selected yet.
  useEffect(() => {
    if (value || !plans?.length) return;
    const firstSelectable = plans.find((p) => p.is_publicly_selectable !== false);
    if (firstSelectable) onChange(firstSelectable.code);
  }, [plans, value, onChange]);

  if (!plans) return <p className="text-sm text-muted-foreground">Loading plans…</p>;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {plans.map((p) => (
        <PlanCard
          key={p.code}
          plan={p}
          selected={value === p.code}
          onSelect={() => onChange(p.code)}
        />
      ))}
    </div>
  );
}
