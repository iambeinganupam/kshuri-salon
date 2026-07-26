// ─────────────────────────────────────────────────────────────────────────────
// Step3Schedule — date picker, available slot grid, and optional staff
// assignment. Live data is fetched per-date via `useAvailableSlots` against
// the salon's vendor_id (location). Staff comes from `useStaffViewModels`.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  CalendarIcon, Check, Loader2, Sparkles, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAvailableSlots } from "@kshuri/api-client/hooks";
import type { TimeSlot } from "@kshuri/api-client/types";
import { useStaffViewModels } from "../_staff";
import { BookingSummary } from "./BookingSummary";
import type { CreateBookingForm, SelectedSlot } from "./useCreateBookingForm";
import { usePresentTime } from "./usePresentTime";
import { gateSlot, SLOT_GATE_MESSAGE } from "./slotGate";

interface Props {
  form: CreateBookingForm;
  /** Salon's vendor (location) id — required for the slots query */
  vendorId: string | null;
}

export function Step3Schedule({ form, vendorId }: Props) {
  const { state, derived, actions } = form;
  const { selectedServices, totalDuration } = derived;
  const serviceIds = useMemo(
    () => selectedServices.map((s) => s.id).filter((id): id is string => !!id),
    [selectedServices],
  );

  // Slot fetch sends every selected service so the backend can sum the
  // total duration and only return slots that fit the whole booking inside
  // the day's working window. Disabled until we have a vendor + at least
  // one service so React Query doesn't fire empty requests.
  const slotsQuery = useAvailableSlots(
    {
      vendor_id: vendorId ?? "",
      vendor_type: "salon_location",
      service_ids: serviceIds,
      date: format(state.date, "yyyy-MM-dd"),
    },
    Boolean(vendorId && serviceIds.length > 0),
  );

  const slots: TimeSlot[] = slotsQuery.data?.slots ?? [];
  const isClosedDay = slotsQuery.data?.is_open === false;

  const { staff, isLoading: staffLoading } = useStaffViewModels();
  const freeStaffCount = staff.length;

  // `nowMs` ticks via usePresentTime so the grid disables slots in real
  // time even if the user sits on the modal. `gateSlot` is the single
  // source of truth shared with the submit guard.
  const nowMs = usePresentTime();
  const formattedSlots = useMemo(
    () => slots.map((s) => {
      const gate = gateSlot(s, nowMs);
      return {
        ...s,
        label: format(new Date(s.start), "h:mm a"),
        bookable: gate.bookable,
        gateReason: gate.reason,
      };
    }),
    [slots, nowMs],
  );

  // If the user already picked a slot and the clock walked past it, drop
  // the selection so the Create button can't fire on a stale value.
  useEffect(() => {
    const picked = state.selectedSlot;
    if (!picked) return;
    if (new Date(picked.start).getTime() <= nowMs) {
      actions.update("selectedSlot", null);
      toast.info("Selected slot has passed — pick a later time");
    }
  }, [nowMs, state.selectedSlot, actions]);

  const onPickSlot = (slot: typeof formattedSlots[number]) => {
    if (!slot.bookable) return;
    const next: SelectedSlot = {
      start: slot.start,
      end: slot.end,
      label: slot.label,
    };
    actions.update("selectedSlot", next);
  };

  return (
    <div className="space-y-4">
      {/* Date */}
      <div>
        <label className="text-[12px] font-semibold mb-1.5 block">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal h-10 rounded-xl text-xs"
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {format(state.date, "dd MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={state.date}
              onSelect={actions.setDate}
              initialFocus
              className="p-3 pointer-events-auto"
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Slots */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-semibold">Time Slot</label>
          <OpenHoursLabel
            openTime={slotsQuery.data?.open_time ?? null}
            closeTime={slotsQuery.data?.close_time ?? null}
          />
        </div>
        {slotsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/25">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching available times…
          </div>
        ) : isClosedDay ? (
          <p className="text-[11px] text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/25">
            Closed on this day. Pick another date or update working hours in Settings.
          </p>
        ) : formattedSlots.length === 0 ? (
          <p className="text-[11px] text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/25">
            No slots returned. Configure working hours in Settings to enable bookings.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {formattedSlots.map((slot) => {
                const isPicked = state.selectedSlot?.start === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={!slot.bookable}
                    title={slot.bookable ? undefined : SLOT_GATE_MESSAGE[slot.gateReason]}
                    onClick={() => onPickSlot(slot)}
                    className={cn(
                      "p-2 rounded-xl border text-[11px] font-medium transition-all text-center",
                      !slot.bookable
                        ? "opacity-40 line-through cursor-not-allowed border-border/20 text-muted-foreground"
                        : isPicked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/30 hover:border-border/50",
                    )}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
            <LastSlotHint
              lastSlotStart={formattedSlots[formattedSlots.length - 1]?.start ?? null}
              totalDuration={totalDuration}
              closeTime={slotsQuery.data?.close_time ?? null}
            />
          </>
        )}
      </div>

      {/* Staff (optional) */}
      <div>
        <label className="text-[12px] font-semibold mb-1.5 block flex items-center gap-1.5">
          Assign Staff
          <span className="text-muted-foreground font-normal">
            ({freeStaffCount} available)
          </span>
        </label>
        {staffLoading ? (
          <p className="text-[11px] text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/25">
            Loading staff…
          </p>
        ) : staff.length === 0 ? (
          <p className="text-[11px] text-muted-foreground p-3 rounded-xl bg-muted/20 border border-border/25">
            No active staff yet — add staff from the Staff page or accept without assignment.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[170px] overflow-y-auto">
            {staff.map((s) => {
              const isPicked = state.selectedStaffId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    actions.update("selectedStaffId", isPicked ? null : s.id)
                  }
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left text-xs",
                    isPicked
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/25 hover:border-border/40",
                  )}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={s.photo_url ?? undefined} />
                    <AvatarFallback className="rounded-lg text-[10px]">
                      {s.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[12px] truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {s.role ?? "Staff"}
                    </p>
                  </div>
                  <Badge className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-full">
                    Free
                  </Badge>
                  {isPicked && (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="cb-notes" className="text-[12px] font-semibold mb-1.5 block">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="cb-notes"
          value={state.notes}
          onChange={(e) => actions.update("notes", e.target.value.slice(0, 500))}
          placeholder="Allergies, preferences, special requests…"
          rows={2}
          className="w-full text-xs rounded-xl border border-border/30 bg-background p-2.5 resize-none focus:outline-none focus:border-primary/40"
        />
      </div>

      {/* Summary */}
      <BookingSummary form={form} />

      {/* Footer */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 h-11 rounded-xl"
          onClick={actions.goBack}
          disabled={derived.isSubmitting}
        >
          Back
        </Button>
        <Button
          className="flex-1 h-11 rounded-xl gap-1.5"
          disabled={!derived.isStepValid[3] || derived.isSubmitting}
          onClick={actions.submit}
        >
          {derived.isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> Create Booking
            </>
          )}
        </Button>
      </div>

      {/* Hint when staff is unassigned */}
      {!state.selectedStaffId && state.selectedSlot && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <UserCheck className="h-3 w-3" />
          Booking will be created without a staff member assigned.
        </p>
      )}
    </div>
  );
}

/* OpenHoursLabel — "Open 9:00 AM – 9:00 PM" hint shown next to the slot
   grid header. Backend returns 24h "HH:mm" strings; we reformat to 12h
   for display. Renders nothing when the day is closed (handled upstream). */
function OpenHoursLabel({
  openTime, closeTime,
}: { openTime: string | null; closeTime: string | null }) {
  if (!openTime || !closeTime) return null;
  return (
    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
      <CalendarIcon className="h-3 w-3" />
      Open {to12h(openTime)} – {to12h(closeTime)}
    </span>
  );
}

function to12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

/* LastSlotHint — explains why the slot grid stops where it does:
   "Last slot 8:00 PM — your 60-min booking ends at 9:00 PM (close)".
   Quietly returns null when we don't have enough info. */
function LastSlotHint({
  lastSlotStart, totalDuration, closeTime,
}: {
  lastSlotStart: string | null;
  totalDuration: number;
  closeTime: string | null;
}) {
  if (!lastSlotStart || !closeTime || totalDuration <= 0) return null;
  const lastLabel = format(new Date(lastSlotStart), "h:mm a");
  return (
    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
      Last slot <span className="font-semibold text-foreground">{lastLabel}</span>
      {" — "}
      your {totalDuration}-min booking ends by closing time ({to12h(closeTime)}).
    </p>
  );
}
