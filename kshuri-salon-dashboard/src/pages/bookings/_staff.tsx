/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
// ─────────────────────────────────────────────────────────────────────────────
// Staff helpers — small, focused components used by the salon /bookings page:
//
//   • StaffStatusBar  — dashboard-style strip across the top showing the
//                       full roster + how many are free right now.
//   • AssignStaffDialog — opens from the IncomingBookingCard's
//                         "Accept & Assign Staff" CTA; lets the user pick a
//                         staff member before confirming the booking.
//
// Until the backend exposes a per-appointment `staff_member_id` action, the
// staff-assignment side is presentational — the UI captures the choice and
// passes it back to the page so the `confirm` action can be sent to the
// API while the chosen staff name is surfaced via toast / metadata.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffList } from "@kshuri/api-client/hooks";
import type { SalonBooking } from "./types";

/* ─── Shared staff view-model ───────────────────────────────────── */
export interface StaffViewModel {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  is_active: boolean;
  is_verified: boolean;
}

function normaliseStaff(raw: any): StaffViewModel {
  const first = raw?.user?.first_name ?? raw?.first_name ?? "";
  const last = raw?.user?.last_name ?? raw?.last_name ?? "";
  const name = `${first} ${last}`.trim()
    || raw?.email?.split?.("@")[0]
    || "Staff";
  return {
    id: String(raw?.id ?? ""),
    name,
    role: raw?.role ?? null,
    photo_url: raw?.user?.avatar_url ?? raw?.avatar_url ?? null,
    is_active: raw?.is_active !== false,
    is_verified: !!raw?.is_active,
  };
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

/* ─── Public hook: fetch staff list as view-models ──────────────── */
export function useStaffViewModels(): {
  staff: StaffViewModel[];
  isLoading: boolean;
} {
  const result = useStaffList();
  const staff = useMemo(() => {
    const data: any = result.data;
    const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return list.map(normaliseStaff).filter((s) => s.is_active);
  }, [result.data]);
  return { staff, isLoading: result.isLoading };
}

/* ─── StaffStatusBar — top-of-page roster strip ─────────────────── */
export function StaffStatusBar() {
  const { staff, isLoading } = useStaffViewModels();
  if (isLoading || staff.length === 0) return null;

  const freeCount = staff.length; // No live "busy" feed yet — all listed staff are presented as available.

  return (
    <Card className="border-border/30 rounded-xl">
      <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Staff Status</p>
            <p className="text-xs text-foreground">
              <span className="font-bold">{freeCount}</span>
              <span className="text-muted-foreground"> /{staff.length} available</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {staff.slice(0, 6).map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border border-border/30">
                <AvatarImage src={s.photo_url ?? undefined} />
                <AvatarFallback className="text-[10px] font-bold bg-muted">
                  {initialsOf(s.name)}
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold truncate max-w-[100px]">{s.name}</p>
                <p className="text-[9px] text-success font-medium">Free</p>
              </div>
            </div>
          ))}
          {staff.length > 6 && (
            <Badge variant="outline" className="text-[10px]">+{staff.length - 6} more</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── AssignStaffDialog — Accept-flow modal ─────────────────────── */
interface AssignStaffDialogProps {
  booking: SalonBooking | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called when the user confirms. `staffName` is undefined if the user
   *  chose "Accept without assignment". */
  onConfirm: (staffName: string | undefined) => void;
  isMutating?: boolean;
}

export function AssignStaffDialog({
  booking, open, onOpenChange, onConfirm, isMutating,
}: AssignStaffDialogProps) {
  const { staff, isLoading } = useStaffViewModels();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!booking) return null;

  const selected = staff.find((s) => s.id === selectedId) ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSelectedId(null);
      }}
    >
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="px-5 pt-5 pb-3 border-b border-border/30">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Accept & Assign Staff
            </DialogTitle>
          </DialogHeader>

          {/* Booking summary */}
          <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border/25 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{booking.customer_name}</p>
              <Badge variant="outline" className="text-[9px] rounded-md">
                {booking.scheduled_label}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {booking.services.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] gap-1 font-normal">
                  {s.name} <span className="text-muted-foreground">{s.duration_minutes}m</span>
                </Badge>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {booking.duration_minutes} min total · ₹{booking.total_amount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Staff list */}
        <div className="px-5 py-3 max-h-[320px] overflow-y-auto space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Select staff member
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading staff…</p>
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No active staff yet. Add staff under <span className="font-semibold">Staff</span> first, or accept without assignment.
            </p>
          ) : (
            staff.map((s) => {
              const isSelected = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "border-border/25 bg-background hover:bg-muted/20 hover:border-border/50",
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={s.photo_url ?? undefined} />
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {initialsOf(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold truncate">{s.name}</p>
                      {s.is_verified && (
                        <Badge className="text-[8px] bg-success/15 text-success border-success/20 rounded-full gap-0.5">
                          <ShieldCheck className="h-2.5 w-2.5" /> Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground capitalize">{s.role ?? "Staff"}</p>
                  </div>
                  <Badge className="shrink-0 text-[9px] bg-success/10 text-success border-success/20 rounded-full">
                    Free
                  </Badge>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/30 bg-muted/5">
          {selected && (
            <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-primary/5 border border-primary/15">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[11px] text-foreground">
                <span className="font-semibold">{selected.name}</span> will be assigned to{" "}
                {booking.services.length} service{booking.services.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10 rounded-xl text-xs"
              onClick={() => onConfirm(undefined)}
              disabled={isMutating}
            >
              Accept without assignment
            </Button>
            <Button
              className="flex-1 h-10 rounded-xl text-xs gap-1.5"
              disabled={!selected || isMutating}
              onClick={() => onConfirm(selected?.name)}
            >
              <UserCheck className="h-3.5 w-3.5" /> Assign & Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
