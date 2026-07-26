'use client';
// ─────────────────────────────────────────────────────────────────────────────
// KycStatusBanner — sticky banner showing current KYC state.
// Hidden when status is 'approved'. Shows CTA for actionable states.
// ─────────────────────────────────────────────────────────────────────────────

import { AlertTriangle, Clock } from 'lucide-react';
import { useKycStatus } from '@kshuri/api-client';
import type { KycStatus } from '@kshuri/api-client';

interface Props {
  onAction?: () => void;
}

type BannerConfig = {
  icon: typeof AlertTriangle;
  color: string;
  text: string;
  cta?: string;
};

export function KycStatusBanner({ onAction }: Props) {
  const { data } = useKycStatus();
  if (!data) return null;

  const { status, submission } = data;
  if (status === 'approved') return null;

  const config: Record<Exclude<KycStatus, 'approved'>, BannerConfig> = {
    not_started: {
      icon: AlertTriangle,
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      text: 'Complete KYC to start receiving bookings.',
      cta: 'Start KYC',
    },
    submitted: {
      icon: Clock,
      color: 'bg-blue-50 border-blue-200 text-blue-900',
      text: 'KYC submitted — awaiting admin review.',
    },
    auto_passed: {
      icon: Clock,
      color: 'bg-blue-50 border-blue-200 text-blue-900',
      text: 'KYC auto-verified — awaiting admin confirmation.',
    },
    auto_flagged: {
      icon: AlertTriangle,
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      text: 'KYC under review — automated checks need manual verification.',
    },
    rejected: {
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200 text-red-900',
      text: submission?.rejection_reason
        ? `KYC rejected: ${submission.rejection_reason}`
        : 'KYC rejected.',
      cta: 'Re-submit',
    },
  };

  const entry = config[status as Exclude<KycStatus, 'approved'>] ?? null;
  if (!entry) return null;

  const Icon = entry.icon;

  return (
    <div className={`rounded-lg border p-3 flex items-center gap-3 ${entry.color}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <p className="text-sm flex-1">{entry.text}</p>
      {entry.cta && onAction && (
        <button onClick={onAction} className="text-sm font-medium underline">
          {entry.cta}
        </button>
      )}
    </div>
  );
}
