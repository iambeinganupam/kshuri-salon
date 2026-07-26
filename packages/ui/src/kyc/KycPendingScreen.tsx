'use client';
// ─────────────────────────────────────────────────────────────────────────────
// KycPendingScreen — what the vendor sees while their KYC is in review.
//
// Both salon + freelancer dashboards mount this on /onboarding/pending.
// Polls /kyc/status every 30s; jumps to dashboard on approval / back to
// wizard on rejection (caller wires the navigate side-effect).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useKycStatus } from '@kshuri/api-client';
import type { KycStatus } from '@kshuri/api-client';
import { Button } from '../components/button';
import { Badge } from '../components/badge';

interface Props {
  /** Called when the polled status flips to `approved`. */
  onApproved?: () => void;
  /** Called when the polled status flips to `rejected`. */
  onRejected?: (reason: string | null) => void;
  /** Called when the user clicks "Sign out". */
  onSignOut?: () => void;
}

const STATUS_COPY: Record<
  Exclude<KycStatus, 'not_started' | 'approved'>,
  { title: string; helper: string; chip: string; chipClass: string }
> = {
  submitted: {
    title: 'Submitted — awaiting review',
    helper: 'Your documents are queued for our verification team.',
    chip: 'Submitted',
    chipClass: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  auto_passed: {
    title: 'Auto-verified — final review in progress',
    helper: 'Our automated checks passed cleanly. A reviewer is taking one last look.',
    chip: 'Auto-verified',
    chipClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  auto_flagged: {
    title: 'Under manual review',
    helper:
      "Our automated checks flagged at least one item, so a human reviewer is verifying your document. This is routine and usually resolves within 24 hours.",
    chip: 'Under review',
    chipClass: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
  rejected: {
    title: 'Verification rejected',
    helper: 'See the reason below and re-submit when corrected.',
    chip: 'Rejected',
    chipClass: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
};

function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const DOC_LABEL = { aadhaar: 'Aadhaar', pan: 'PAN' } as const;

export function KycPendingScreen({ onApproved, onRejected, onSignOut }: Props) {
  const { data, refetch, isFetching } = useKycStatus();

  // Poll while pending so the screen reacts to admin's decision automatically.
  useEffect(() => {
    const t = setInterval(() => refetch(), 30_000);
    return () => clearInterval(t);
  }, [refetch]);

  // Reactive side-effects on status transitions.
  useEffect(() => {
    if (!data) return;
    if (data.status === 'approved') onApproved?.();
    if (data.status === 'rejected') onRejected?.(data.submission?.rejection_reason ?? null);
  }, [data, onApproved, onRejected]);

  const status = data?.status;
  const submission = data?.submission;

  const stage = useMemo<Exclude<KycStatus, 'not_started' | 'approved'> | null>(() => {
    if (!status || status === 'not_started' || status === 'approved') return null;
    return status;
  }, [status]);

  if (!data) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your verification status…
        </div>
      </div>
    );
  }

  const copy = stage ? STATUS_COPY[stage] : null;

  // Timeline steps: Submitted → In review → Approved
  const steps = [
    {
      id: 'submitted',
      label: 'Submitted',
      time: submission?.created_at,
      done: true,
      Icon: FileText,
    },
    {
      id: 'review',
      label: 'In review',
      time: submission?.auto_checked_at,
      done: status === 'auto_passed' || status === 'auto_flagged' || status === 'submitted' || status === 'approved' || status === 'rejected',
      active: status === 'submitted' || status === 'auto_passed' || status === 'auto_flagged',
      Icon: Clock,
    },
    {
      id: 'approved',
      label: 'Approved',
      time: status === 'approved' ? submission?.reviewed_at : null,
      done: status === 'approved',
      Icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/60 bg-card">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto flex max-w-3xl flex-wrap items-start justify-between gap-4 px-4 py-10 md:px-6 md:py-12">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                Verification in progress
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                You'll get access to your dashboard the moment our team finishes reviewing.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6 md:py-10">
        {/* Status card */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {copy?.title ?? 'Verification status'}
            </h2>
            {copy && (
              <Badge variant="outline" className={`gap-1 ${copy.chipClass}`}>
                <ShieldCheck className="h-3 w-3" /> {copy.chip}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{copy?.helper}</p>

          {/* Timeline */}
          <ol className="mt-6 grid grid-cols-3 gap-3">
            {steps.map((s) => (
              <li
                key={s.id}
                className={`rounded-xl border p-3 ${
                  (s as { active?: boolean }).active
                    ? 'border-primary/40 bg-primary/5'
                    : s.done
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-border/60 bg-muted/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-full ${
                      (s as { active?: boolean }).active
                        ? 'bg-primary text-primary-foreground'
                        : s.done
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {(s as { active?: boolean }).active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <s.Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {s.time ? formatRelativeTime(s.time) : '—'}
                </p>
              </li>
            ))}
          </ol>

          {/* Rejection reason inline */}
          {status === 'rejected' && submission?.rejection_reason && (
            <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-semibold">Reviewer feedback</p>
              <p className="mt-1 whitespace-pre-line">{submission.rejection_reason}</p>
            </div>
          )}
        </section>

        {/* Submission summary */}
        {submission && (
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
            <header className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4" /> Your submission
            </header>
            <dl className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20">
              <Row label="Document type" value={DOC_LABEL[submission.document_type] ?? submission.document_type} />
              <Row label="Document number" value={submission.document_number} mono />
              <Row label="Plan" value={data.plan?.display_name ?? submission.selected_plan_code} />
              <Row label="Submitted" value={formatRelativeTime(submission.created_at)} />
            </dl>
          </section>
        )}

        {/* How you'll be notified */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
          <header className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Bell className="h-4 w-4" /> How you'll be notified
          </header>
          <p className="text-sm text-muted-foreground">
            We'll let you know via:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-foreground">In-app notification</span>
              <span className="text-muted-foreground">— look for the bell on your dashboard</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-foreground">Email</span>
              <span className="text-muted-foreground">— sent to the address on your account</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            This page auto-refreshes every 30 seconds, so you can leave it open in a tab.
          </p>
        </section>

        {/* Sign out */}
        {onSignOut && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onSignOut} className="gap-2 text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={`text-right text-sm font-medium text-foreground ${
          mono ? 'font-mono tabular-nums' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
