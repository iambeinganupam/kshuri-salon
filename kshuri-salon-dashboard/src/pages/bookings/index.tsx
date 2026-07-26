/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
// ─────────────────────────────────────────────────────────────────────────────
// Bookings — Salon dashboard appointments page.
//
// Five-tab layout that mirrors the appointment lifecycle 1:1 so each card
// only ever shows the actions valid for its current status:
//
//   All          — every booking, sorted by creation/scheduled time
//   Pending      — IncomingBookingCard       → Accept & Assign / Decline
//   Accepted     — AcceptedBookingCard       → OTP-to-start gate
//   In Progress  — InProgressBookingCard     → Mark complete
//   Completed    — HistoryBookingCard        → Cash/UPI pay → Generate bill
//
// All data is live (`useAppointments`); state-transitions go through
// `useAppointmentAction` which invalidates the cache on success so the
// card animates into the next bucket without manual refetch.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FadeIn, StaggerContainer, StaggerItem } from "@kshuri/ui";
import {
  Inbox, CalendarCheck, Search, IndianRupee, TrendingUp,
  AlertCircle, ListChecks, PlayCircle, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAppointments, useAppointmentAction } from "@kshuri/api-client/hooks";
import { mapAppointment, type SalonBooking, type SalonBookingBucket } from "./types";
import { IncomingBookingCard } from "./IncomingBookingCard";
import { AcceptedBookingCard } from "./AcceptedBookingCard";
import { InProgressBookingCard } from "./InProgressBookingCard";
import { HistoryBookingCard } from "./HistoryBookingCard";
import { StaffStatusBar, AssignStaffDialog } from "./_staff";
import { CreateBookingDialog } from "./_create";
import {
  CancelBookingDialog, RescheduleBookingDialog, extractActionError,
} from "./_dialogs";

type SortOrder = "newest" | "scheduled";
type TabValue = "all" | SalonBookingBucket;

export default function Bookings() {
  const appointmentsResult = useAppointments();
  const appointmentAction = useAppointmentAction();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [tab, setTab] = useState<TabValue>("all");
  const [assignBooking, setAssignBooking] = useState<SalonBooking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<SalonBooking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<SalonBooking | null>(null);

  const rawAppointments = (() => {
    const data: any = appointmentsResult.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  })();

  const allBookings: SalonBooking[] = useMemo(
    () => rawAppointments.map((a: any) => mapAppointment(a)),
    [rawAppointments],
  );

  const matchedBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allBookings;
    return allBookings.filter((b) => {
      const haystack = [
        b.id,
        b.short_id,
        b.customer_name,
        b.customer_phone ?? "",
        b.statusLabel,
        b.staff_name ?? "",
        ...b.services.map((s) => s.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [allBookings, searchQuery]);

  const sortedBookings = useMemo(() => {
    const arr = [...matchedBookings];
    arr.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
    return arr;
  }, [matchedBookings, sortOrder]);

  // Bucket counts come from the unfiltered set so the tab badges always
  // reflect the salon's true workload, not a transient search.
  const counts = useMemo(() => ({
    all: allBookings.length,
    pending: allBookings.filter((b) => b.bucket === "pending").length,
    accepted: allBookings.filter((b) => b.bucket === "accepted").length,
    in_progress: allBookings.filter((b) => b.bucket === "in_progress").length,
    completed: allBookings.filter((b) => b.bucket === "completed").length,
  }), [allBookings]);

  // KPIs (unfiltered)
  const totalCount = counts.all;
  const pendingCount = counts.pending;
  const completedRevenue = allBookings
    .filter((b) => b.status === "completed" && b.paid)
    .reduce((sum, b) => sum + b.total_amount, 0);
  const pipelineRevenue = allBookings
    .filter((b) => b.bucket === "pending" || b.bucket === "accepted" || b.bucket === "in_progress")
    .reduce((sum, b) => sum + b.total_amount, 0);

  // Visible list for the current tab.
  const visible = useMemo(() => {
    if (tab === "all") return sortedBookings;
    return sortedBookings.filter((b) => b.bucket === tab);
  }, [sortedBookings, tab]);

  // ── Mutations ──
  const dispatchAction = async (
    id: string,
    action: "confirm" | "cancel" | "start" | "complete" | "no-show" | "verify-otp",
    extra?: { otp_code?: string },
    successMsg?: string,
  ) => {
    try {
      await appointmentAction.mutateAsync({ appointmentId: id, action, extra });
      if (successMsg) toast.success(successMsg);
    } catch (err) {
      toast.error(extractActionError(err));
    }
  };

  // ── Handlers ──
  const onAccept = (id: string) => {
    const booking = allBookings.find((b) => b.id === id);
    if (!booking) return;
    setAssignBooking(booking);
  };
  const onAssignConfirm = async (staffName?: string) => {
    if (!assignBooking) return;
    const id = assignBooking.id;
    setAssignBooking(null);
    await dispatchAction(
      id,
      "confirm",
      undefined,
      staffName ? `Booking accepted — assigned to ${staffName}` : "Booking accepted",
    );
  };
  const onDecline = (id: string) => dispatchAction(id, "cancel", undefined, "Booking declined");
  // Single `start` path: backend skips OTP for walk-ins (no linked customer
  // profile) and enforces the customer's 6-digit service_code otherwise. The
  // frontend just forwards whatever was typed into the OTP field.
  const onStart = (id: string, otp?: string) => {
    const booking = allBookings.find((b) => b.id === id);
    if (!booking) return;
    if (booking.is_online && !otp) {
      toast.error("Customer service code is required for online bookings");
      return;
    }
    const successMsg = otp ? "Service code verified — service started" : "Service started";
    dispatchAction(id, "start", otp ? { otp_code: otp } : undefined, successMsg);
  };
  const onComplete = (id: string) =>
    dispatchAction(id, "complete", undefined, "Booking marked complete");
  const onCancel = (id: string) => {
    const booking = allBookings.find((b) => b.id === id);
    if (booking) setCancelBooking(booking);
  };
  const onReschedule = (id: string) => {
    const booking = allBookings.find((b) => b.id === id);
    if (booking) setRescheduleBooking(booking);
  };
  const onGenerateBill = (id: string) => {
    toast.info("Bill PDF download — coming next iteration", {
      description: `Booking #${id.slice(-8).toUpperCase()}`,
    });
  };

  // ── Render ──
  if (appointmentsResult.isLoading && allBookings.length === 0) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
        <Skeleton className="h-12 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
      </div>
    );
  }

  if (appointmentsResult.isError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
        <Card className="border-destructive/40">
          <CardContent className="p-6 text-center space-y-2">
            <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
            <p className="text-sm font-medium">Couldn't load bookings</p>
            <p className="text-xs text-muted-foreground">Pull to refresh or try again in a moment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
      {/* Header — title + primary CTA */}
      <FadeIn>
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-serif font-bold leading-tight">Bookings</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage requests, active services, and history
            </p>
          </div>
          <CreateBookingDialog />
        </div>
      </FadeIn>

      {/* Staff Status bar */}
      <FadeIn delay={0.03}>
        <StaffStatusBar />
      </FadeIn>

      {/* KPI cards */}
      <FadeIn delay={0.04}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total", value: String(totalCount), icon: CalendarCheck, color: "text-foreground", bg: "bg-muted/40" },
            { label: "Pending", value: String(pendingCount), icon: Inbox, color: "text-amber-400", bg: "bg-amber-500/10", pulse: pendingCount > 0 },
            { label: "Revenue", value: `₹${completedRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-success", bg: "bg-success/10" },
            { label: "Pipeline", value: `₹${pipelineRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/30 shadow-soft rounded-xl">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className={`relative h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  {stat.pulse && (
                    <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-base sm:text-lg font-bold leading-none truncate ${stat.color}`}>{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeIn>

      {/* Search + Sort */}
      <FadeIn delay={0.06}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, service, or booking ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl text-sm"
            />
          </div>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="h-10 w-[8.5rem] sm:w-[9.5rem] rounded-xl text-xs shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="scheduled">Earliest scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FadeIn>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="bg-card border border-border/30 rounded-xl h-auto p-1 w-full grid grid-cols-5 gap-1">
          <TabTrigger value="all" label="All" count={counts.all} icon={ListChecks} tone="muted" />
          <TabTrigger value="pending" label="Pending" count={counts.pending} icon={Inbox} tone="amber" />
          <TabTrigger value="accepted" label="Accepted" count={counts.accepted} icon={CalendarCheck} tone="blue" />
          <TabTrigger value="in_progress" label="In Progress" count={counts.in_progress} icon={PlayCircle} tone="primary" />
          <TabTrigger value="completed" label="Completed" count={counts.completed} icon={CheckCircle} tone="success" />
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <BookingList
            bookings={visible}
            isMutating={appointmentAction.isPending}
            onAccept={onAccept}
            onDecline={onDecline}
            onStart={onStart}
            onComplete={onComplete}
            onCancel={onCancel}
            onReschedule={onReschedule}
            onGenerateBill={onGenerateBill}
          />
        </TabsContent>
      </Tabs>

      <AssignStaffDialog
        booking={assignBooking}
        open={!!assignBooking}
        onOpenChange={(v) => !v && setAssignBooking(null)}
        onConfirm={onAssignConfirm}
        isMutating={appointmentAction.isPending}
      />

      <CancelBookingDialog
        booking={cancelBooking}
        open={!!cancelBooking}
        onOpenChange={(v) => !v && setCancelBooking(null)}
      />

      <RescheduleBookingDialog
        booking={rescheduleBooking}
        open={!!rescheduleBooking}
        onOpenChange={(v) => !v && setRescheduleBooking(null)}
      />
    </div>
  );
}

// ─── Tab trigger — counts pill with tone-coded background ───────────────────
type TabTone = "muted" | "amber" | "blue" | "primary" | "success";

const TONE_PILL: Record<TabTone, string> = {
  muted: "bg-muted text-muted-foreground",
  amber: "bg-amber-500/20 text-amber-400",
  blue: "bg-blue-500/20 text-blue-400",
  primary: "bg-primary/20 text-primary",
  success: "bg-success/20 text-success",
};

function TabTrigger({
  value, label, count, icon: Icon, tone,
}: {
  value: TabValue;
  label: string;
  count: number;
  icon: React.ElementType;
  tone: TabTone;
}) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-lg gap-1.5 text-xs font-semibold py-2 data-[state=active]:bg-secondary"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && (
        <span className={`h-5 min-w-5 rounded-full text-[9px] font-bold flex items-center justify-center px-1.5 ${TONE_PILL[tone]}`}>
          {count}
        </span>
      )}
    </TabsTrigger>
  );
}

// ─── BookingList — renders the right card per status with grid layout ───────
interface BookingListProps {
  bookings: SalonBooking[];
  isMutating: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onStart: (id: string, otp?: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
  onGenerateBill: (id: string) => void;
}

function BookingList(props: BookingListProps) {
  const { bookings, isMutating } = props;

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nothing here yet"
        hint="New bookings show up here in real time."
      />
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {bookings.map((b) => (
        <StaggerItem key={b.id}>
          {b.bucket === "pending" && (
            <IncomingBookingCard
              booking={b}
              onAccept={props.onAccept}
              onDecline={props.onDecline}
              isMutating={isMutating}
            />
          )}
          {b.bucket === "accepted" && (
            <AcceptedBookingCard
              booking={b}
              onStart={props.onStart}
              onCancel={props.onCancel}
              onReschedule={props.onReschedule}
              isMutating={isMutating}
            />
          )}
          {b.bucket === "in_progress" && (
            <InProgressBookingCard
              booking={b}
              onComplete={props.onComplete}
              onCancel={props.onCancel}
              isMutating={isMutating}
            />
          )}
          {b.bucket === "completed" && (
            <HistoryBookingCard
              booking={b}
              onGenerateBill={props.onGenerateBill}
            />
          )}
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  hint: string;
}

function EmptyState({ icon: Icon, title, hint }: EmptyStateProps) {
  return (
    <Card className="border-border/30 rounded-2xl">
      <CardContent className="p-10 text-center space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto">
          <Icon className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">{hint}</p>
      </CardContent>
    </Card>
  );
}
