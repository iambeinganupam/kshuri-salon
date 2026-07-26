// ─────────────────────────────────────────────────────────────────────────────
// BookingSummary — read-only recap of the wizard state. Lives at the bottom
// of the schedule step so the user can verify what they're about to submit.
// ─────────────────────────────────────────────────────────────────────────────
import { format } from "date-fns";
import type { CreateBookingForm } from "./useCreateBookingForm";

interface Props {
  form: CreateBookingForm;
}

export function BookingSummary({ form }: Props) {
  const { state, derived } = form;

  const scheduleLabel = state.selectedSlot
    ? `${format(state.date, "dd MMM")} at ${state.selectedSlot.label}`
    : "No slot selected";

  return (
    <div className="p-3.5 rounded-xl bg-muted/20 border border-border/25 space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Booking Summary
      </p>
      <Row label="Customer" value={state.customerName.trim() || "—"} />
      <Row label="Schedule" value={scheduleLabel} />
      <Row
        label="Staff"
        value={state.selectedStaffId ? "Assigned" : "Unassigned"}
        muted={!state.selectedStaffId}
      />
      <div className="border-t border-border/20 pt-2 mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="font-serif font-bold text-primary tabular-nums">
          ₹{derived.totalAmount.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={
          muted ? "text-muted-foreground truncate" : "font-semibold truncate text-right"
        }
      >
        {value}
      </span>
    </div>
  );
}
