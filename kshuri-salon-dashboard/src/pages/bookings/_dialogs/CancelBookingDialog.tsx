// ─────────────────────────────────────────────────────────────────────────────
// CancelBookingDialog — confirmation modal for cancelling a confirmed or
// in-progress booking. Replaces the native window.confirm so we can also
// capture an optional cancellation reason and surface backend errors in a
// toast (e.g. invalid transition for a completed booking).
//
// The cancel action is fire-and-forget from the caller's perspective: the
// dialog owns its own mutation state and closes itself on success.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppointmentAction } from "@kshuri/api-client/hooks";
import type { SalonBooking } from "../types";
import { extractActionError } from "./extractActionError";

interface Props {
  booking: SalonBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelBookingDialog({ booking, open, onOpenChange }: Props) {
  const [reason, setReason] = useState("");
  const action = useAppointmentAction();

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const handleConfirm = async () => {
    if (!booking) return;
    try {
      await action.mutateAsync({
        appointmentId: booking.id,
        action: "cancel",
        extra: reason.trim() ? { cancellation_reason: reason.trim() } : undefined,
      });
      toast.success("Booking cancelled");
      onOpenChange(false);
    } catch (err) {
      toast.error(extractActionError(err, "Cancel failed"));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">Cancel this booking?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            {booking
              ? `${booking.customer_name} — ${booking.scheduled_label}. The customer will be notified.`
              : "The customer will be notified."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 mt-2">
          <label htmlFor="cancel-reason" className="text-[12px] font-semibold">
            Reason <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 500))}
            placeholder="e.g. customer requested, double-booked, staff unavailable…"
            rows={3}
            className="text-xs"
          />
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2 mt-3">
          <AlertDialogCancel disabled={action.isPending} className="h-10 rounded-xl">
            Keep booking
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={action.isPending}
            className="h-10 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {action.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Cancelling…
              </>
            ) : (
              "Cancel booking"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
