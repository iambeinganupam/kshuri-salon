/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { FadeIn, StaggerContainer, StaggerItem } from "@kshuri/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  CalendarDays,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Plus,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Star,
  Activity,
  Bell,
} from "lucide-react";
import { useDashboardKPIs, useAppointments, useTransactions, useNotifications } from "@kshuri/api-client/hooks";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatsGridSkeleton,
  Skeleton,
} from "@kshuri/ui";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { Notification } from "@kshuri/api-client/types";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  accepted: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "in-progress": "bg-primary/15 text-primary border-primary/25",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  rejected: "bg-destructive/15 text-destructive border-destructive/25",
};

const settlementStatusColors: Record<string, string> = {
  "due-today": "bg-destructive/15 text-destructive border-destructive/25",
  upcoming: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  overdue: "bg-red-600/20 text-red-400 border-red-500/30",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function notificationIcon(type: string): { icon: typeof AlertCircle; color: string } {
  if (type.includes("complete") || type.includes("confirm"))
    return { icon: CheckCircle2, color: "text-emerald-400" };
  if (type.includes("cancel") || type.includes("reject"))
    return { icon: XCircle, color: "text-destructive" };
  if (type.includes("review") || type.includes("rating"))
    return { icon: Star, color: "text-primary" };
  if (type.includes("payment") || type.includes("received") || type.includes("settlement"))
    return { icon: Wallet, color: "text-emerald-400" };
  if (type.includes("refund"))
    return { icon: Wallet, color: "text-destructive" };
  if (type.includes("booking") || type.includes("new"))
    return { icon: CalendarDays, color: "text-blue-400" };
  return { icon: AlertCircle, color: "text-amber-400" };
}

function formatPct(pct: number | undefined | null): string | null {
  if (pct == null) return null;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const kpisResult = useDashboardKPIs('week');
  const appointmentsResult = useAppointments({ limit: 5 });
  const transactionsResult = useTransactions({ limit: 5 });
  const notificationsResult = useNotifications({ limit: 5 });

  if (kpisResult?.isLoading || appointmentsResult?.isLoading) {
    return (
      <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1440px]">
        <LoadingRegion className="space-y-6">
          <PageHeaderSkeleton />
          <StatsGridSkeleton />
          <div className="grid gap-4 lg:grid-cols-5">
            <Skeleton className="lg:col-span-3 h-[280px] rounded-xl" />
            <Skeleton className="lg:col-span-2 h-[280px] rounded-xl" />
          </div>
        </LoadingRegion>
      </div>
    );
  }

  const kpis = kpisResult.data ?? null;
  const recentBookings: any[] = (appointmentsResult.data as any)?.items ?? (Array.isArray(appointmentsResult.data) ? appointmentsResult.data : []);
  const settlements: any[] = (transactionsResult.data as any)?.items ?? (Array.isArray(transactionsResult.data) ? transactionsResult.data : []);
  const notifications: Notification[] = (notificationsResult.data as any)?.items ?? (Array.isArray(notificationsResult.data) ? notificationsResult.data : []);

  // Activity Feed is intentionally distinct from "Recent Bookings" on the
  // left. Bookings have their own list; surfacing them again here just shows
  // the same row twice and makes the dashboard feel padded. Activity =
  // money events (payments, refunds) + system notifications.
  const activityItems = [
    ...settlements.map((t: any) => {
      // After Phase-D field alignment the public Transaction shape uses
      // `gross_amount`. The legacy `amount` is still tolerated for older payloads.
      const amt = Number(t.gross_amount ?? t.amount ?? 0);
      return {
      id: `tx-${t.id}`,
      type: t.status === 'refunded' ? 'payment_refund' : 'payment_received',
      title: t.status === 'refunded'
        ? `Refund processed — ₹${amt.toLocaleString('en-IN')}`
        : `Payment received — ₹${amt.toLocaleString('en-IN')}`,
      subtitle: t.external_ref ?? t.payment_method ?? t.currency ?? 'INR',
      created_at: t.created_at ?? new Date().toISOString(),
      };
    }),
    ...notifications.map((n: Notification) => ({
      id: `notif-${n.id}`,
      type: n.type,
      title: (n as any).body ?? n.title ?? '',
      subtitle: '',
      created_at: n.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const displayName = user?.first_name ?? user?.legal_business_name ?? "there";

  const stats = [
    {
      label: "Today's Revenue",
      value: kpis != null ? `₹${Number(kpis.total_revenue ?? 0).toLocaleString("en-IN")}` : "₹0",
      icon: Wallet,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      change: formatPct(kpis?.revenue_change_pct),
      changePositive: (kpis?.revenue_change_pct ?? 0) >= 0,
      subtitle: "vs yesterday",
    },
    {
      label: "Today's Bookings",
      value: kpis != null ? `${kpis.total_bookings ?? 0}` : "0",
      icon: CalendarDays,
      iconBg: "bg-teal-500/15",
      iconColor: "text-teal-400",
      change: formatPct(kpis?.bookings_change_pct),
      changePositive: (kpis?.bookings_change_pct ?? 0) >= 0,
      subtitle: "vs yesterday",
    },
    {
      label: "Completion Rate",
      value: kpis != null ? `${(kpis.completion_rate ?? 0).toFixed(1)}%` : "0%",
      icon: CheckCircle2,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      change: null,
      changePositive: true,
      subtitle: "this week",
    },
    {
      label: "Avg Booking Value",
      value: kpis != null ? `₹${Number(kpis.avg_booking_value ?? 0).toLocaleString("en-IN")}` : "₹0",
      icon: Clock,
      iconBg: "bg-destructive/15",
      iconColor: "text-destructive",
      change: null,
      changePositive: true,
      subtitle: "per appointment",
    },
  ];

  const quickActions = [
    { label: "Walk-in Booking", icon: Plus, onClick: () => navigate("/bookings"), color: "bg-primary/10 text-primary" },
    { label: "Staff", icon: Users, onClick: () => navigate("/staff"), color: "bg-blue-500/10 text-blue-400" },
    { label: "Settlements", icon: Wallet, onClick: () => navigate("/billing"), color: "bg-amber-500/10 text-amber-400" },
    { label: "Calendar", icon: CalendarDays, onClick: () => navigate("/calendar"), color: "bg-teal-500/10 text-teal-400" },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1440px] mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">
              {getGreeting()}, {displayName} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what's happening today — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="gap-1.5 h-9 rounded-xl text-xs hidden lg:flex"
                onClick={action.onClick}
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Quick Actions - Mobile */}
      <div className="grid grid-cols-4 gap-2 lg:hidden">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border/40 hover:bg-secondary/50 transition-colors"
          >
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", action.color)}>
              <action.icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <StaggerContainer className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <Card className="border-border/40 hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold font-serif lg:text-[28px] tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {stat.change && (
                        <span className={cn("text-[11px] font-semibold flex items-center gap-0.5", stat.changePositive ? "text-emerald-400" : "text-destructive")}>
                          {stat.changePositive
                            ? <ArrowUpRight className="h-3 w-3" />
                            : <ArrowDownRight className="h-3 w-3" />}
                          {stat.change}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">{stat.subtitle}</span>
                    </div>
                  </div>
                  <div className={cn("rounded-xl p-2.5", stat.iconBg)}>
                    <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Recent Bookings + Activity Feed */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recent Bookings */}
        <FadeIn delay={0.1} className="lg:col-span-3">
          <Card className="border-border/40">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-primary hover:text-primary font-medium"
                onClick={() => navigate("/bookings")}
              >
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No bookings yet</p>
                  <p className="text-xs mt-1 opacity-70">New bookings will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {recentBookings.slice(0, 4).map((booking: any) => {
                    const customerName = booking.customer_name ?? booking.customerName ?? "Unknown";
                    const status = booking.status ?? "pending";
                    const lineItems: any[] = Array.isArray(booking.services) ? booking.services : [];
                    const serviceName = lineItems.length > 0
                      ? lineItems.map((s: any) => s.service_name ?? s.serviceName).filter(Boolean).join(", ")
                      : (booking.service_name ?? "");
                    // total_amount is the snapshotted sum across all line items;
                    // service_price is just the first service and only correct for single-service bookings.
                    const totalAmount = booking.total_amount ?? booking.totalAmount ?? booking.service_price ?? 0;
                    const timeSlot = booking.start_time ? new Date(booking.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : (booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");
                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between py-3 cursor-pointer hover:bg-secondary/30 rounded-lg px-2 transition-colors"
                        onClick={() => navigate("/bookings")}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                            {customerName.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{customerName}</p>
                              <Badge variant="outline" className={cn("text-[9px] shrink-0 rounded-md", statusColors[status])}>
                                {status}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {serviceName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="text-sm font-semibold font-serif">₹{Number(totalAmount).toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-muted-foreground">{timeSlot}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Activity Feed */}
        <FadeIn delay={0.15} className="lg:col-span-2">
          <Card className="border-border/40 h-full">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Activity
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Live</Badge>
            </CardHeader>
            <CardContent>
              {activityItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="text-xs mt-1 opacity-70">Bookings and payments will appear here</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {activityItems.map((item) => {
                    const { icon: Icon, color } = notificationIcon(item.type);
                    return (
                      <div key={item.id} className="flex items-start gap-3 py-3 border-b border-border/20 last:border-0">
                        <div className="mt-0.5 shrink-0">
                          <Icon className={cn("h-4 w-4", color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-foreground leading-relaxed">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.subtitle}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">{relativeTime(item.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Settlements Due */}
      <FadeIn delay={0.2}>
        <Card className="border-border/40">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Settlements Due</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-primary hover:text-primary font-medium"
              onClick={() => navigate("/billing")}
            >
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {settlements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Wallet className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm font-medium">No settlements due</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {settlements.slice(0, 3).map((settlement: any) => {
                  const salonName = settlement.salonName ?? settlement.salon_name ?? settlement.description ?? "Salon";
                  const dueDate = settlement.dueDate ?? settlement.due_date ?? settlement.created_at ?? "";
                  const amount = settlement.amount ?? 0;
                  const status = settlement.status ?? "upcoming";
                  return (
                    <div
                      key={settlement.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/billing")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                          {salonName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{salonName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Due: {dueDate ? new Date(dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <p className="text-sm font-semibold font-serif">₹{Number(amount).toLocaleString("en-IN")}</p>
                        {(status === "due-today" || status === "overdue") && (
                          <Badge variant="outline" className={cn("text-[9px] rounded-md", settlementStatusColors[status])}>
                            {status === "due-today" ? "Due Today" : "Overdue"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
