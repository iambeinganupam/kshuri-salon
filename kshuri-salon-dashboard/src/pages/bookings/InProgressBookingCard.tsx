// ─────────────────────────────────────────────────────────────────────────────
// InProgressBookingCard — service is currently running.
// Surfaces a pulsing "in progress…" indicator and a single primary action
// to mark the booking complete. Cancel stays available for emergencies.
// ─────────────────────────────────────────────────────────────────────────────

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, XCircle, Loader2, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalonBooking } from "./types";
import { statusAccent } from "./types";
import {
  CustomerHeader, ServicesBreakdown, MetaStrip, NotesBlock, AlertsBlock,
} from "./_atoms";

interface InProgressBookingCardProps {
  booking: SalonBooking;
  onComplete: (id: string) => void;
  onCancel?: (id: string) => void;
  isMutating?: boolean;
}

export function InProgressBookingCard({
  booking, onComplete, onCancel, isMutating,
}: InProgressBookingCardProps) {
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

        <div className="flex items-center gap-2 pt-1">
          <p className="text-[11px] text-amber-400 flex items-center gap-1.5 font-medium flex-1 min-w-0">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span className="truncate">In progress…</span>
          </p>
          <Button
            size="sm"
            className="rounded-lg gap-1.5 h-10 text-xs font-bold bg-success hover:bg-success/90 text-success-foreground px-4"
            onClick={() => onComplete(booking.id)}
            disabled={isMutating}
          >
            <CheckCircle className="h-3.5 w-3.5" /> Complete
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-10 px-3 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => onCancel(booking.id)}
              disabled={isMutating}
              aria-label="Cancel booking"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
