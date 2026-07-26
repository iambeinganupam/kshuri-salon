// ─────────────────────────────────────────────────────────────────────────────
// OutstandingDuesCard — surfaces the vendor's unpaid commission balance
// at the top of the Billing page. Driven by `useVendorDues()`; opens a
// `SettleDuesDialog` for the actual payment flow.
//
// Visual states:
//   • outstanding == 0   → green "all settled" banner (no CTA)
//   • outstanding > 0    → amber/red card with running total + Settle Now
//   • is_blocked === true → destructive treatment + lockout warning
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, BadgeCheck, Receipt, Loader2,
} from "lucide-react";
import { useVendorDues } from "@kshuri/api-client/hooks";
import { cn } from "@/lib/utils";
import { SettleDuesDialog } from "./SettleDuesDialog";

export function OutstandingDuesCard() {
  const { data: dues, isLoading } = useVendorDues();
  const [settling, setSettling] = useState(false);

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Loading outstanding balance…</p>
        </CardContent>
      </Card>
    );
  }
  if (!dues) return null;

  const settled = dues.outstanding <= 0;
  const blocked = dues.is_blocked;

  return (
    <>
      <Card
        className={cn(
          "border transition-colors",
          settled && "border-success/30 bg-success/[0.04]",
          !settled && !blocked && "border-amber-500/30 bg-amber-500/[0.05]",
          blocked && "border-destructive/40 bg-destructive/[0.06]",
        )}
      >
        <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                settled && "bg-success/15",
                !settled && !blocked && "bg-amber-500/15",
                blocked && "bg-destructive/15",
              )}
            >
              {settled
                ? <BadgeCheck className="h-5 w-5 text-success" />
                : blocked
                  ? <AlertTriangle className="h-5 w-5 text-destructive" />
                  : <Receipt className="h-5 w-5 text-amber-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Outstanding to platform
              </p>
              <p className={cn(
                "text-xl sm:text-2xl font-serif font-bold leading-tight tabular-nums mt-0.5",
                settled && "text-success",
                !settled && !blocked && "text-amber-400",
                blocked && "text-destructive",
              )}>
                ₹{dues.outstanding.toLocaleString("en-IN")}
              </p>
              {!settled && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Cap: ₹{dues.block_threshold.toLocaleString("en-IN")} ·{" "}
                  {blocked
                    ? "New bookings are blocked until you settle"
                    : `${(dues.block_threshold - dues.outstanding).toLocaleString("en-IN")} headroom left`}
                </p>
              )}
              {settled && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All commission settled — keep accepting bookings.
                </p>
              )}
            </div>
          </div>

          {!settled && (
            <Button
              size="sm"
              className={cn(
                "rounded-xl h-10 gap-1.5 shrink-0",
                blocked
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-amber-500 hover:bg-amber-500/90 text-black",
              )}
              onClick={() => setSettling(true)}
            >
              Settle Now
            </Button>
          )}
        </CardContent>
      </Card>

      <SettleDuesDialog
        dues={dues}
        open={settling}
        onOpenChange={setSettling}
      />
    </>
  );
}
