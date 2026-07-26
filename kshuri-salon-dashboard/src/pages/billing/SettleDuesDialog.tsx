// ─────────────────────────────────────────────────────────────────────────────
// SettleDuesDialog — Phase 1 settlement flow.
//
// The vendor pays the platform via UPI to the platform's collection VPA
// (configured server-side via env.PLATFORM_COLLECTION_VPA). Once the
// transfer is done, the vendor records the settlement here with the UPI
// reference number, which appends a negative-amount entry to the dues
// ledger. Future iterations will replace this manual step with a webhook.
//
// The form pre-fills `amount` with the current outstanding so the most
// common path (full settlement) is one click after entering the UPI ref.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Smartphone, Copy, Check } from "lucide-react";
import { useRecordSettlement } from "@kshuri/api-client/hooks";
import type { VendorDues } from "@kshuri/api-client/types";

interface SettleDuesDialogProps {
  dues: VendorDues;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SettleDuesDialog({ dues, open, onOpenChange }: SettleDuesDialogProps) {
  const recordSettlement = useRecordSettlement();
  const [amount, setAmount] = useState(dues.outstanding.toFixed(2));
  const [externalRef, setExternalRef] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset on each open so a partially-typed value from a previous session
  // doesn't surprise the user.
  useEffect(() => {
    if (open) {
      setAmount(dues.outstanding.toFixed(2));
      setExternalRef("");
      setCopied(false);
    }
  }, [open, dues.outstanding]);

  const onSubmit = () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amt > dues.outstanding + 0.01) {
      toast.error(`Amount can't exceed outstanding ₹${dues.outstanding.toLocaleString("en-IN")}`);
      return;
    }
    if (!externalRef.trim()) {
      toast.error("Enter the UPI reference / UTR from your transfer");
      return;
    }
    recordSettlement.mutate(
      { amount: amt, external_ref: externalRef.trim() },
      {
        onSuccess: () => {
          toast.success(`Settlement of ₹${amt.toLocaleString("en-IN")} recorded`);
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const apiMsg = (err as {
            response?: { data?: { error?: { message?: string } } };
          })?.response?.data?.error?.message;
          toast.error(apiMsg ?? "Couldn't record settlement");
        },
      },
    );
  };

  const copyVpa = async () => {
    if (!dues.platform_collection_vpa) return;
    try {
      await navigator.clipboard.writeText(dues.platform_collection_vpa);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — copy manually");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/30">
          <DialogTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            Settle dues to platform
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Pay the amount via UPI, then enter the reference number to clear your balance.
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Step 1: where to pay */}
          <div className="rounded-xl border border-border/30 bg-muted/20 p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Step 1 — Pay to
            </p>
            {dues.platform_collection_vpa ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{dues.platform_collection_name}</p>
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {dues.platform_collection_vpa}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 rounded-lg gap-1 text-[11px] shrink-0"
                  onClick={copyVpa}
                >
                  {copied
                    ? <><Check className="h-3 w-3 text-success" /> Copied</>
                    : <><Copy className="h-3 w-3" /> Copy</>}
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-amber-400">
                Platform UPI not configured yet — contact support to settle.
              </p>
            )}
          </div>

          {/* Step 2: record */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Step 2 — Record what you paid
            </p>
            <div>
              <label className="text-[11px] font-semibold mb-1 block">Amount (₹)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                className="h-10 rounded-lg text-sm tabular-nums"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Outstanding: ₹{dues.outstanding.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1 block">UPI Reference / UTR</label>
              <Input
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                placeholder="e.g. 412345678901"
                className="h-10 rounded-lg text-sm font-mono"
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
          </div>

          <Button
            size="sm"
            className="w-full h-10 rounded-lg gap-1.5 text-xs font-bold"
            onClick={onSubmit}
            disabled={recordSettlement.isPending || !dues.platform_collection_vpa}
          >
            {recordSettlement.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording…</>
            ) : (
              "Record settlement"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
