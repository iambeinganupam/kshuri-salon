// ─────────────────────────────────────────────────────────────────────────────
// _atoms — small visual building blocks shared by the three booking-card
// flavours. Keeping them in one place enforces a consistent presentation
// for the same backend field across Incoming / Active / History views.
// ─────────────────────────────────────────────────────────────────────────────

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Phone, Scissors, CreditCard, User, Hash, Banknote,
  Smartphone, Crown, Sparkles, History as HistoryIcon, Star,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalonBooking } from "./types";
import { statusAccent } from "./types";

/* ── Status pill ─────────────────────────────────────────────── */
export function StatusPill({ booking }: { booking: SalonBooking }) {
  const accent = statusAccent(booking.status);
  return (
    <Badge className={cn("text-[9px] font-bold uppercase tracking-wider border", accent.badge)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full mr-1 inline-block",
          accent.dot,
          booking.status === "in_progress" && "animate-pulse",
        )}
      />
      {booking.statusLabel}
    </Badge>
  );
}

/* ── Booking-type chip ──────────────────────────────────────── */
export function BookingTypeChip({ booking }: { booking: SalonBooking }) {
  if (!booking.booking_type_label) return null;
  return (
    <Badge variant="outline" className="text-[9px] font-medium gap-1">
      {booking.booking_type === "walkin" || booking.booking_type === "walk_in" ? (
        <User className="h-2.5 w-2.5" />
      ) : (
        <Smartphone className="h-2.5 w-2.5" />
      )}
      {booking.booking_type_label}
    </Badge>
  );
}

/* ── Customer-type chip (Repeat / VIP / etc.) ───────────────── */
export function CustomerTypeChip({ booking }: { booking: SalonBooking }) {
  if (!booking.customer_type_label) return null;
  const isVip = booking.customer_type === "vip" || booking.customer_type === "loyal";
  const isRepeat =
    booking.customer_type === "repeat" || booking.customer_type === "returning";
  return (
    <Badge
      className={cn(
        "text-[9px] font-bold border-0 gap-0.5",
        isVip && "bg-amber-500/15 text-amber-400",
        isRepeat && "bg-primary/15 text-primary",
        !isVip && !isRepeat && "bg-muted text-muted-foreground",
      )}
    >
      {isVip ? <Crown className="h-2.5 w-2.5" /> : isRepeat ? <Sparkles className="h-2.5 w-2.5" /> : null}
      {booking.customer_type_label}
    </Badge>
  );
}

/* ── Visit-count chip (e.g. "2 visits") ───────────────────── */
export function VisitCountChip({ booking }: { booking: SalonBooking }) {
  if (booking.visit_count == null || booking.visit_count <= 0) return null;
  const label = booking.visit_count === 1 ? "1 visit" : `${booking.visit_count} visits`;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <Star className="h-2.5 w-2.5 fill-current text-amber-400/80" />
      {label}
    </span>
  );
}

/* ── Customer header row (avatar + name + chips + scheduled time) ───── */
interface CustomerHeaderProps {
  booking: SalonBooking;
}

export function CustomerHeader({ booking }: CustomerHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
            {booking.customer_initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold truncate">{booking.customer_name}</p>
            <StatusPill booking={booking} />
            <CustomerTypeChip booking={booking} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {booking.scheduled_label}
            </span>
            <VisitCountChip booking={booking} />
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <p className="text-lg font-serif font-bold leading-none tabular-nums">
          ₹{booking.total_amount.toLocaleString("en-IN")}
        </p>
        <BookingTypeChip booking={booking} />
      </div>
    </div>
  );
}

/* ── Itemised service list ─────────────────────────────────── */
export function ServicesBreakdown({ booking }: { booking: SalonBooking }) {
  return (
    <div className="bg-muted/20 rounded-xl border border-border/15 overflow-hidden">
      {booking.services.map((s, i) => (
        <div
          key={`${s.id ?? s.name}-${i}`}
          className={cn(
            "flex items-center justify-between px-3 py-2 text-xs",
            i < booking.services.length - 1 && "border-b border-border/10",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
            <span className="font-medium truncate">{s.name}</span>
            <span className="text-[10px] text-muted-foreground/60 shrink-0">{s.duration_minutes}min</span>
          </div>
          <span className="font-bold tabular-nums shrink-0 ml-2">
            ₹{Number(s.price).toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Compact service-tag list ──────────────────────────────── */
export function ServicesChips({ booking }: { booking: SalonBooking }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {booking.services.map((s, i) => (
        <Badge key={`${s.id ?? s.name}-${i}`} variant="secondary" className="text-[10px] gap-1 font-normal">
          {s.name} <span className="text-muted-foreground">{s.duration_minutes}min</span>
        </Badge>
      ))}
    </div>
  );
}

/* ── Meta strip — duration / staff / phone / payment / id / age ── */
export function MetaStrip({ booking }: { booking: SalonBooking }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <Scissors className="h-3 w-3" />
        {booking.duration_minutes} min
      </span>
      {booking.staff_name && (
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {booking.staff_name}
        </span>
      )}
      {booking.customer_phone && (
        <a
          href={`tel:${booking.customer_phone}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Phone className="h-3 w-3" />
          {booking.customer_phone}
        </a>
      )}
      {booking.payment_status && (
        <span className="flex items-center gap-1">
          {booking.paid ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
          {booking.payment_status_label}
        </span>
      )}
      {booking.short_id && (
        <span className="flex items-center gap-1 font-mono">
          <Hash className="h-3 w-3" />
          {booking.short_id}
        </span>
      )}
      {booking.created_label && (
        <span className="flex items-center gap-1">
          <HistoryIcon className="h-3 w-3" />
          {booking.created_label}
        </span>
      )}
    </div>
  );
}

/* ── Notes block ───────────────────────────────────────────── */
export function NotesBlock({ booking }: { booking: SalonBooking }) {
  if (!booking.notes) return null;
  return (
    <p className="text-[11px] text-amber-400/90 bg-amber-500/8 rounded-lg px-2.5 py-1.5 italic">
      📝 {booking.notes}
    </p>
  );
}

/* ── Alerts block — health/safety call-outs (allergies, sensitivities) ─── */
export function AlertsBlock({ booking }: { booking: SalonBooking }) {
  if (booking.alerts.length === 0) return null;
  return (
    <div className="space-y-1">
      {booking.alerts.map((alert, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 text-[11px] text-destructive bg-destructive/10 border border-destructive/25 rounded-lg px-2.5 py-1.5 font-medium"
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>Alert: {alert}</span>
        </div>
      ))}
    </div>
  );
}
