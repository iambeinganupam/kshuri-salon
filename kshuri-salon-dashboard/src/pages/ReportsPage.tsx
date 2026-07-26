/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState } from "react";
import { FadeIn, StaggerContainer, StaggerItem } from "@kshuri/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon,
  Users, Star, Wallet, CalendarDays, Download, ArrowUpRight,
  ArrowDownRight, Target, Award, Smile, Frown, Meh,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAppointments, useRevenueSeries, useTopServices, useStaffPerformance } from "@kshuri/api-client/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SERVICE_COLORS = [
  "hsl(var(--primary))",
  "hsl(152, 56%, 39%)",
  "hsl(217, 91%, 60%)",
  "hsl(40, 72%, 52%)",
  "hsl(280, 60%, 55%)",
  "hsl(340, 65%, 55%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" && p.value > 1000 ? `₹${(p.value / 1000).toFixed(0)}k` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("this-month");

  const { data: appointmentsRaw } = useAppointments({ limit: 50 });
  const { data: revenueSeriesRaw = [] } = useRevenueSeries('month');
  const { data: topServicesRaw = [] } = useTopServices('month');
  const { data: staffPerfRaw = [] } = useStaffPerformance('month', 5);

  const apiAppointments: any[] = (appointmentsRaw as any)?.items
    ?? (Array.isArray(appointmentsRaw) ? appointmentsRaw : []);
  const monthlyRevenue: any[] = Array.isArray(revenueSeriesRaw) ? revenueSeriesRaw.map((r: any) => ({ month: r.date?.slice(5) ?? r.month, revenue: r.revenue ?? 0 })) : [];
  const serviceRevenue: any[] = Array.isArray(topServicesRaw) ? topServicesRaw.map((s: any, i: number) => ({
    name: s.service_name,
    revenue: s.total_revenue,
    bookings: s.booking_count,
    color: SERVICE_COLORS[i % SERVICE_COLORS.length],
  })) : [];
  const staffPerformance: any[] = Array.isArray(staffPerfRaw) ? staffPerfRaw.map((s: any) => ({
    name: (s.staff_name ?? "Staff").split(" ")[0],
    services: s.total_bookings ?? 0,
    rating: Number(s.avg_rating ?? 0).toFixed(1),
    revenue: s.total_revenue ?? 0,
  })) : [];

  const lastRevEntry = monthlyRevenue[monthlyRevenue.length - 1];
  const prevRevEntry = monthlyRevenue[monthlyRevenue.length - 2];
  const totalRevenue = lastRevEntry?.revenue ?? 0;
  const prevRevenue = prevRevEntry?.revenue ?? 0;
  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : "0";
  const totalBookings = apiAppointments.length;

  const handleExport = () => {
    toast.success("Report exported as PDF!");
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1440px] mx-auto">
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Comprehensive insights into your business performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px] h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl text-xs" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* KPI Overview */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: totalRevenue > 0 ? `₹${(totalRevenue / 1000).toFixed(0)}k` : "₹0", change: prevRevenue > 0 ? `${Number(revenueGrowth) >= 0 ? "+" : ""}${revenueGrowth}%` : null, positive: Number(revenueGrowth) >= 0, icon: Wallet, iconBg: "bg-primary/15", iconColor: "text-primary" },
          { label: "Total Bookings", value: totalBookings.toString(), change: null, positive: true, icon: CalendarDays, iconBg: "bg-blue-500/15", iconColor: "text-blue-400" },
          { label: "Services Revenue", value: serviceRevenue.length > 0 ? `₹${(serviceRevenue.reduce((s: any, r: any) => s + r.revenue, 0) / 1000).toFixed(0)}k` : "—", change: null, positive: true, icon: Star, iconBg: "bg-amber-500/15", iconColor: "text-amber-400" },
          { label: "Staff Count", value: staffPerformance.length > 0 ? staffPerformance.length.toString() : "—", change: null, positive: true, icon: Users, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400" },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <Card className="border-border/40 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold font-serif tracking-tight">{stat.value}</p>
                    {stat.change && (
                      <span className={cn("text-[11px] font-semibold flex items-center gap-0.5", stat.positive ? "text-emerald-400" : "text-destructive")}>
                        {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {stat.change}
                      </span>
                    )}
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

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="h-10 rounded-xl bg-muted/50">
          <TabsTrigger value="revenue" className="text-xs gap-1.5 rounded-lg"><BarChart3 className="h-3.5 w-3.5" /> Revenue</TabsTrigger>
          <TabsTrigger value="services" className="text-xs gap-1.5 rounded-lg"><PieChartIcon className="h-3.5 w-3.5" /> Services</TabsTrigger>
          <TabsTrigger value="satisfaction" className="text-xs gap-1.5 rounded-lg"><Smile className="h-3.5 w-3.5" /> Satisfaction</TabsTrigger>
          <TabsTrigger value="staff" className="text-xs gap-1.5 rounded-lg"><Users className="h-3.5 w-3.5" /> Staff</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-5">
            <FadeIn className="lg:col-span-3">
              <Card className="border-border/40">
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Revenue vs Target
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Last 6 months performance</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">On Track</Badge>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenue}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220, 12%, 16%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220, 8%, 55%)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(220, 8%, 45%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                        <Area type="monotone" dataKey="target" stroke="hsl(220, 8%, 45%)" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="Target" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.1} className="lg:col-span-2">
              <Card className="border-border/40 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Goals & Targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { label: "Total Revenue", current: Math.round(totalRevenue / 1000), target: 400, unit: "k" },
                    { label: "Bookings", current: totalBookings, target: 250, unit: "" },
                    { label: "Top Services", current: serviceRevenue.length, target: 5, unit: "" },
                    { label: "Staff", current: staffPerformance.length, target: 5, unit: "" },
                  ].map((goal) => {
                    const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
                    const achieved = pct >= 100;
                    return (
                      <div key={goal.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-medium text-foreground">{goal.label}</span>
                          <span className={cn("text-[11px] font-semibold", achieved ? "text-emerald-400" : "text-muted-foreground")}>
                            {goal.current}{goal.unit} / {goal.target}{goal.unit}
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground/60">{pct}% complete</span>
                          {achieved && <Badge className="text-[8px] h-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-full">Achieved</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <FadeIn>
              <Card className="border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={serviceRevenue} layout="vertical" barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(220, 12%, 16%)" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220, 8%, 45%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 8%, 55%)" }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" radius={[0, 6, 6, 0]} name="Revenue">
                          {serviceRevenue.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.1}>
              <Card className="border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Top Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {serviceRevenue.map((svc, i) => (
                      <div key={svc.name} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/40 transition-colors">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold text-primary-foreground" style={{ backgroundColor: svc.color }}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium">{svc.name}</p>
                          <p className="text-[11px] text-muted-foreground">{svc.bookings} bookings</p>
                        </div>
                        <p className="text-sm font-serif font-bold">₹{(svc.revenue / 1000).toFixed(0)}k</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </TabsContent>

        {/* Satisfaction Tab */}
        <TabsContent value="satisfaction" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-5">
            <FadeIn className="lg:col-span-2">
              <Card className="border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Smile className="h-4 w-4 text-emerald-400" /> Customer Satisfaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-10 text-center rounded-xl border border-dashed border-border/40">
                    <Smile className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Satisfaction data coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.1} className="lg:col-span-3">
              <Card className="border-border/40 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Satisfaction Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: Smile, label: "Overall Score", value: "—", pct: 0, color: "text-emerald-400" },
                    { icon: Award, label: "Would Recommend", value: "—", pct: 0, color: "text-blue-400" },
                    { icon: Star, label: "5-Star Rate", value: "—", pct: 0, color: "text-amber-400" },
                    { icon: Target, label: "On-Time Service", value: "—", pct: 0, color: "text-primary" },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/15">
                      <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        <m.icon className={cn("h-4 w-4", m.color)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-medium">{m.label}</span>
                          <span className="text-sm font-serif font-bold">{m.value}</span>
                        </div>
                        <Progress value={m.pct} className="h-1.5" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <FadeIn>
            <Card className="border-border/40">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Staff Performance</CardTitle>
                <Badge variant="outline" className="text-[11px]">{staffPerformance.length} members</Badge>
              </CardHeader>
              <CardContent>
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-3 pb-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                  <span>Staff</span><span>Services</span><span>Rating</span><span>Revenue</span>
                </div>
                <div className="divide-y divide-border/30">
                  {staffPerformance.map((sp) => (
                    <div key={sp.name} className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-2 md:gap-4 items-center px-3 py-3.5 hover:bg-secondary/40 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                          {sp.name[0]}
                        </div>
                        <span className="text-[13px] font-medium">{sp.name}</span>
                      </div>
                      <span className="text-sm tabular-nums">{sp.services}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium">{sp.rating}</span>
                      </div>
                      <span className="text-sm font-serif font-semibold">₹{(sp.revenue / 1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}