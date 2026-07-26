// ─────────────────────────────────────────────────────────────────────────────
// AcceptedBookingCard — booking confirmed, not yet started.
//
//   • Online customers (Estylr / Online / App) MUST enter their persistent
//     6-digit customer service code to start. This is the Rapido-style
//     identity gate the backend enforces against customer_profiles.service_code.
//   • Walk-ins can start without a code (the salon already accepted them
//     in person, and the appointment has no linked customer profile).
//
// Reschedule / Cancel are exposed as secondary actions and open their own
// modals to avoid native window.confirm and ensure validation errors surface
// as proper toasts.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlayCircle, KeyRound, XCircle, CalendarClock, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalonBooking } from "./types";
import { statusAccent } from "./types";
import {
  CustomerHeader, ServicesBreakdown, MetaStrip, NotesBlock, AlertsBlock,
} from "./_atoms";

interface AcceptedBookingCardProps {
  booking: SalonBooking;
  /** `otp` is required when `booking.is_online`, optional otherwise. */
  onStart: (id: string, otp?: string) => void;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
  isMutating?: boolean;
}

export function AcceptedBookingCard({
  booking, onStart, onCancel, onReschedule, isMutating,
}: AcceptedBookingCardProps) {
  const accent = statusAccent(booking.status);
  const [otp, setOtp] = useState("");
  const otpRequired = booking.is_online;
  // Backend requires an exact 6-digit code; allowing 4–5 here would just
  // round-trip into a "Service code required to start." validation error.
  const canStart = otpRequired ? otp.length === 6 : true;

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

        {/* OTP gate */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              placeholder={otpRequired ? "Enter 6-digit customer service code" : "Service code (optional)"}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              className="h-10 rounded-lg text-xs"
              aria-label="Customer service code"
            />
          </div>
          <Button
            size="sm"
            className="w-full rounded-lg gap-1.5 h-10 text-xs font-bold bg-amber-500 hover:bg-amber-500/90 text-black"
            onClick={() => onStart(booking.id, otp.trim() || undefined)}
            disabled={isMutating || !canStart}
          >
            <PlayCircle className="h-3.5 w-3.5" />
            {otpRequired ? "Enter code to Start" : "Start Service"}
          </Button>
          {otpRequired && (
            <p className="text-[10px] text-muted-foreground text-center">
              Ask the customer for their 6-digit service code (visible in their Estylr profile).
            </p>
          )}
        </div>

        {/* Secondary actions */}
        {(onReschedule || onCancel) && (
          <div className="flex gap-2 pt-1">
            {onReschedule && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg gap-1.5 h-9 text-xs"
                onClick={() => onReschedule(booking.id)}
                disabled={isMutating}
              >
                <CalendarClock className="h-3.5 w-3.5" /> Reschedule
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg gap-1.5 h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => onCancel(booking.id)}
                disabled={isMutating}
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
