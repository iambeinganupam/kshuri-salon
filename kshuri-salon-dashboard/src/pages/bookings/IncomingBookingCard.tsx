// ─────────────────────────────────────────────────────────────────────────────
// IncomingBookingCard — pending appointment awaiting salon-side confirmation.
// Surfaces customer + chips + service breakdown + meta + notes + actions.
// ─────────────────────────────────────────────────────────────────────────────

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, IndianRupee, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalonBooking } from "./types";
import { statusAccent } from "./types";
import {
  CustomerHeader, ServicesBreakdown, MetaStrip, NotesBlock, AlertsBlock,
} from "./_atoms";

interface IncomingBookingCardProps {
  booking: SalonBooking;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isMutating?: boolean;
}

export function IncomingBookingCard({ booking, onAccept, onDecline, isMutating }: IncomingBookingCardProps) {
  const accent = statusAccent(booking.status);

  return (
    <Card className={cn("border-l-4 rounded-2xl border-border/30 shadow-soft hover:shadow-md transition-all", accent.border)}>
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

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 rounded-lg gap-1.5 h-10 text-xs font-bold bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => onAccept(booking.id)}
            disabled={isMutating}
          >
            <UserCheck className="h-3.5 w-3.5" /> Accept &amp; Assign
            <IndianRupee className="h-3 w-3 ml-1 opacity-70" />
            {booking.total_amount.toLocaleString("en-IN")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-10 px-3 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => onDecline(booking.id)}
            disabled={isMutating}
            aria-label="Decline booking"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
