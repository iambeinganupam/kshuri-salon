// ─────────────────────────────────────────────────────────────────────────────
// Step1Customer — captures who the booking is for (name + phone) and which
// channel it came in through (walk-in vs Estylr app booking on their behalf).
// ─────────────────────────────────────────────────────────────────────────────
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CreateBookingForm, BookingType } from "./useCreateBookingForm";

const TYPE_OPTIONS: Array<{ id: BookingType; title: string; hint: string }> = [
  { id: "walkin", title: "Walk-in", hint: "Customer is here in person" },
  { id: "kshuri", title: "Estylr App", hint: "Booking on the customer's behalf" },
];

interface Props {
  form: CreateBookingForm;
}

export function Step1Customer({ form }: Props) {
  const { state, derived, actions } = form;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[12px] font-semibold mb-1.5 block">Booking Type</label>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => actions.update("bookingType", opt.id)}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                state.bookingType === opt.id
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/30 hover:border-border/50",
              )}
            >
              <p className="text-[12px] font-semibold">{opt.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="cb-name" className="text-[12px] font-semibold mb-1.5 block">
          Customer Name *
        </label>
        <Input
          id="cb-name"
          placeholder="Enter customer name"
          className="h-11 rounded-xl"
          value={state.customerName}
          onChange={(e) => actions.update("customerName", e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="cb-phone" className="text-[12px] font-semibold mb-1.5 block">
          Phone <span className="text-muted-foreground font-normal">(Optional)</span>
        </label>
        <Input
          id="cb-phone"
          type="tel"
          inputMode="tel"
          placeholder="+91 XXXXX XXXXX"
          className="h-11 rounded-xl"
          value={state.customerPhone}
          onChange={(e) => actions.update("customerPhone", e.target.value)}
        />
      </div>

      <Button
        className="w-full h-11 rounded-xl"
        disabled={!derived.isStepValid[1]}
        onClick={actions.goNext}
      >
        Continue <ArrowUpRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
