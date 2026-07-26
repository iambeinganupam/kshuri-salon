/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
// ─────────────────────────────────────────────────────────────────────────────
// SalonBooking — page-local view model.
//
// `useAppointments()` returns the wire `Appointment` shape; the page-level
// `mapAppointment()` adapter normalises it into this flatter, presentation-
// friendly form so the card components don't have to defend against
// missing/optional fields scattered across the API.
//
// Buckets follow the appointment lifecycle 1:1 so each tab on the page maps
// to a single status:
//
//   pending     → awaiting salon confirmation
//   accepted    → confirmed, not yet started (OTP-to-start gate for online)
//   in_progress → service running
//   completed   → done; cancelled / no-show fall here too as terminal states
// ─────────────────────────────────────────────────────────────────────────────

export type SalonBookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

/** Tab buckets surfaced on the page. */
export type SalonBookingBucket =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed";

export interface SalonBookingService {
  id?: string;
  name: string;
  price: number;
  duration_minutes: number;
}

export interface SalonBooking {
  id: string;
  /** Last 8 chars of the booking id, useful for support / bill copy. */
  short_id: string;
  status: SalonBookingStatus;
  bucket: SalonBookingBucket;
  /** Human-readable status label (Pending / Accepted / etc.) */
  statusLabel: string;
  customer_name: string;
  customer_phone: string | null;
  customer_initial: string;
  customer_type: string | null;
  /** Display label for customer_type ("Repeat", "VIP", "New") */
  customer_type_label: string | null;
  /** Repeat-visit count when supplied by backend; null when unknown. */
  visit_count: number | null;
  booking_type: string | null;
  /** Display label for booking_type ("Walk-in", "Online", "Estylr") */
  booking_type_label: string | null;
  /** True when this booking originated from the customer-facing app
   *  (drives the OTP-to-start gate; walk-ins can start without OTP). */
  is_online: boolean;
  start_time: string;
  end_time: string | null;
  scheduled_label: string;
  duration_minutes: number;
  services: SalonBookingService[];
  total_amount: number;
  payment_status: string | null;
  /** Display label for payment_status ("Paid", "Unpaid", "Pending") */
  payment_status_label: string;
  paid: boolean;
  staff_name: string | null;
  notes: string | null;
  /** Customer health/safety alerts surfaced from the booking notes — lines
   *  prefixed with `Alert:` are extracted as separate red banners. */
  alerts: string[];
  otp_code: string | null;
  created_at: string;
  /** Relative-age label: "Just now" / "5m ago" / "2h ago" / "3d ago" */
  created_label: string;
}

export function bucketFromStatus(status: string | undefined): SalonBookingBucket {
  switch (status) {
    case "pending":
      return "pending";
    case "confirmed":
      return "accepted";
    case "in_progress":
      return "in_progress";
    case "completed":
    case "cancelled":
    case "no_show":
    default:
      return "completed";
  }
}

const STATUS_LABELS: Record<SalonBookingStatus, string> = {
  pending: "Pending",
  confirmed: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

function formatScheduledLabel(start: string | undefined): string {
  if (!start) return "—";
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function initialsOf(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatCreatedLabel(iso: string | undefined): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const seconds = Math.floor((Date.now() - t) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  new: "New",
  returning: "Returning",
  repeat: "Repeat",
  vip: "VIP",
  loyal: "Loyal",
  walk_in: "Walk-in",
  subscriber: "Subscriber",
};

const BOOKING_TYPE_LABELS: Record<string, string> = {
  walkin: "Walk-in",
  walk_in: "Walk-in",
  kshuri: "Estylr",
  online: "Online",
  app: "App",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  settled: "Paid",
  pending: "Pending",
  unpaid: "Unpaid",
  refunded: "Refunded",
};

const ONLINE_BOOKING_TYPES = new Set(["kshuri", "online", "app"]);

/** Pull `Alert: …` lines out of free-form notes so they can be styled
 *  prominently. The remainder is treated as a regular note. */
function extractAlerts(notes: string | null | undefined): {
  alerts: string[];
  remainder: string | null;
} {
  if (!notes) return { alerts: [], remainder: null };
  const lines = notes.split(/\r?\n/);
  const alerts: string[] = [];
  const rest: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^alert\s*:\s*(.+)$/i);
    if (match) {
      alerts.push(match[1].trim());
    } else {
      rest.push(trimmed);
    }
  }
  return { alerts, remainder: rest.length > 0 ? rest.join("\n") : null };
}

/**
 * Normalise an `Appointment` row into the local `SalonBooking` view model.
 * Defensive against missing optional fields.
 */
export function mapAppointment(raw: any): SalonBooking {
  const status = ((raw?.status as string) ?? "pending") as SalonBookingStatus;
  const services: SalonBookingService[] = Array.isArray(raw?.services) && raw.services.length > 0
    ? raw.services.map((s: any) => ({
        id: s.service_id,
        name: s.service_name ?? "Service",
        price: Number(s.locked_price ?? s.price ?? 0),
        duration_minutes: Number(s.duration_minutes ?? raw.duration_minutes ?? 30),
      }))
    : [
        {
          id: raw?.service_id,
          name: raw?.service_name ?? "Service",
          price: Number(raw?.service_price ?? 0),
          duration_minutes: Number(raw?.duration_minutes ?? 30),
        },
      ];

  const totalAmount = Number(
    raw?.total_amount ?? services.reduce((s, x) => s + x.price, 0),
  );
  const totalDuration = services.reduce((s, x) => s + x.duration_minutes, 0);
  const paymentStatus = (raw?.payment_status ?? null) as string | null;

  const id = String(raw?.id ?? "");
  const customerType = (raw?.customer_type ?? null) as string | null;
  const bookingType = (raw?.booking_type ?? null) as string | null;
  const createdAt = raw?.created_at ?? "";

  const visitCountRaw = raw?.visit_count ?? raw?.customer_visit_count ?? null;
  const visitCount = Number.isFinite(Number(visitCountRaw)) ? Number(visitCountRaw) : null;

  const { alerts, remainder: cleanedNotes } = extractAlerts(raw?.notes ?? null);

  return {
    id,
    short_id: id ? id.slice(-8).toUpperCase() : "",
    status,
    bucket: bucketFromStatus(status),
    statusLabel: STATUS_LABELS[status] ?? status,
    customer_name: raw?.customer_name ?? "Walk-in customer",
    customer_phone: raw?.customer_phone ?? null,
    customer_initial: initialsOf(raw?.customer_name),
    customer_type: customerType,
    customer_type_label: customerType ? (CUSTOMER_TYPE_LABELS[customerType] ?? customerType) : null,
    visit_count: visitCount,
    booking_type: bookingType,
    booking_type_label: bookingType ? (BOOKING_TYPE_LABELS[bookingType] ?? bookingType) : null,
    is_online: bookingType ? ONLINE_BOOKING_TYPES.has(bookingType) : false,
    start_time: raw?.start_time ?? raw?.scheduled_start ?? raw?.created_at ?? "",
    end_time: raw?.end_time ?? raw?.scheduled_end ?? null,
    scheduled_label: formatScheduledLabel(raw?.start_time ?? raw?.scheduled_start),
    duration_minutes: totalDuration,
    services,
    total_amount: totalAmount,
    payment_status: paymentStatus,
    payment_status_label: paymentStatus ? (PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus) : "Unpaid",
    paid: paymentStatus === "paid" || paymentStatus === "settled",
    staff_name: raw?.staff_member?.name ?? raw?.assigned_staff ?? null,
    notes: cleanedNotes,
    alerts,
    otp_code: raw?.otp_code ?? null,
    created_at: createdAt,
    created_label: formatCreatedLabel(createdAt),
  };
}

/** Status → border accent class for cards. */
export function statusAccent(status: SalonBookingStatus): {
  border: string;
  badge: string;
  dot: string;
} {
  switch (status) {
    case "pending":
      return {
        border: "border-l-amber-500/60",
        badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        dot: "bg-amber-500",
      };
    case "confirmed":
      return {
        border: "border-l-blue-500/60",
        badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",
        dot: "bg-blue-500",
      };
    case "in_progress":
      return {
        border: "border-l-primary/60",
        badge: "bg-primary/15 text-primary border-primary/25",
        dot: "bg-primary",
      };
    case "completed":
      return {
        border: "border-l-success/60",
        badge: "bg-success/15 text-success border-success/25",
        dot: "bg-success",
      };
    case "cancelled":
    case "no_show":
      return {
        border: "border-l-destructive/60",
        badge: "bg-destructive/15 text-destructive border-destructive/25",
        dot: "bg-destructive",
      };
  }
}
