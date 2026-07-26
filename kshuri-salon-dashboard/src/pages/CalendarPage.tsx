/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState, useMemo } from "react";
import { FadeIn } from "@kshuri/ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Clock, CalendarDays, Users, Timer, Phone, User, AlertCircle, RefreshCw,
} from "lucide-react";
import { useAppointments, useWorkingHours } from "@kshuri/api-client/hooks";
import type { Appointment, WorkingHoursEntry } from "@kshuri/api-client";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_H = 68; // px per hour row
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Mirrors actual DB ENUM values returned by the backend
const STATUS_COLOR: Record<string, string> = {
  pending:     "bg-amber-500/15 border-amber-500/30 text-amber-400",
  confirmed:   "bg-blue-500/15 border-blue-500/30 text-blue-400",
  in_progress: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
  completed:   "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  cancelled:   "bg-red-500/15 border-red-500/30 text-red-400",
  no_show:     "bg-muted/50 border-border/30 text-muted-foreground",
};

// Pending is excluded from the calendar (unconfirmed requests are managed in Bookings)
const STATUS_LABEL: Record<string, string> = {
  confirmed:   "Confirmed",
  in_progress: "In Progress",
  completed:   "Completed",
  cancelled:   "Cancelled",
  no_show:     "No Show",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  // Monday-anchored week
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// Use local date components — toISOString() gives UTC which is wrong for IST (+5:30)
function toYMD(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatRange(dates: Date[]): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${dates[0]!.toLocaleDateString("en-IN", opts)} — ${dates[6]!.toLocaleDateString("en-IN", { ...opts, year: "numeric" })}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Grid Event ───────────────────────────────────────────────────────────────

interface GridEvent {
  raw: Appointment;
  dayIndex: number;   // 0-6 within the displayed week
  hourIndex: number;  // 0 = 8 AM, 11 = 7 PM
  spanRows: number;   // how many hour rows this event spans
  timeLabel: string;  // "10:30 AM"
  serviceName: string;
  durationMinutes: number;
}

function buildGridEvents(
  items: Appointment[],
  weekDates: Date[],
  gridStart: number,
  gridEnd: number,
): GridEvent[] {
  const out: GridEvent[] = [];
  for (const a of items) {
    if (!a.start_time) continue;
    const start = new Date(a.start_time);
    const dateStr = toYMD(start);
    const dayIndex = weekDates.findIndex(d => toYMD(d) === dateStr);
    if (dayIndex === -1) continue;

    const startHour = start.getHours();
    if (startHour < gridStart || startHour > gridEnd) continue;

    const durationMinutes = Number(a.duration_minutes ?? 30);
    const serviceName = a.service_name ?? (a.services as any)?.[0]?.name ?? "Service";

    out.push({
      raw: a,
      dayIndex,
      hourIndex: startHour - gridStart,
      spanRows: Math.max(1, Math.ceil(durationMinutes / 60)),
      timeLabel: fmtTime(a.start_time),
      serviceName,
      durationMinutes,
    });
  }
  return out;
}

// ─── Event Detail Sheet ───────────────────────────────────────────────────────

function EventDetailSheet({
  event, open, onOpenChange,
}: {
  event: GridEvent | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!event) return null;
  const a = event.raw;

  const initials = (a.customer_name ?? "W")
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const services: Array<{ name: string; price: number; duration_minutes: number }> =
    (a.services as any[])?.length
      ? (a.services as any[]).map(s => ({
          name: s.name ?? s.service_name ?? "",
          price: Number(s.price ?? 0),
          duration_minutes: Number(s.duration_minutes ?? s.duration ?? 0),
        }))
      : a.service_name
        ? [{ name: a.service_name, price: Number(a.service_price ?? 0), duration_minutes: event.durationMinutes }]
        : [];

  const totalAmount = Number(a.total_amount ?? a.service_price ?? 0);
  const staffName = a.staff_member?.name ?? a.assigned_staff;
  const colorClass = STATUS_COLOR[a.status] ?? STATUS_COLOR.pending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">Appointment Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Customer card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{a.customer_name ?? "Walk-in"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.customer_phone ?? "—"}</p>
            </div>
            {a.customer_phone && (
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-xl shrink-0"
                onClick={() => toast.info(`Calling ${a.customer_phone}…`)}
              >
                <Phone className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("rounded-lg text-xs", colorClass)}>
              {STATUS_LABEL[a.status] ?? a.status}
            </Badge>
            {a.booking_type && (
              <Badge variant="outline" className="rounded-lg text-xs capitalize">
                {a.booking_type === "walkin" ? "Walk-in" : a.booking_type}
              </Badge>
            )}
          </div>

          {/* Time / Duration / Date row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/30 p-3 text-center">
              <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold">{event.timeLabel}</p>
              <p className="text-[10px] text-muted-foreground">Time</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3 text-center">
              <Timer className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold">{event.durationMinutes}min</p>
              <p className="text-[10px] text-muted-foreground">Duration</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3 text-center">
              <CalendarDays className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold">{a.start_time ? toYMD(new Date(a.start_time)) : "—"}</p>
              <p className="text-[10px] text-muted-foreground">Date</p>
            </div>
          </div>

          {/* Services list */}
          {services.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Services</p>
              <div className="rounded-xl bg-muted/15 border border-border/25 divide-y divide-border/20">
                {services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[13px] font-medium">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.duration_minutes} min</p>
                    </div>
                    <span className="font-serif font-semibold">₹{s.price.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned staff */}
          {staffName && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/15 border border-border/25">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Assigned Staff</p>
                <p className="text-[13px] font-semibold">{staffName}</p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-xl font-serif font-bold text-primary">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const todayMondayIdx = (today.getDay() + 6) % 7; // 0 = Monday

  const [view, setView] = useState<"week" | "day">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayMondayIdx);
  const [selectedEvent, setSelectedEvent] = useState<GridEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Week date range (Monday-based, drives API params)
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const from_date = toYMD(weekDates[0]!);
  const to_date   = toYMD(weekDates[6]!);

  // Fetch appointments for the displayed week (all statuses — completed, in_progress, upcoming)
  const { data, isLoading, isError, refetch } = useAppointments({ from_date, to_date, limit: 50 });
  // Exclude pending — unconfirmed requests shouldn't occupy calendar slots
  const items: Appointment[] = (data?.items ?? []).filter(a => a.status !== 'pending');

  // Fetch salon working hours to determine grid bounds
  const { data: workingHoursRaw } = useWorkingHours();
  const workingHours: WorkingHoursEntry[] = workingHoursRaw ?? [];

  const gridStart = useMemo(() => {
    const opens = workingHours
      .filter(h => !h.is_closed && h.open_time)
      .map(h => parseInt(h.open_time.split(":")[0]!, 10));
    return opens.length > 0 ? Math.min(...opens) : 8;
  }, [workingHours]);

  const gridEnd = useMemo(() => {
    const closes = workingHours
      .filter(h => !h.is_closed && h.close_time)
      .map(h => parseInt(h.close_time.split(":")[0]!, 10));
    return closes.length > 0 ? Math.max(...closes) : 20;
  }, [workingHours]);

  const hours = useMemo(
    () => Array.from({ length: gridEnd - gridStart + 1 }, (_, i) => i + gridStart),
    [gridStart, gridEnd],
  );

  // Build grid-positioned events
  const gridEvents = useMemo(
    () => buildGridEvents(items, weekDates, gridStart, gridEnd),
    [items, weekDates, gridStart, gridEnd],
  );

  // Derived stats
  const todayStr   = toYMD(today);
  const todayIdx   = weekDates.findIndex(d => toYMD(d) === todayStr);
  const todayEvents = gridEvents.filter(e => e.dayIndex === todayIdx);
  const weekMinutes = items.reduce((sum, a) => sum + Number(a.duration_minutes ?? 0), 0);

  // Day column descriptors (Mon – Sun)
  const dayCols = weekDates.map((d, i) => ({
    label:   DAY_NAMES[d.getDay()]!,
    date:    d.getDate(),
    isToday: toYMD(d) === todayStr,
    index:   i,
  }));

  const displayDayCols  = view === "day" ? [dayCols[selectedDayIndex]!] : dayCols;
  const displayEvents   = view === "day"
    ? gridEvents.filter(e => e.dayIndex === selectedDayIndex)
    : gridEvents;

  function openEvent(e: GridEvent) {
    setSelectedEvent(e);
    setSheetOpen(true);
  }

  function goToday() {
    setWeekOffset(0);
    setSelectedDayIndex(todayMondayIdx);
    toast.info("Jumped to today");
  }

  const colCount = view === "week" ? 7 : 1;
  const gridCols = `70px repeat(${colCount}, 1fr)`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1440px] mx-auto">

      {/* ── Header ── */}
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Calendar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {view === "week" ? "Weekly" : "Daily"} schedule overview
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle — visible on all sizes */}
            <Tabs value={view} onValueChange={(v) => setView(v as "week" | "day")}>
              <TabsList className="h-9 rounded-xl bg-muted/50">
                <TabsTrigger value="day"  className="text-xs rounded-lg px-3">Day</TabsTrigger>
                <TabsTrigger value="week" className="text-xs rounded-lg px-3">Week</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Week navigation */}
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl"
              onClick={() => setWeekOffset(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[13px] font-semibold text-foreground min-w-[170px] text-center">
              {formatRange(weekDates)}
            </span>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl"
              onClick={() => setWeekOffset(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-9 rounded-xl" onClick={goToday}>
              Today
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* ── Quick Stats ── */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {([
            { icon: CalendarDays, label: "Today",       value: `${todayEvents.length} bookings`, bg: "bg-primary/10",       color: "text-primary"      },
            { icon: Timer,        label: "Booked Hours", value: `${(weekMinutes / 60).toFixed(1)}h`, bg: "bg-blue-500/10",  color: "text-blue-400"     },
            { icon: Users,        label: "This Week",    value: `${items.length} total`,          bg: "bg-emerald-500/10",   color: "text-emerald-400"  },
          ] as const).map(({ icon: Icon, label, value, bg, color }) => (
            <Card key={label} className="border-border/40">
              <div className="p-3.5 flex items-center gap-3">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-lg font-serif font-bold">{isLoading ? "—" : value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </FadeIn>

      {/* ── Day selector strip (day view only) ── */}
      {view === "day" && (
        <FadeIn delay={0.06}>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {dayCols.map((d) => (
              <button
                key={d.index}
                onClick={() => setSelectedDayIndex(d.index)}
                className={cn(
                  "flex flex-col items-center min-w-[60px] p-2.5 rounded-xl border transition-all",
                  d.index === selectedDayIndex
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card border-border/30 hover:bg-muted/40",
                  d.isToday && d.index !== selectedDayIndex && "border-primary/20",
                )}
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {d.label}
                </span>
                <span className={cn(
                  "text-lg font-serif font-bold mt-0.5",
                  d.index === selectedDayIndex ? "text-primary" : "text-foreground/80",
                )}>
                  {d.date}
                </span>
                {d.isToday && <div className="h-1 w-4 rounded-full bg-primary mt-1" />}
              </button>
            ))}
          </div>
        </FadeIn>
      )}

      {/* ── Status colour legend ── */}
      <FadeIn delay={0.08}>
        <div className="flex gap-3 mb-4 flex-wrap">
          {Object.entries(STATUS_LABEL).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn("h-2.5 w-2.5 rounded border", STATUS_COLOR[status])} />
              <span className="text-[11px] text-muted-foreground/70 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* ── Calendar Grid ── */}
      <FadeIn delay={0.12}>
        <Card className="overflow-hidden border-border/40">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertCircle className="h-8 w-8 text-destructive/60" />
              <p className="text-sm font-medium text-foreground">Failed to load appointments</p>
              <p className="text-xs text-muted-foreground">Check your connection or try again</p>
              <Button variant="outline" size="sm" className="gap-2 mt-1" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className={view === "week" ? "min-w-[800px]" : "min-w-[360px]"}>

                {/* Column headers */}
                <div
                  className="grid border-b border-border/40 bg-muted/20"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div className="p-3 flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                  {displayDayCols.map((d) => (
                    <button
                      key={d.index}
                      onClick={() => {
                        if (view === "week") {
                          setView("day");
                          setSelectedDayIndex(d.index);
                        }
                      }}
                      className={cn(
                        "p-3 text-center border-l border-border/30 transition-colors",
                        view === "week" && "hover:bg-muted/30 cursor-pointer",
                        view === "day"  && "cursor-default",
                        d.isToday && "bg-primary/[0.05]",
                      )}
                    >
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.1em] font-semibold">
                        {d.label}
                      </p>
                      <p className={cn(
                        "text-xl font-serif font-bold mt-0.5",
                        d.isToday ? "text-primary" : "text-foreground/80",
                      )}>
                        {d.date}
                      </p>
                      {d.isToday && (
                        <div className="h-1 w-6 rounded-full bg-primary mx-auto mt-1.5" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Hour rows */}
                {hours.map((hour) => {
                  const hourIdx = hour - gridStart;
                  return (
                    <div
                      key={hour}
                      className="grid border-b border-border/15"
                      style={{ gridTemplateColumns: gridCols, minHeight: `${ROW_H}px` }}
                    >
                      {/* Time label */}
                      <div className="p-2 flex items-start justify-end pr-3 pt-2.5">
                        <span className="text-[10px] text-muted-foreground/50 font-semibold tabular-nums">
                          {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                        </span>
                      </div>

                      {/* Day cells */}
                      {displayDayCols.map((d) => {
                        const cellEvents = displayEvents.filter(
                          e => e.dayIndex === d.index && e.hourIndex === hourIdx,
                        );
                        return (
                          <div
                            key={d.index}
                            className={cn(
                              "border-l border-border/15 p-0.5 space-y-0.5",
                              d.isToday && "bg-primary/[0.02]",
                            )}
                          >
                            {cellEvents.map((ev, ci) => (
                              <button
                                key={`${ev.raw.id}-${ci}`}
                                onClick={() => openEvent(ev)}
                                className={cn(
                                  "w-full rounded-xl border text-left transition-all duration-200",
                                  "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                                  view === "week" ? "p-1.5 text-[9px] leading-snug" : "p-3 text-xs leading-snug",
                                  STATUS_COLOR[ev.raw.status] ?? STATUS_COLOR.pending,
                                )}
                                style={{ minHeight: `${ev.spanRows * ROW_H - 6}px` }}
                              >
                                <p className="font-bold truncate">
                                  {ev.raw.customer_name ?? "Walk-in"}
                                </p>
                                <p className="truncate opacity-80 mt-0.5">{ev.serviceName}</p>

                                {/* Extra info only in day view */}
                                {view === "day" && (
                                  <>
                                    {(ev.raw.staff_member?.name ?? ev.raw.assigned_staff) && (
                                      <p className="truncate opacity-60 mt-0.5 text-[10px]">
                                        → {ev.raw.staff_member?.name ?? ev.raw.assigned_staff}
                                      </p>
                                    )}
                                    <p className="font-serif font-bold mt-1">
                                      ₹{Number(ev.raw.total_amount ?? 0).toLocaleString("en-IN")}
                                    </p>
                                  </>
                                )}

                                {/* Staff name in compact form for week view */}
                                {view === "week" && (ev.raw.staff_member?.name ?? ev.raw.assigned_staff) && (
                                  <p className="truncate opacity-50 mt-0.5 text-[8px]">
                                    → {ev.raw.staff_member?.name ?? ev.raw.assigned_staff}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </FadeIn>

      {/* ── Today's Appointments list ── */}
      <FadeIn delay={0.15}>
        <Card className="border-border/40 mt-4">
          <div className="p-4 lg:p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Today's Appointments
              {!isLoading && todayEvents.length > 0 && (
                <Badge variant="secondary" className="text-[10px] rounded-md ml-1">
                  {todayEvents.length}
                </Badge>
              )}
            </h3>

            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))
              ) : isError ? (
                <p className="text-sm text-destructive/70 text-center py-4">
                  Could not load today's appointments
                </p>
              ) : todayEvents.length > 0 ? (
                todayEvents.map((ev) => (
                  <button
                    key={ev.raw.id}
                    onClick={() => openEvent(ev)}
                    className="flex items-center justify-between w-full p-3 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {(ev.raw.customer_name ?? "W")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">
                          {ev.raw.customer_name ?? "Walk-in"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {ev.serviceName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] rounded-md", STATUS_COLOR[ev.raw.status] ?? STATUS_COLOR.pending)}
                      >
                        {STATUS_LABEL[ev.raw.status] ?? ev.raw.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{ev.timeLabel}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No appointments for today
                </p>
              )}
            </div>
          </div>
        </Card>
      </FadeIn>

      <EventDetailSheet event={selectedEvent} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
