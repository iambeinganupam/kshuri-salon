// ─────────────────────────────────────────────────────────────────────────────
// UpiQrPanel — renders the server-generated SVG QR + payee meta + the
// "Mark as Paid" CTA. The SVG is wrapped as a `data:` URI so it embeds in
// an `<img>` (no inline-SVG injection / DOMPurify dance needed).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { Loader2, Smartphone, BadgeCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UpiPaymentRequest } from "@kshuri/api-client/types";

interface UpiQrPanelProps {
  payload: UpiPaymentRequest;
  isSettling: boolean;
  onMarkPaid: () => void;
  onBack: () => void;
}

export function UpiQrPanel({ payload, isSettling, onMarkPaid, onBack }: UpiQrPanelProps) {
  // Inline data URI — no external request, no XSS surface (the SVG comes
  // from our own backend and contains no scripts).
  const qrSrc = useMemo(
    () => `data:image/svg+xml;utf8,${encodeURIComponent(payload.qr_svg)}`,
    [payload.qr_svg],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="bg-white p-4 rounded-2xl">
          <img
            src={qrSrc}
            alt={`UPI QR for ${payload.payee_name}`}
            className="h-56 w-56"
            // QR is a generated graphic, not a content image — give the
            // browser a head start on layout.
            width={224}
            height={224}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/30 bg-muted/20 p-3 space-y-1.5 text-xs">
        <Row label="Pay to" value={payload.payee_name} />
        <Row label="UPI ID" value={payload.vpa} mono />
        <Row label="Amount" value={`₹${payload.amount.toLocaleString("en-IN")}`} bold />
      </div>

      <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
        <Smartphone className="h-3 w-3" />
        Ask the customer to scan with any UPI app (PhonePe, GPay, Paytm, BHIM)
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
          onClick={onMarkPaid}
          disabled={isSettling}
        >
          {isSettling ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording…</>
          ) : (
            <><BadgeCheck className="h-3.5 w-3.5" /> Mark as Paid</>
          )}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={[
        "truncate text-right",
        mono ? "font-mono" : "",
        bold ? "font-bold text-foreground" : "font-medium",
      ].join(" ")}>
        {value}
      </span>
    </div>
  );
}
