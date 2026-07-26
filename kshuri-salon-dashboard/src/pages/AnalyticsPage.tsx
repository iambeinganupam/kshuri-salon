/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState } from "react";
import { FadeIn, StaggerContainer, StaggerItem } from "@kshuri/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Users, Star, BarChart3, IndianRupee, CalendarDays, CheckCircle2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  useDashboardKPIs,
  useRevenueSeries,
  useBookingTrends,
  useStaffPerformance,
  useTopServices,
  useCustomerInsights,
} from "@kshuri/api-client/hooks";
import type { DateRange } from "@kshuri/api-client/types";
import { EmptyState } from "@kshuri/ui";

const PERIOD_LABELS = ["This Week", "This Month", "Quarter"] as const;
const PERIOD_RANGE: Record<string, DateRange> = {
  "This Week": "week",
  "This Month": "month",
  Quarter: "month",
};

const SERVICE_COLORS = [
  "hsl(350, 65%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(152, 56%, 39%)",
  "hsl(217, 91%, 60%)",
  "hsl(220, 8%, 55%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold text-foreground">
            {p.name}: {typeof p.value === "number" && p.value > 1000
              ? `₹${p.value.toLocaleString("en-IN")}`
              : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<typeof PERIOD_LABELS[number]>("This Week");
  const range = PERIOD_RANGE[period];

  const { data: kpisRaw } = useDashboardKPIs(range);
  const { data: revenueSeriesRaw = [] } = useRevenueSeries(range);
  const { data: bookingTrendsRaw = [] } = useBookingTrends(range);
  const { data: staffPerfRaw = [] } = useStaffPerformance(range, 5);
  const { data: topServicesRaw = [] } = useTopServices(range);
  const { data: customerInsightsRaw } = useCustomerInsights(range);

  const kpis: any = kpisRaw ?? null;
  const revenueSeries: any[] = Array.isArray(revenueSeriesRaw) ? revenueSeriesRaw : [];
  const bookingTrends: any[] = Array.isArray(bookingTrendsRaw) ? bookingTrendsRaw : [];
  const staffPerf: any[] = Array.isArray(staffPerfRaw) ? staffPerfRaw : [];
  const topServices: any[] = Array.isArray(topServicesRaw) ? topServicesRaw : [];
  const customerInsights: any = customerInsightsRaw ?? null;

  const kpiCards = kpis ? [
    {
      label: "Total Revenue",
      value: kpis.total_revenue > 0
        ? `₹${(kpis.total_revenue / 1000).toFixed(1)}k`
        : "₹0",
      icon: IndianRupee,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
      change: kpis.revenue_change_pct != null ? `${kpis.revenue_change_pct > 0 ? "+" : ""}${kpis.revenue_change_pct.toFixed(1)}%` : null,
      positive: (kpis.revenue_change_pct ?? 0) >= 0,
    },
    {
      label: "Total Bookings",
      value: String(kpis.total_bookings),
      icon: CalendarDays,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      change: kpis.bookings_change_pct != null ? `${kpis.bookings_change_pct > 0 ? "+" : ""}${kpis.bookings_change_pct.toFixed(1)}%` : null,
      positive: (kpis.bookings_change_pct ?? 0) >= 0,
    },
    {
      label: "New Customers",
      value: String(kpis.new_customers),
      icon: Users,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
      change: null,
      positive: true,
    },
    {
      label: "Completion Rate",
      value: `${kpis.completion_rate ?? 0}%`,
      icon: CheckCircle2,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
      change: null,
      positive: true,
    },
  ] : [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1440px] mx-auto">
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Performance insights for your outlet</p>
          </div>
          <div className="flex items-center gap-2">
            {PERIOD_LABELS.map(p => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                className="rounded-xl h-9 text-xs"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.length > 0 ? kpiCards.map(stat => (
          <StaggerItem key={stat.label}>
            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", stat.iconBg)}>
                    <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                  </div>
                  {stat.change && (
                    <span className={cn("text-[11px] font-semibold", stat.positive ? "text-emerald-500" : "text-destructive")}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-serif font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        )) : (
          <StaggerItem className="col-span-4">
            <div className="py-8 text-center text-sm text-muted-foreground">Loading KPI data…</div>
          </StaggerItem>
        )}
      </StaggerContainer>

      {/* Revenue + Booking Trend */}
      <div className="grid gap-5 lg:grid-cols-2">
        <FadeIn delay={0.1}>
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-500" />Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueSeries.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(152, 56%, 39%)" fill="hsl(152, 56%, 39%)" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon={IndianRupee} title="No revenue data" description="Revenue trend will appear once you have completed bookings" />
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.12}>
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />Booking Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingTrends.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon={CalendarDays} title="No booking data" description="Booking trends will appear once you have appointments" />
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Top Services + Staff Performance */}
      <div className="grid gap-5 lg:grid-cols-2">
        <FadeIn delay={0.15}>
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />Top Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topServices.length > 0 ? (
                <div className="space-y-3">
                  {topServices.slice(0, 5).map((svc: any, i: number) => (
                    <div key={svc.service_id ?? i} className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ background: SERVICE_COLORS[i % SERVICE_COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate">{svc.service_name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{svc.booking_count} bookings</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${svc.revenue_share_pct ?? 0}%`,
                              background: SERVICE_COLORS[i % SERVICE_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-serif font-semibold shrink-0">₹{Number(svc.total_revenue).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={BarChart3} title="No service data" description="Top services will appear once bookings are completed" />
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.17}>
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />Staff Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staffPerf.length > 0 ? (
                <div className="space-y-2">
                  {staffPerf.map((s: any, i: number) => (
                    <div key={s.staff_id ?? i} className="flex items-center gap-3 p-3 rounded-xl border border-border/20">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.staff_name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.total_bookings} bookings · {s.completion_rate}% completion</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-serif font-bold">₹{Number(s.total_revenue).toLocaleString("en-IN")}</p>
                        {s.avg_rating > 0 && (
                          <div className="flex items-center gap-0.5 justify-end">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            <span className="text-[10px]">{Number(s.avg_rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Users} title="No staff data" description="Staff performance will appear once appointments are assigned" />
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Customer Insights */}
      <FadeIn delay={0.2}>
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customerInsights ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "New Customers", value: customerInsights.new_customers, color: "text-primary" },
                  { label: "Returning", value: customerInsights.returning_customers, color: "text-emerald-500" },
                  { label: "Avg Visits", value: Number(customerInsights.avg_visits_per_customer).toFixed(1), color: "text-foreground" },
                  { label: "Churn Rate", value: `${customerInsights.churn_rate ?? 0}%`, color: "text-destructive" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl bg-muted/30 p-4 text-center">
                    <p className={cn("text-2xl font-serif font-bold", stat.color)}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No customer data" description="Customer insights will appear as your outlet grows" />
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
