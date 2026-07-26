// ─────────────────────────────────────────────────────────────────────────────
// StepIndicator — three numbered pills with connecting bars between them.
// Highlights every step up to and including `current` so the user can see
// how far they've progressed through the wizard.
// ─────────────────────────────────────────────────────────────────────────────
import { cn } from "@/lib/utils";
import type { WizardStep } from "./useCreateBookingForm";

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 1, label: "Customer" },
  { id: 2, label: "Services" },
  { id: 3, label: "Schedule" },
];

interface Props {
  current: WizardStep;
}

export function StepIndicator({ current }: Props) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2 flex-1">
          <div
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors shrink-0",
              current >= s.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {s.id}
          </div>
          <span
            className={cn(
              "text-[11px] font-medium hidden sm:block transition-colors",
              current >= s.id ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 rounded-full transition-colors",
                current > s.id ? "bg-primary" : "bg-border/50",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
