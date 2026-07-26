/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FadeIn } from "@kshuri/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, Mail, ShieldCheck, ShieldAlert, Briefcase,
  Star, Calendar, Copy, MessageCircle, Clock,
  Award, CalendarDays, TrendingUp, MapPin,
  CheckCircle2, Timer, MessageSquare, Wifi, WifiOff, History, Store,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useVendorDetail, useAssignments } from "@kshuri/api-client/hooks";
import RequestAssignmentDialog from "@/components/freelancers/RequestAssignmentDialog";
import { cn } from "@/lib/utils";

const bookingStatusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  accepted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "in-progress": "bg-primary/10 text-primary border-primary/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const MONTHS = ["Dec", "Jan", "Feb", "Mar"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={cn("h-3.5 w-3.5", s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
      ))}
    </div>
  );
}

function BookingRow({ booking }: { booking: any }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-card hover:shadow-sm transition-shadow">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
        booking.status === "completed" ? "bg-emerald-500/10" : booking.status === "in-progress" ? "bg-primary/10" : "bg-blue-500/10"
      )}>
        {booking.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> :
         booking.status === "in-progress" ? <Timer className="h-5 w-5 text-primary" /> :
         <Calendar className="h-5 w-5 text-blue-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{booking.customerName}</p>
          <Badge className={cn("text-[9px] rounded-md", bookingStatusStyles[booking.status])}>
            {booking.status === "in-progress" ? "In Progress" : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{booking.service} · {booking.salonName}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.timeSlot}</span>
        </div>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-sm font-serif font-bold">₹{booking.amount.toLocaleString("en-IN")}</p>
        <Badge variant="outline" className={cn("text-[8px] mt-1",
          booking.paymentStatus === "paid" ? "text-emerald-500 border-emerald-500/20" : "text-amber-500 border-amber-500/20"
        )}>{booking.paymentStatus === "paid" ? "Paid" : "Pending"}</Badge>
      </div>
    </div>
  );
}

export default function FreelancerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const { data: vendorData, isLoading: vendorLoading } = useVendorDetail("freelancer", id ?? "");
  const { data: allAssignments } = useAssignments({ limit: 100 });
  const assignmentsForThis = (allAssignments ?? []).filter((a) => a.freelancer_id === id);
  const apiFreelancer: any = vendorData ?? null;

  const freelancer = apiFreelancer ? {
    id: apiFreelancer.id ?? id,
    name:
      apiFreelancer.business_name ??
      apiFreelancer.display_name ??
      apiFreelancer.name ??
      apiFreelancer.full_name ??
      "Unknown",
    photo: apiFreelancer.logo_url ?? apiFreelancer.photo ?? apiFreelancer.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    categories:
      apiFreelancer.categories ??
      apiFreelancer.service_categories ??
      (apiFreelancer.category ? [apiFreelancer.category] : []),
    subcategories: apiFreelancer.subcategories ?? [],
    rating: Number(apiFreelancer.avg_rating ?? apiFreelancer.rating ?? 0),
    distance: Number(apiFreelancer.distance_km ?? apiFreelancer.distance ?? 0),
    isOnline: apiFreelancer.is_open_to_work ?? apiFreelancer.is_online ?? apiFreelancer.isOnline ?? false,
    commissionRate: apiFreelancer.commission_percentage ?? apiFreelancer.commission_rate ?? 20,
    totalEarnings: apiFreelancer.total_earnings ?? 0,
    verified: apiFreelancer.is_verified ?? apiFreelancer.verified ?? apiFreelancer.kyc_verified ?? false,
    serviceHistory: apiFreelancer.review_count ?? apiFreelancer.service_history ?? 0,
    joinedAt: apiFreelancer.joined_at ?? apiFreelancer.created_at ?? new Date().toISOString(),
  } : null;

  const profile = apiFreelancer ? {
    ...freelancer,
    phone: apiFreelancer.phone ?? apiFreelancer.phone_number ?? "",
    email: apiFreelancer.email ?? "",
    bio: apiFreelancer.bio ?? apiFreelancer.description ?? "",
    city: apiFreelancer.city ?? "—",
    joinedAt: apiFreelancer.joined_at ?? apiFreelancer.created_at ?? new Date().toISOString(),
  } : null;

  if (vendorLoading) {
    return (
      <div className="px-4 py-16 text-center text-muted-foreground text-sm">Loading freelancer profile…</div>
    );
  }

  if (!freelancer || !profile) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-lg font-semibold">Freelancer not found</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate("/freelancers")}><ArrowLeft className="h-4 w-4 mr-2" />Back to Freelancers</Button>
      </div>
    );
  }

  // Performance metrics aren't wired to a backend endpoint yet — `perf`
  // is null and every usage falls through the `?.` chain to undefined.
  // The shape is declared so TS can type the chained reads instead of
  // erroring on property access through `null`.
  type FreelancerPerf = {
    rating: number;
    completionRate: number;
    repeatCustomers: number;
    avgTime: number;
    cancelRate: number;
    responseTime: number;
    monthlyServices: number[];
  };
  const perf: FreelancerPerf | null = null;
  const feedback: Array<{
    rating: number;
    comment?: string;
    author?: string;
    customerName?: string;
    service?: string;
    salonName?: string;
    date?: string;
  }> = [];
  const schedule: any[] = [];
  const salonHistory: any[] = [];
  const bookings: any[] = [];
  const tenure = Math.round((Date.now() - new Date(profile.joinedAt).getTime()) / (1000 * 60 * 60 * 24 * 30));

  const servicesChart = perf?.monthlyServices.map((s, i) => ({ month: MONTHS[i], services: s })) || [];
  const ratingDistribution = feedback.reduce((acc, f) => { acc[f.rating - 1]++; return acc; }, [0, 0, 0, 0, 0]);

  const inProgressBookings = bookings.filter(b => b.status === "in-progress");
  const upcomingBookings = bookings.filter(b => b.status === "pending" || b.status === "accepted");
  const completedBookings = bookings.filter(b => b.status === "completed");

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1200px]">
      <FadeIn>
        <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground rounded-xl" onClick={() => navigate("/freelancers")}>
          <ArrowLeft className="h-4 w-4" />Back to Freelancers
        </Button>
      </FadeIn>

      {/* ── PROFILE HEADER ── */}
      <FadeIn delay={0.05}>
        <Card className="border-border/40 mb-6">
          <CardContent className="p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative shrink-0">
                <Avatar className="h-20 w-20 lg:h-24 lg:w-24 rounded-2xl border-2 border-border/40">
                  <AvatarImage src={profile.photo} alt={profile.name} className="object-cover" />
                  <AvatarFallback className="rounded-2xl text-xl">{profile.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div className={cn("absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-3 border-card flex items-center justify-center",
                  profile.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}>
                  {profile.isOnline ? <Wifi className="h-2.5 w-2.5 text-white" /> : <WifiOff className="h-2.5 w-2.5 text-white" />}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-xl lg:text-2xl font-bold tracking-tight">{profile.name}</h1>
                      {profile.verified ? <ShieldCheck className="h-5 w-5 text-emerald-500" /> : <ShieldAlert className="h-5 w-5 text-amber-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{profile.categories.join(", ")} Specialist · Freelancer</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-lg">{profile.bio}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {profile.verified ? <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">✓ Verified</Badge> : <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/20">Unverified</Badge>}
                      <Badge className={cn("text-[10px]", profile.isOnline ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground")}>
                        {profile.isOnline ? "Online" : "Offline"}
                      </Badge>
                      {perf && <Badge className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20"><Star className="h-2.5 w-2.5 mr-0.5 fill-amber-500" />{perf.rating}</Badge>}
                      <Badge variant="outline" className="text-[10px] text-muted-foreground"><MapPin className="h-2.5 w-2.5 mr-1" />{profile.distance}km · {profile.city}</Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">{tenure} months on platform</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl h-9" onClick={() => { navigator.clipboard.writeText(profile.phone); toast.success("Phone copied!"); }}>
                      <Phone className="h-3.5 w-3.5" />Call
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl h-9" onClick={() => toast.info(`Chat with ${profile.name}...`)}>
                      <MessageCircle className="h-3.5 w-3.5" />Message
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 rounded-xl h-9"
                      onClick={() => setRequestDialogOpen(true)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />Send Request
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{profile.phone}
                    <button onClick={() => { navigator.clipboard.writeText(profile.phone); toast.success("Copied!"); }}><Copy className="h-3 w-3 opacity-40 hover:opacity-100 transition-opacity" /></button>
                  </span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{profile.email}
                    <button onClick={() => { navigator.clipboard.writeText(profile.email); toast.success("Copied!"); }}><Copy className="h-3 w-3 opacity-40 hover:opacity-100 transition-opacity" /></button>
                  </span>
                </div>
              </div>
            </div>
            {/* Quick Stats — only what matters to salon owner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-border/30">
              {[
                { label: "Services Done", value: profile.serviceHistory, icon: Briefcase, accent: "text-primary" },
                { label: "Rating", value: perf?.rating || 0, icon: Star, accent: "text-amber-500" },
                { label: "Completion", value: `${perf?.completionRate || 0}%`, icon: CheckCircle2, accent: "text-emerald-500" },
                { label: "Avg Time", value: `${perf?.avgTime || 0}m`, icon: Timer, accent: "text-blue-500" },
                { label: "Response", value: `${perf?.responseTime || 0}m`, icon: Clock, accent: "text-blue-500" },
                { label: "Distance", value: `${profile.distance}km`, icon: MapPin, accent: "text-muted-foreground" },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-muted/30 p-3 text-center">
                  <s.icon className={cn("h-4 w-4 mx-auto mb-1.5", s.accent)} />
                  <p className="text-lg font-serif font-bold">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* ── TABS ── */}
      <FadeIn delay={0.1}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 mb-5">
            <TabsList className="h-10 rounded-xl bg-muted/50 w-max">
              <TabsTrigger value="overview" className="text-xs rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="bookings" className="text-xs rounded-lg relative">
                Bookings{bookings.length > 0 && <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary/20 text-primary text-[8px] font-bold">{bookings.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs rounded-lg">
                Reviews{feedback.length > 0 && <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-amber-500/20 text-amber-500 text-[8px] font-bold">{feedback.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="availability" className="text-xs rounded-lg">Availability</TabsTrigger>
            </TabsList>
          </div>

          {/* ════════ OVERVIEW ════════ */}
          <TabsContent value="overview" className="mt-0 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Performance snapshot */}
              <Card className="border-border/40">
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Performance Snapshot</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {perf && [
                    { label: "Completion Rate", value: `${perf.completionRate}%`, pct: perf.completionRate },
                    { label: "Repeat Customers", value: `${perf.repeatCustomers}%`, pct: perf.repeatCustomers },
                    { label: "Avg Service Time", value: `${perf.avgTime} min`, pct: Math.min(100, (perf.avgTime / 90) * 100) },
                    { label: "Cancel Rate", value: `${perf.cancelRate}%`, pct: perf.cancelRate },
                    { label: "Response Time", value: `${perf.responseTime} min`, pct: Math.min(100, (perf.responseTime / 15) * 100) },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">{m.label}</span>
                        <span className="text-xs font-semibold">{m.value}</span>
                      </div>
                      <Progress value={m.pct} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Salon History */}
              <Card className="border-border/40">
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Store className="h-4 w-4 text-primary" />Salon Partnerships</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {salonHistory.map((salon, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Store className="h-4 w-4 text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{salon.salonName}</p>
                          <p className="text-[10px] text-muted-foreground">{salon.assignmentsCompleted} assignments · Last: {new Date(salon.lastAssignment).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-0.5 justify-end"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /><span className="text-xs font-semibold">{salon.rating}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Specializations */}
              <Card className="border-border/40">
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" />Specializations</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.categories.map(c => <Badge key={c} className="text-xs bg-primary/10 text-primary border-primary/20">{c}</Badge>)}
                    {profile.subcategories.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                </CardContent>
              </Card>

              {/* Services Trend */}
              <Card className="border-border/40">
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />Services Completed (Monthly)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={servicesChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        <Bar dataKey="services" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ════════ BOOKINGS ════════ */}
          <TabsContent value="bookings" className="mt-0 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: bookings.length, icon: CalendarDays, accent: "text-primary", bg: "bg-primary/10" },
                { label: "In Progress", value: inProgressBookings.length, icon: Timer, accent: "text-primary", bg: "bg-primary/10" },
                { label: "Upcoming", value: upcomingBookings.length, icon: Calendar, accent: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Completed", value: completedBookings.length, icon: CheckCircle2, accent: "text-emerald-500", bg: "bg-emerald-500/10" },
              ].map(s => (
                <Card key={s.label} className="border-border/40">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}><s.icon className={cn("h-4 w-4", s.accent)} /></div>
                    <div><p className="text-lg font-serif font-bold">{s.value}</p><p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {inProgressBookings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary animate-pulse" />Currently Working On</h3>
                <div className="space-y-2">{inProgressBookings.map(b => <BookingRow key={b.id} booking={b} />)}</div>
              </div>
            )}
            {upcomingBookings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" />Upcoming</h3>
                <div className="space-y-2">{upcomingBookings.map(b => <BookingRow key={b.id} booking={b} />)}</div>
              </div>
            )}
            {completedBookings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><History className="h-4 w-4 text-muted-foreground" />Completed</h3>
                <div className="space-y-2">{completedBookings.map(b => <BookingRow key={b.id} booking={b} />)}</div>
              </div>
            )}
            {bookings.length === 0 && (
              <div className="p-12 text-center rounded-xl border border-dashed border-border/40">
                <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No bookings assigned</p>
              </div>
            )}
          </TabsContent>

          {/* ════════ REVIEWS ════════ */}
          <TabsContent value="reviews" className="mt-0 space-y-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="border-border/40 lg:col-span-1">
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Rating Overview</CardTitle></CardHeader>
                <CardContent className="text-center">
                  <p className="text-5xl font-serif font-bold text-amber-500">{perf?.rating || 0}</p>
                  <StarRating rating={Math.round(perf?.rating || 0)} />
                  <p className="text-xs text-muted-foreground mt-2">{feedback.length} reviews</p>
                  <Separator className="my-4 bg-border/30" />
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground w-4">{star}★</span>
                        <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${feedback.length > 0 ? (ratingDistribution[star - 1] / feedback.length) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-4 text-right">{ratingDistribution[star - 1]}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 lg:col-span-2">
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Customer Reviews</CardTitle></CardHeader>
                <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                  {feedback.length > 0 ? feedback.map((fb, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border/25 bg-muted/5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{fb.customerName}</p>
                            <StarRating rating={fb.rating} />
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{fb.service} · {fb.salonName}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{new Date(fb.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{fb.comment}</p>
                    </div>
                  )) : (
                    <div className="p-8 text-center"><MessageSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No reviews yet</p></div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ════════ AVAILABILITY ════════ */}
          <TabsContent value="availability" className="mt-0 space-y-5">
            <Card className="border-border/40">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Weekly Availability</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {schedule.map((day, i) => (
                    <div key={i} className={cn("flex items-center gap-4 p-3 rounded-xl border transition-all",
                      day.available ? "border-border/30 bg-card" : "border-border/10 bg-muted/10 opacity-50"
                    )}>
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0",
                        day.available ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"
                      )}>{day.day}</div>
                      <div className="flex-1">
                        {day.available ? (
                          <>
                            <p className="text-sm font-medium">{day.start} — {day.end}</p>
                            <p className="text-[11px] text-muted-foreground">{day.bookedSlots} slots booked</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Unavailable</p>
                        )}
                      </div>
                      <Badge variant={day.available ? "default" : "secondary"} className={cn("text-[9px]",
                        day.available ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : ""
                      )}>
                        {day.available ? "Available" : "Off"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </FadeIn>

      {/* Recent assignment requests for THIS freelancer */}
      {assignmentsForThis.length > 0 && (
        <FadeIn delay={0.15}>
          <Card className="border-border/40 mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />Your assignment requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignmentsForThis.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {a.service_category ?? 'Service'} · ₹{Number(a.proposed_amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(a.start_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      {' – '}
                      {new Date(a.end_time).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      'text-[10px] capitalize',
                      a.status === 'completed' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                      a.status === 'in_progress' && 'bg-primary/10 text-primary border-primary/20',
                      a.status === 'accepted' && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                      a.status === 'requested' && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                      (a.status === 'declined' || a.status === 'cancelled') &&
                        'bg-muted text-muted-foreground',
                    )}
                  >
                    {a.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Composer */}
      <RequestAssignmentDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        freelancerId={String(id)}
        freelancerName={freelancer.name}
      />
    </div>
  );
}
