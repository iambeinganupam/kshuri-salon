'use client';
// ─────────────────────────────────────────────────────────────────────────────
// KycWizard — 3-step KYC submission flow.
// Step 1: Document type + number + upload
// Step 2: Plan selection
// Step 3: Review + submit
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, FileText, Loader2, Receipt, ShieldCheck } from 'lucide-react';
import { useSubmitKyc, usePlans } from '@kshuri/api-client';
import type { KycDocumentType } from '@kshuri/api-client';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Label } from '../components/label';
import { DocumentUploader } from './DocumentUploader';
import { PlanPicker } from './PlanPicker';

interface Props {
  onComplete?: () => void;
}

type Step = 1 | 2 | 3;

const STEPS: ReadonlyArray<{ id: Step; label: string; helper: string; icon: typeof FileText }> = [
  { id: 1, label: 'Document',  helper: 'Identity proof',         icon: FileText },
  { id: 2, label: 'Plan',      helper: 'Choose your subscription', icon: Receipt },
  { id: 3, label: 'Review',    helper: 'Confirm & submit',       icon: ShieldCheck },
];

const AADHAAR_RE = /^\d{12}$/;
const PAN_RE     = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const DOC_LABEL: Record<KycDocumentType, string> = {
  aadhaar: 'Aadhaar',
  pan: 'PAN',
};

function humanisePlanCode(code: string | null | undefined): string {
  if (!code) return '—';
  return code
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractServerError(err: unknown): string | null {
  const apiErr = err as { response?: { data?: { error?: { message?: string; details?: unknown } } } };
  const msg = apiErr?.response?.data?.error?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  const details = apiErr?.response?.data?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    const first = details[0] as { message?: string };
    if (typeof first?.message === 'string') return first.message;
  }
  return null;
}

export function KycWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [docType, setDocType] = useState<KycDocumentType>('aadhaar');
  const [docNumber, setDocNumber] = useState('');
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [planCode, setPlanCode] = useState<string | null>(null);

  const submit = useSubmitKyc();
  const { data: plans } = usePlans();
  const selectedPlan = useMemo(
    () => plans?.find((p) => p.code === planCode) ?? null,
    [plans, planCode],
  );

  // ── Client-side validation for the document number ──
  const docNumberValid = useMemo(() => {
    const v = docNumber.trim();
    if (!v) return false;
    return docType === 'aadhaar' ? AADHAAR_RE.test(v) : PAN_RE.test(v.toUpperCase());
  }, [docType, docNumber]);

  const docNumberHint = docType === 'aadhaar'
    ? '12-digit Aadhaar number'
    : '10-character PAN (e.g. ABCDE1234F)';

  function next() { if (step < 3) setStep(((step as number) + 1) as Step); }
  function back() { if (step > 1) setStep(((step as number) - 1) as Step); }

  async function handleSubmit() {
    if (!mediaId || !planCode || !docNumberValid) return;
    try {
      await submit.mutateAsync({
        document_type:   docType,
        document_number: docType === 'pan' ? docNumber.toUpperCase() : docNumber,
        media_id:        mediaId,
        plan_code:       planCode,
      });
      onComplete?.();
    } catch {
      // Error message is read off submit.error in render; nothing else to do here.
    }
  }

  const serverError = submit.isError ? extractServerError(submit.error) ?? 'Could not submit. Please check your details and try again.' : null;

  return (
    <div className="space-y-6">
      {/* ─── Step indicator ─── */}
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map(({ id, label, helper, icon: Icon }) => {
          const isDone = id < step;
          const isCurrent = id === step;
          return (
            <li
              key={id}
              className={`relative rounded-2xl border p-4 transition-colors ${
                isCurrent
                  ? 'border-primary/60 bg-primary/5'
                  : isDone
                  ? 'border-primary/30 bg-primary/[0.03]'
                  : 'border-border/60 bg-muted/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full text-xs font-semibold ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isDone
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {id}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{label}</p>
                  <p className="hidden truncate text-xs text-muted-foreground sm:block">{helper}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* ─── Step content card ─── */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
        {/* Step 1: Document */}
        {step === 1 && (
          <div className="space-y-6">
            <header>
              <h2 className="text-xl font-serif font-bold text-foreground">Identity document</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your Aadhaar or PAN. We use it to verify your business and unlock payouts.
              </p>
            </header>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Document type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(['aadhaar', 'pan'] as KycDocumentType[]).map((t) => {
                  const selected = docType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setDocType(t); setDocNumber(''); }}
                      aria-pressed={selected}
                      className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border/60 hover:border-primary/60'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{DOC_LABEL[t]}</p>
                        <p className="text-xs text-muted-foreground">
                          {t === 'aadhaar' ? '12-digit unique ID' : '10-char tax ID'}
                        </p>
                      </div>
                      {selected && <BadgeCheck className="h-5 w-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Document number
              </Label>
              <Input
                id="doc-number"
                value={docNumber}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (docType === 'aadhaar') {
                    setDocNumber(raw.replace(/\D/g, '').slice(0, 12));
                  } else {
                    setDocNumber(raw.toUpperCase().slice(0, 10));
                  }
                }}
                inputMode={docType === 'aadhaar' ? 'numeric' : 'text'}
                autoCapitalize="characters"
                placeholder={docType === 'aadhaar' ? '1234 5678 9012' : 'ABCDE1234F'}
                className="h-12 rounded-xl bg-muted/30 border-border/50"
              />
              <p
                className={`text-xs ${
                  docNumber.length > 0 && !docNumberValid ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {docNumber.length > 0 && !docNumberValid
                  ? `Doesn't match the expected format — ${docNumberHint}.`
                  : docNumberHint}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Document photo
              </Label>
              <DocumentUploader onUploaded={(id) => setMediaId(id)} />
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                className="h-11 gap-2 rounded-xl"
                onClick={next}
                disabled={!mediaId || !docNumberValid}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Plan */}
        {step === 2 && (
          <div className="space-y-6">
            <header>
              <h2 className="text-xl font-serif font-bold text-foreground">Pick a plan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how you'd like to be billed. You can change this later from your business settings.
              </p>
            </header>
            <PlanPicker value={planCode ?? undefined} onChange={setPlanCode} />
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" size="lg" className="h-11 gap-2 rounded-xl" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button size="lg" className="h-11 gap-2 rounded-xl" onClick={next} disabled={!planCode}>
                Review <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <header>
              <h2 className="text-xl font-serif font-bold text-foreground">Review your submission</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Once submitted, our team typically reviews within one business day. You can keep using the dashboard while we verify.
              </p>
            </header>

            <dl className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20 divide-y divide-border/60">
              <ReviewRow
                label="Document type"
                value={DOC_LABEL[docType]}
              />
              <ReviewRow
                label="Document number"
                value={docNumber || '—'}
                mono
              />
              <ReviewRow
                label="Identity document"
                value={mediaId ? 'Uploaded ✓' : 'Not uploaded'}
              />
              <ReviewRow
                label="Plan"
                value={selectedPlan ? selectedPlan.display_name : humanisePlanCode(planCode)}
              />
              {selectedPlan && (
                <ReviewRow
                  label="Monthly fee"
                  value={`₹${selectedPlan.monthly_fee_inr}/mo${
                    selectedPlan.commission_percent > 0
                      ? ` · ${selectedPlan.commission_percent}% per booking`
                      : ''
                  }`}
                />
              )}
            </dl>

            {serverError && (
              <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" size="lg" className="h-11 gap-2 rounded-xl" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                size="lg"
                className="h-11 gap-2 rounded-xl"
                onClick={handleSubmit}
                disabled={submit.isPending || !mediaId || !planCode || !docNumberValid}
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    Submit for review <ShieldCheck className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
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
