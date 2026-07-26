import { useKycStatus } from '@kshuri/api-client';
import { KycWizard } from '@kshuri/ui';
import { Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KycOnboardingPage() {
  const { data } = useKycStatus();
  const navigate = useNavigate();

  if (!data) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your verification status…
        </div>
      </div>
    );
  }

  if (data.status === 'approved') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — matches the SignupPage typographic system */}
      <div className="relative overflow-hidden border-b border-border/60 bg-card">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto flex max-w-3xl items-center gap-4 px-4 py-10 md:px-6 md:py-12">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Verify your business
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit one identity document and pick a plan to start receiving bookings.
            </p>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
        <KycWizard onComplete={() => navigate('/onboarding/pending', { replace: true })} />
      </div>
    </div>
  );
}
