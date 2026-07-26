// ─────────────────────────────────────────────────────────────────────────────
// PaymentDialog — orchestrates the post-completion payment flow.
// Visual responsibility only; the state machine + API calls live in
// `usePaymentFlow`. Routes to one of four step views:
//
//   chooseMethod  → two big buttons: Cash | UPI QR (UPI disabled when no
//                   VPA is configured; banner offers a setup shortcut)
//   cashConfirm   → confirm-amount + record cash bill
//   upiPending    → QR panel + "Mark as Paid" CTA
//   ₹0 booking    → "Mark as Settled" single-button shortcut
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Banknote, Smartphone, Loader2, BadgeCheck, ArrowLeft, ExternalLink, Gift,
} from "lucide-react";
import { useBusinessProfile } from "@kshuri/api-client/hooks";
import type { SalonBooking } from "../types";
import { usePaymentFlow } from "./usePaymentFlow";
import { UpiQrPanel } from "./UpiQrPanel";

interface PaymentDialogProps {
  booking: SalonBooking;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PaymentDialog({ booking, open, onOpenChange }: PaymentDialogProps) {
  const navigate = useNavigate();
  const { data: profile } = useBusinessProfile();
  const upiConfigured = !!(profile as { upi_id?: string | null } | undefined)?.upi_id;
  const isFreeBooking = booking.total_amount <= 0;

  const flow = usePaymentFlow({
    appointmentId: booking.id,
    amount: booking.total_amount,
    onComplete: () => onOpenChange(false),
  });

  // Reset to step 1 every time the dialog re-opens so a previously-aborted
  // flow doesn't leak state into the next bill.
  useEffect(() => {
    if (open) flow.actions.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/30">
          <DialogTitle className="text-base flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-success" />
            {isFreeBooking ? "Mark as Settled" : "Collect Payment"}
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {booking.customer_name} · ₹{booking.total_amount.toLocaleString("en-IN")}
          </p>
        </DialogHeader>

        <div className="px-5 py-4">
          {flow.step === "chooseMethod" && isFreeBooking && (
            <FreeBookingStep
              isSettling={flow.isSettling}
              onSettle={flow.actions.confirmCash}
            />
          )}
          {flow.step === "chooseMethod" && !isFreeBooking && (
            <ChooseMethodStep
              isGeneratingQr={flow.isGeneratingQr}
              upiConfigured={upiConfigured}
              onCash={flow.actions.pickCash}
              onUpi={flow.actions.pickUpi}
              onSetupUpi={() => {
                onOpenChange(false);
                navigate("/settings");
              }}
            />
          )}
          {flow.step === "cashConfirm" && (
            <CashConfirmStep
              amount={booking.total_amount}
              isSettling={flow.isSettling}
              onConfirm={flow.actions.confirmCash}
              onBack={flow.actions.back}
            />
          )}
          {flow.step === "upiPending" && flow.qrPayload && (
            <UpiQrPanel
              payload={flow.qrPayload}
              isSettling={flow.isSettling}
              onMarkPaid={flow.actions.markUpiPaid}
              onBack={flow.actions.back}
            />
          )}
          {flow.step === "settling" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Recording payment…
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Step components ───────────────────────────────────────────── */

function ChooseMethodStep({
  isGeneratingQr, upiConfigured, onCash, onUpi, onSetupUpi,
}: {
  isGeneratingQr: boolean;
  upiConfigured: boolean;
  onCash: () => void;
  onUpi: () => void;
  onSetupUpi: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Choose payment method
      </p>
      <div className="grid grid-cols-2 gap-2">
        <MethodCard
          icon={Banknote}
          title="Cash"
          subtitle="Customer pays in person"
          onClick={onCash}
          disabled={isGeneratingQr}
        />
        <MethodCard
          icon={Smartphone}
          title="UPI QR"
          subtitle={upiConfigured ? "Scan with any UPI app" : "Setup required"}
          onClick={onUpi}
          loading={isGeneratingQr}
          disabled={!upiConfigured}
        />
      </div>

      {/* Setup-required banner — replaces the obscure validation toast with
          a discoverable, one-tap path to add the missing UPI ID. */}
      {!upiConfigured && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-amber-400">UPI not set up yet</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Add your salon's UPI ID once to start accepting QR payments from customers.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 rounded-lg gap-1 text-[11px] shrink-0 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            onClick={onSetupUpi}
          >
            Set up <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function MethodCard({
  icon: Icon, title, subtitle, onClick, disabled, loading,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="group flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-border/30 bg-muted/10 hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-40 disabled:pointer-events-none"
    >
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
        {loading ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
          <Icon className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold leading-none">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </button>
  );
}

/** Free / comped service — no money to collect, just a single confirmation. */
function FreeBookingStep({
  isSettling, onSettle,
}: { isSettling: boolean; onSettle: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="h-14 w-14 rounded-2xl bg-success/15 flex items-center justify-center">
          <Gift className="h-7 w-7 text-success" />
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Complimentary service
        </p>
        <p className="text-2xl font-serif font-bold text-foreground tabular-nums">₹0</p>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        No payment is due. Mark this booking as settled to keep your records clean.
      </p>
      <Button
        size="sm"
        className="w-full rounded-lg gap-1.5 h-10 text-xs font-bold bg-success hover:bg-success/90 text-success-foreground"
        onClick={onSettle}
        disabled={isSettling}
      >
        {isSettling ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Settling…</>
        ) : (
          <><BadgeCheck className="h-3.5 w-3.5" /> Mark as Settled</>
        )}
      </Button>
    </div>
  );
}

function CashConfirmStep({
  amount, isSettling, onConfirm, onBack,
}: { amount: number; isSettling: boolean; onConfirm: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="h-14 w-14 rounded-2xl bg-success/15 flex items-center justify-center">
          <Banknote className="h-7 w-7 text-success" />
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Cash to collect
        </p>
        <p className="text-3xl font-serif font-bold text-foreground tabular-nums">
          ₹{amount.toLocaleString("en-IN")}
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Confirm once you've received the cash from the customer.
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg h-10 px-3"
          onClick={onBack}
          disabled={isSettling}
          aria-label="Go back to method selection"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          className="flex-1 rounded-lg gap-1.5 h-10 text-xs font-bold bg-success hover:bg-success/90 text-success-foreground"
          onClick={onConfirm}
          disabled={isSettling}
        >
          {isSettling ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording…</>
          ) : (
            <><BadgeCheck className="h-3.5 w-3.5" /> Confirm Cash Received</>
          )}
        </Button>
      </div>
    </div>
  );
}
