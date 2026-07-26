// ─────────────────────────────────────────────────────────────────────────────
// HistoryBookingCard — completed / cancelled / no-show appointments.
//
// Behaviour by status + payment state:
//   completed + paid     → render PaidBadge + "Generate Bill" (printable)
//   completed + unpaid   → render PaymentActions (Cash / UPI buttons)
//   cancelled / no_show  → read-only summary, no actions
//
// PaymentActions handles the API call + toast + cache invalidation, so this
// card stays presentational.
// ─────────────────────────────────────────────────────────────────────────────

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalonBooking } from "./types";
import { statusAccent } from "./types";
import {
  CustomerHeader, ServicesBreakdown, MetaStrip, NotesBlock, AlertsBlock,
} from "./_atoms";
import { PaymentActions, PaidBadge } from "./_payment";

interface HistoryBookingCardProps {
  booking: SalonBooking;
  onGenerateBill?: (id: string) => void;
}

export function HistoryBookingCard({ booking, onGenerateBill }: HistoryBookingCardProps) {
  const accent = statusAccent(booking.status);
  const isCompleted = booking.status === "completed";

  return (
    <Card className={cn("border-l-4 rounded-2xl border-border/30 shadow-soft transition-all", accent.border)}>
      <CardContent className="p-4 space-y-3">
        <CustomerHeader booking={booking} />
        <ServicesBreakdown booking={booking} />
        {booking.staff_name && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="h-3 w-3" /> {booking.staff_name}
          </p>
        )}
        <MetaStrip booking={booking} />
        <AlertsBlock booking={booking} />
        <NotesBlock booking={booking} />

        {isCompleted && (
          <>
            {booking.paid ? (
              <div className="flex items-center justify-between pt-1">
                <PaidBadge booking={booking} />
                {onGenerateBill && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg gap-1.5 h-9 text-xs font-semibold"
                    onClick={() => onGenerateBill(booking.id)}
                  >
                    <Receipt className="h-3.5 w-3.5" /> Generate Bill
                  </Button>
                )}
              </div>
            ) : (
              <PaymentActions booking={booking} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
