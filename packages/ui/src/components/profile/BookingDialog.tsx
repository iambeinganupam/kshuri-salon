// ─────────────────────────────────────────────────────────────────────────────
// BookingDialog — premium three-step booking flow (date → time → confirm),
// with an optional service-picker step prepended only when the user opens
// the dialog without anything in their cart.
//
// Flow rules
// ----------
// • If `preselectedServiceIds` is non-empty (cart-driven flow from
//   `<VendorBookingCard>`'s "Book N Services" button), the dialog opens
//   directly on the calendar — no "pick a service" interstitial. A
//   compact summary banner at the top shows what's being booked plus a
//   "Change services" affordance so the user can roll back.
//
// • If `preselectedServiceIds` is empty (cart-less flow, e.g. tapping
//   "Book Appointment" on a freshly loaded preview), the dialog opens
//   on a multi-service picker step.
//
// Slot availability is fetched via `useAvailableSlots` against the first
// selected service. The `vendorType` prop ensures this component works
// for both salons and freelancers.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../dialog";
import { Button } from "../button";
import { Calendar } from "../calendar";
import { Card, CardContent } from "../card";
import { Input } from "../input";
import { cn } from "../../lib/utils";
import {
  CalendarDays, Clock, Check, Sparkles, Loader2,
  ShoppingBag, Search, CalendarOff, Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useAvailableSlots } from "@kshuri/api-client/hooks";
import type { VendorType } from "./types";

export interface BookingDialogService {
  id: string;
  name: string;
  /** Service duration in minutes (used to estimate the appointment length) */
  duration_minutes?: number | null;
  /** Display price in ₹ */
  price?: number | null;
  /** One-line description shown beneath the name */
  description?: string | null;
  /** Optional category label rendered as a chip */
  category?: string | null;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendorId?: string;
  vendorType: VendorType;
  services?: BookingDialogService[];
  /** Pre-tick these services on open (e.g. from the right-rail cart) */
  preselectedServiceIds?: string[];
  isPreview?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

const STEPS = ["select", "date", "time", "confirm"] as const;
type Step = (typeof STEPS)[number];

export default function BookingDialog({
  open,
  onOpenChange,
  vendorId,
  vendorType,
  services = [],
  preselectedServiceIds,
  isPreview = false,
}: BookingDialogProps) {
  const initialStep: Step =
    preselectedServiceIds && preselectedServiceIds.length > 0 ? "date" : "select";

  const [step, setStep] = useState<Step>(initialStep);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    () => new Set(preselectedServiceIds ?? []),
  );

  // Whenever the dialog re-opens, reset state. If the cart already has
  // services, jump straight to the date picker; otherwise start on the
  // service-pick step.
  useEffect(() => {
    if (!open) return;
    const ids = preselectedServiceIds ?? [];
    setSelectedServiceIds(new Set(ids));
    setStep(ids.length > 0 ? "date" : "select");
    setSelectedDate(undefined);
    setSelectedTime(null);
  }, [open, preselectedServiceIds]);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const selectedServices = services.filter((s) => selectedServiceIds.has(s.id));
  const totalPrice = selectedServices.reduce(
    (sum, s) => sum + (typeof s.price === "number" ? s.price : 0),
    0,
  );
  const totalDuration = selectedServices.reduce(
    (sum, s) =>
      sum + (typeof s.duration_minutes === "number" ? s.duration_minutes : 0),
    0,
  );

  // Slot availability — for multi-service bookings we fetch slots for the
  // first selected service today; the backend will harden this once
  // multi-service slot composition lands.
  const primaryServiceId = selectedServices[0]?.id ?? "";

  const { data: slotsRaw, isLoading: slotsLoading } = useAvailableSlots(
    {
      vendor_id: vendorId ?? "",
      vendor_type: vendorType,
      service_id: primaryServiceId,
      date: dateStr,
    },
    step === "time" && !!vendorId && !!primaryServiceId && !!dateStr,
  );

  // Backend returns { is_open, open_time, close_time, slots[] }
  const slotResult = slotsRaw as { is_open?: boolean; slots?: Array<{ start: string; end: string; available: boolean }> } | null;
  const allSlots = slotResult?.slots ?? [];
  const isClosed = slotResult != null && slotResult.is_open === false;
  const availableCount = allSlots.filter((s) => s.available).length;

  function reset() {
    setStep("select");
    setSelectedDate(undefined);
    setSelectedTime(null);
    setSelectedServiceIds(new Set(preselectedServiceIds ?? []));
  }

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date);
    if (date) setStep("time");
  }

  function handleTimeSelect(start: string) {
    setSelectedTime(start);
    setStep("confirm");
  }

  function handleBack() {
    if (step === "date") setStep("select");
    else if (step === "time") { setStep("date"); setSelectedTime(null); }
    else if (step === "confirm") setStep("time");
  }

  function handleConfirm() {
    const names = selectedServices.map((s) => s.name).join(", ");
    toast.success(
      `Booking confirmed: ${names} on ${format(selectedDate!, "PPP")} at ${formatTime(selectedTime!)}`,
    );
    onOpenChange(false);
    reset();
  }

  // Visible steps adapt to whether the user is starting from cart (3 steps)
  // or from scratch (4 steps with the picker prepended). The progress bar
  // mirrors this so the user never sees a permanently-empty circle.
  const visibleSteps: Step[] =
    initialStep === "select"
      ? (["select", "date", "time", "confirm"] as const).slice()
      : (["date", "time", "confirm"] as const).slice();
  const stepIndex = visibleSteps.indexOf(step);
  const stepCopy: Record<Step, { title: string; description: string }> = {
    select: {
      title: "Select Services",
      description:
        services.length === 0
          ? "This vendor has no bookable services yet."
          : "Tap one or more services to add them to your appointment.",
    },
    date: {
      title: "Pick a Date",
      description: "Choose a date within the next 30 days.",
    },
    time: {
      title: "Choose Time Slot",
      description: slotsLoading
        ? "Loading slots…"
        : isClosed
        ? `Closed on ${selectedDate ? format(selectedDate, "EEEE") : "this day"}`
        : `${availableCount} slot${availableCount === 1 ? "" : "s"} available on ${selectedDate ? format(selectedDate, "PPP") : ""}`,
    },
    confirm: {
      title: "Confirm Booking",
      description: "Review and confirm your appointment.",
    },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg p-0 overflow-hidden max-h-[calc(100vh-4rem)] flex flex-col">
        <div className="shrink-0 p-6 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif">
              {stepCopy[step].title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {stepCopy[step].description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mt-4">
            {visibleSteps.map((s, i) => {
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0",
                      isDone
                        ? "bg-success text-success-foreground"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < visibleSteps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 rounded-full",
                        isDone ? "bg-success" : "bg-muted",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          {/* Step 1 — Select services (search + category groups) */}
          {step === "select" && (
            <ServicePickerStep
              services={services}
              selectedIds={selectedServiceIds}
              onToggle={toggleService}
              onContinue={() => setStep("date")}
              totalPrice={totalPrice}
              totalDuration={totalDuration}
              selectedCount={selectedServices.length}
            />
          )}

          {/* Step 2 — Date */}
          {step === "date" && (
            <div className="space-y-3">
              {/* Compact summary banner — visible whenever the user already
                  picked services (either via the cart or via Step 1). */}
              {selectedServices.length > 0 && (
                <div className="rounded-xl border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Booking
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {selectedServices.map((s) => s.name).join(", ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} · {totalDuration} min
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold font-serif">
                        ₹{totalPrice.toLocaleString("en-IN")}
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep("select")}
                        className="text-[11px] text-primary hover:underline mt-0.5"
                      >
                        Change services
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < todayStart || date > addDays(todayStart, 30)}
                  className="p-3 pointer-events-auto rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Time */}
          {step === "time" && (
            <div>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : isClosed ? (
                <div className="flex flex-col items-center text-center py-8 px-4 gap-2">
                  <CalendarOff className="h-7 w-7 text-muted-foreground/60" />
                  <p className="text-sm font-medium">Closed on {selectedDate ? format(selectedDate, "EEEE") : "this day"}</p>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    This vendor doesn't take bookings on this day. Try picking a different date.
                  </p>
                  {isPreview && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Settings className="h-3 w-3" /> Go to Settings → Working Hours to open this day.
                    </p>
                  )}
                </div>
              ) : allSlots.length === 0 ? (
                <div className="flex flex-col items-center text-center py-8 px-4 gap-2">
                  <CalendarOff className="h-7 w-7 text-muted-foreground/60" />
                  <p className="text-sm font-medium">Fully booked on this date</p>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    No open slots remain for the selected service. Pick a different date to continue.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {allSlots.map((slot) => (
                    <button
                      key={slot.start}
                      disabled={!slot.available}
                      onClick={() => slot.available && handleTimeSelect(slot.start)}
                      className={cn(
                        "p-2.5 rounded-xl text-xs font-medium border transition-all",
                        !slot.available
                          ? "bg-muted/20 text-muted-foreground/40 border-border/10 cursor-not-allowed"
                          : selectedTime === slot.start
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "border-border/40 hover:border-primary/50 hover:bg-primary/5",
                      )}
                    >
                      <Clock className={cn("h-3 w-3 mx-auto mb-1", !slot.available ? "opacity-30" : "opacity-60")} />
                      <span className={cn(!slot.available && "line-through decoration-muted-foreground/50")}>
                        {formatTime(slot.start)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!isClosed && allSlots.length > 0 && (
                <div className="flex items-center gap-3 mt-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/20 border border-border/40" /> Available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted/30" /> Booked
                  </span>
                </div>
              )}

              <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={handleBack}>
                ← Change Date
              </Button>
            </div>
          )}

          {/* Step 4 — Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              <Card className="border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Services</p>
                    <ul className="space-y-1.5">
                      {selectedServices.map((s) => (
                        <li key={s.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">{s.name}</span>
                          {typeof s.price === "number" && (
                            <span className="font-semibold font-serif shrink-0 ml-3">
                              ₹{s.price.toLocaleString("en-IN")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <hr className="border-border/30" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold font-serif">₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Date</span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {format(selectedDate!, "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Time</span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {selectedTime ? formatTime(selectedTime) : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {isPreview ? (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <p className="text-xs text-muted-foreground font-medium">
                    Preview only — this is how customers will see your booking flow. Confirming a booking is disabled on your own profile.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-xs text-success font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Slot is available!
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleBack}>
                  ← Change Time
                </Button>
                <Button
                  className="flex-1 rounded-xl font-semibold"
                  onClick={handleConfirm}
                  disabled={isPreview}
                >
                  {isPreview ? "Preview Mode" : "Confirm Booking"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ServicePickerStep — sober, premium-feel multi-service picker.
//
// • Search bar (name + category match).
// • Services grouped by category with sticky section headers.
// • Each row: name + duration · price + 1-line description.
// • Selected rows visually anchored with a primary border + check icon.
// • Sticky footer: total summary (count · duration · ₹total) + Continue.
// ─────────────────────────────────────────────────────────────────────────────
interface ServicePickerStepProps {
  services: BookingDialogService[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onContinue: () => void;
  totalPrice: number;
  totalDuration: number;
  selectedCount: number;
}

function ServicePickerStep({
  services,
  selectedIds,
  onToggle,
  onContinue,
  totalPrice,
  totalDuration,
  selectedCount,
}: ServicePickerStepProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => {
      const haystack = [s.name, s.category ?? "", s.description ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [services, query]);

  // Group by category, preserving insertion order so categories appear in
  // the same order they came back from the API.
  const groups = useMemo(() => {
    const map = new Map<string, BookingDialogService[]>();
    for (const s of filtered) {
      const key = s.category ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [filtered]);

  const isEmpty = services.length === 0;
  const isFilteredEmpty = !isEmpty && filtered.length === 0;

  return (
    <div className="space-y-3">
      {/* Search */}
      {!isEmpty && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services or categories…"
            className="pl-9 h-10 rounded-xl bg-muted/40 border-border/40"
          />
        </div>
      )}

      {/* List */}
      <div className="max-h-[340px] overflow-y-auto pr-1 space-y-3 -mx-1 px-1">
        {isEmpty ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No services available.
          </div>
        ) : isFilteredEmpty ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No services match "{query.trim()}"
          </div>
        ) : (
          groups.map(({ category, items }) => (
            <div key={category}>
              <div className="sticky top-0 z-10 -mx-1 px-1 bg-card pb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  {category} <span className="font-normal opacity-60">({items.length})</span>
                </p>
              </div>
              <div className="space-y-1.5 pt-1">
                {items.map((s) => {
                  const isSelected = selectedIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onToggle(s.id)}
                      className={cn(
                        "w-full text-left rounded-xl border transition-all",
                        "px-3 py-2.5 flex items-center gap-3",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/40 hover:border-primary/40 hover:bg-muted/30",
                      )}
                    >
                      <div
                        className={cn(
                          "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border/60 bg-card",
                        )}
                        aria-hidden
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-semibold truncate">{s.name}</p>
                          {typeof s.price === "number" && (
                            <p className="text-sm font-bold font-serif shrink-0">
                              ₹{s.price.toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          {typeof s.duration_minutes === "number" && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {s.duration_minutes} min
                            </span>
                          )}
                        </div>
                        {s.description && (
                          <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer summary + CTA */}
      <div className="rounded-xl border border-border/40 bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {selectedCount === 0 ? "Pick at least one service" : "Booking summary"}
            </p>
            <p className="text-sm font-medium truncate">
              {selectedCount === 0
                ? "Tap a service above to add it"
                : `${selectedCount} service${selectedCount > 1 ? "s" : ""} · ${totalDuration} min`}
            </p>
          </div>
          {selectedCount > 0 && (
            <p className="text-base font-bold font-serif shrink-0">
              ₹{totalPrice.toLocaleString("en-IN")}
            </p>
          )}
        </div>
        <Button
          className="w-full h-10 rounded-xl gap-2 font-semibold"
          onClick={onContinue}
          disabled={selectedCount === 0}
        >
          <ShoppingBag className="h-4 w-4" />
          Continue to Date
        </Button>
      </div>
    </div>
  );
}
