// ─────────────────────────────────────────────────────────────────────────────
// PaymentActions — slim trigger surface shown on completed-but-unpaid
// booking cards. Renders a single "Collect Payment" CTA that opens the
// orchestrating PaymentDialog. Keeps the card layout uncluttered while
// the heavy lifting happens behind the modal.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Wallet, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SalonBooking } from "../types";
import { PaymentDialog } from "./PaymentDialog";

interface PaymentActionsProps {
  booking: SalonBooking;
}

export function PaymentActions({ booking }: PaymentActionsProps) {
  const [open, setOpen] = useState(false);
  const isFree = booking.total_amount <= 0;
  return (
    <>
      <Button
        size="sm"
        className="w-full h-10 rounded-lg gap-1.5 text-xs font-bold bg-success hover:bg-success/90 text-success-foreground"
        onClick={() => setOpen(true)}
      >
        {isFree ? (
          <><BadgeCheck className="h-3.5 w-3.5" /> Mark as Settled</>
        ) : (
          <><Wallet className="h-3.5 w-3.5" /> Collect Payment · ₹{booking.total_amount.toLocaleString("en-IN")}</>
        )}
      </Button>
      <PaymentDialog booking={booking} open={open} onOpenChange={setOpen} />
    </>
  );
}
