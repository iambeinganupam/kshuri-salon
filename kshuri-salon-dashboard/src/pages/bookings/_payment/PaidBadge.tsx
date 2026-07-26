// ─────────────────────────────────────────────────────────────────────────────
// PaidBadge — green "Paid" pill shown on completed bookings whose payment
// has settled. Keeps the visual logic colocated with the rest of the
// payment subsystem.
// ─────────────────────────────────────────────────────────────────────────────

import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SalonBooking } from "../types";

export function PaidBadge({ booking }: { booking: SalonBooking }) {
  if (!booking.paid) return null;
  return (
    <Badge className="text-[10px] font-bold bg-success/15 text-success border border-success/25 gap-1">
      <BadgeCheck className="h-3 w-3" /> {booking.payment_status_label}
    </Badge>
  );
}
