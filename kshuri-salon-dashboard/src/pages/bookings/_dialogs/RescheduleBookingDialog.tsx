// ─────────────────────────────────────────────────────────────────────────────
// RescheduleBookingDialog — pick a new date + slot for a confirmed booking.
//
// Reuses the same slot grid the Create flow uses (`useAvailableSlots`) so
// the salon never picks a time outside working hours, in the past, or
// overlapping another booking. Submit calls `useRescheduleAppointment`
// which invalidates the appointments cache on success.
//
// The original booking duration is preserved end-to-end: the dialog only
// asks for a new *start*, and computes the new *end* by adding the booking's
// existing duration. This keeps line-item totals stable and matches what
// the backend already validates.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useAvailableSlots, useRescheduleAppointment,
} from "@kshuri/api-client/hooks";
import type { TimeSlot } from "@kshuri/api-client/types";
import { useAuth } from "@/lib/auth-context";
import type { SalonBooking } from "../types";
import { extractActionError } from "./extractActionError";

interface Props {
  booking: SalonBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleBookingDialog({ booking, open, onOpenChange }: Props) {
  const { user, activeLocationId } = useAuth();
  const vendorId = activeLocationId ?? user?.profile_id ?? null;

  const initialDate = useMemo(() => {
    if (!booking?.start_time) return new Date();
    const d = new Date(booking.start_time);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [booking?.start_time]);

  const [date, setDate] = useState<Date>(initialDate);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);

  const serviceIds = useMemo(
    () => (booking?.services ?? [])
      .map((s) => s.id)
      .filter((id): id is string => Boolean(id)),
    [booking],
  );

  const slotsQuery = useAvailableSlots(
    {
      vendor_id: vendorId ?? "",
      vendor_type: "salon_location",
      service_ids: serviceIds,
      date: format(date, "yyyy-MM-dd"),
    },
    open && Boolean(vendorId && serviceIds.length > 0),
  );

  const reschedule = useRescheduleAppointment();

  const slots: TimeSlot[] = slotsQuery.data?.slots ?? [];
  const isClosedDay = slotsQuery.data?.is_open === false;
  const durationMs = (booking?.duration_minutes ?? 0) * 60_000;

  // Reset slot selection when the dialog opens or the date changes so the
  // user can never submit a stale pick against a different day's grid.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedStart(null);
      setDate(initialDate);
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!booking || !selectedStart) return;
    const startMs = new Date(selectedStart).getTime();
    if (!Number.isFinite(startMs) || durationMs <= 0) {
      toast.error("Selected slot is invalid — please pick a time again.");
      return;
    }
    const newEnd = new Date(startMs + durationMs).toISOString();
    try {
      await reschedule.mutateAsync({
        appointmentId: booking.id,
        newSlotStart: selectedStart,
        newSlotEnd: newEnd,
      });
      toast.success("Booking rescheduled");
      handleOpenChange(false);
    } catch (err) {
      toast.error(extractActionError(err, "Reschedule failed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="text-base">Reschedule booking</DialogTitle>
            <DialogDescription className="text-xs">
              {booking
                ? `${booking.customer_name} — ${booking.scheduled_label}`
                : ""}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-2 space-y-4">
          <div>
            <label className="text-[12px] font-semibold mb-1.5 block">New date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-10 rounded-xl text-xs"
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {format(date, "dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setSelectedStart(null);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-[12px] font-semibold mb-1.5 block">New time</label>
            {!vendorId ? (
              <p className="text-[11px] text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/25">
                Pick an active location to load slots.
              </p>
            ) : slotsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/25">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching available times…
              </div>
            ) : isClosedDay ? (
              <p className="text-[11px] text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/25">
                Closed on this day. Pick another date.
              </p>
            ) : slots.length === 0 ? (
              <p className="text-[11px] text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/25">
                No available slots for this date.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                {slots.map((slot) => {
                  const label = format(new Date(slot.start), "h:mm a");
                  const isPicked = selectedStart === slot.start;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedStart(slot.start)}
                      className={cn(
                        "p-2 rounded-xl border text-[11px] font-medium transition-all text-center",
                        isPicked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/30 hover:border-border/50",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-2 gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-xl"
            onClick={() => handleOpenChange(false)}
            disabled={reschedule.isPending}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl gap-1.5"
            onClick={handleSubmit}
            disabled={!selectedStart || reschedule.isPending}
          >
            {reschedule.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rescheduling…
              </>
            ) : (
              "Confirm reschedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
