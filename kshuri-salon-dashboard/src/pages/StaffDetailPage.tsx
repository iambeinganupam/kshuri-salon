/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FadeIn } from "@kshuri/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, Mail, ShieldCheck, ShieldAlert, Briefcase,
  Star, Calendar, Copy, MessageCircle, Clock, IndianRupee,
  GraduationCap, CalendarDays, TrendingUp,
  FileText, Banknote, Receipt,
  CheckCircle2, Timer, Edit3, Save, X, Bell,
  Send, MessageSquare,
  LogIn, LogOut, AlertCircle,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  useStaffMember,
  useStaffSchedule,
  useStaffAttendance,
  useStaffAppointments,
  useStaffSalary,
  useUpdateStaff,
} from "@kshuri/api-client/hooks";
import { cn } from "@/lib/utils";

const bookingStatusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const clockStatusStyles: Record<string, string> = {
  on_time: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  late: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  absent: "bg-destructive/10 text-destructive border-destructive/20",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={cn("h-3.5 w-3.5", s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
      ))}
    </div>
  );
}

function EmptySlate({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <div className="p-10 text-center rounded-xl border border-dashed border-border/40">
      <Icon className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ role: "", commission_percentage: "" });
  const [sendNotifMsg, setSendNotifMsg] = useState("");
  const [sendNotifType, setSendNotifType] = useState("announcement");

  const staffId = id ?? "";
  const { data: staffRaw, isLoading: staffLoading } = useStaffMember(staffId);
  const { data: scheduleRaw = [] } = useStaffSchedule(staffId);
  const { data: attendanceRaw = [] } = useStaffAttendance(staffId);
  const { data: appointmentsRaw = [] } = useStaffAppointments(staffId);
  const { data: salaryRaw } = useStaffSalary(staffId);
  const updateStaffMutation = useUpdateStaff();

  const staff: any = Array.isArray(staffRaw) ? staffRaw[0] : staffRaw;
  const schedule: any[] = Array.isArray(scheduleRaw) ? scheduleRaw : [];
  const attendance: any[] = Array.isArray(attendanceRaw) ? attendanceRaw : [];
  const appointments: any[] = Array.isArray(appointmentsRaw) ? appointmentsRaw : [];
  const salary: any = salaryRaw ?? null;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingBookings = appointments.filter(a => {
    const d = (a.start_time ?? a.scheduled_at ?? "").slice(0, 10);
    return d >= today && a.status !== "completed" && a.status !== "cancelled";
  });
  const pastBookings = appointments.filter(a => a.status === "completed");
  const inProgressBookings = appointments.filter(a => a.status === "in_progress");

  const joinedAt = staff?.created_at ?? staff?.joined_at ?? null;
  const tenure = joinedAt
    ? Math.round((Date.now() - new Date(joinedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  const fullName = [staff?.first_name, staff?.last_name].filter(Boolean).join(" ")
    || staff?.name
    || staff?.email
    || "Staff Member";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;

  const earningsChart = [0, 0, 0].map((_, i) => ({
    month: ["Jan", "Feb", "Mar"][i],
    earnings: 0,
  }));

  const saveEdit = () => {
    if (!staff) return;
    updateStaffMutation.mutate(
      { staffId: staff.id, payload: { role: editForm.role as any, commission_percentage: Number(editForm.commission_percentage) } },
      {
        onSuccess: () => { setIsEditing(false); toast.success("Staff profile updated!"); },
        onError: () => toast.error("Failed to update staff profile"),
      },
    );
  };

  const startEdit = () => {
    setEditForm({
      role: staff?.role ?? "",
      commission_percentage: String(staff?.commission_percentage ?? 0),
    });
    setIsEditing(true);
  };

  const handleToggleActive = () => {
    if (!staff) return;
    const isActive = staff.is_active !== false;
    if (isActive && !window.confirm("Are you sure you want to deactivate this staff member?")) return;
    updateStaffMutation.mutate(
      { staffId: staff.id, payload: { is_active: !isActive } },
      {
        onSuccess: () => toast.success(`Staff member ${!isActive ? 'activated' : 'deactivated'}!`),
        onError: () => toast.error("Failed to update staff status"),
      }
    );
  };

  if (staffLoading) {
    return (
      <div className="px-4 py-16 text-center text-muted-foreground text-sm">
        Loading staff profile…
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-lg font-semibold">Staff member not found</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate("/staff")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Staff
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1200px]">
      <FadeIn>
        <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground rounded-xl" onClick={() => navigate("/staff")}>
          <ArrowLeft className="h-4 w-4" />Back to Staff
        </Button>
      </FadeIn>

      {/* ── PROFILE HEADER ── */}
      <FadeIn delay={0.05}>
        <Card className="border-border/40 mb-6">
          <CardContent className="p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative shrink-0">
                <Avatar className="h-20 w-20 lg:h-24 lg:w-24 rounded-2xl border-2 border-border/40">
                  <AvatarImage src={staff.avatar_url ?? avatarUrl} alt={fullName} className="object-cover" />
                  <AvatarFallback className="rounded-2xl text-xl">{initials}</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card ${staff.is_active !== false ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className="h-8 rounded-xl text-sm w-48" placeholder="Role" />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground">Commission %</label>
                          <Input
                            type="number"
                            value={editForm.commission_percentage}
                            onChange={e => setEditForm(p => ({ ...p, commission_percentage: e.target.value }))}
                            className="h-8 rounded-xl text-sm w-24"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">{fullName}</h1>
                          {staff.is_active !== false ? <ShieldCheck className="h-5 w-5 text-emerald-500" /> : <ShieldAlert className="h-5 w-5 text-amber-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{staff.role ?? "Staff"}</p>
                      </>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={cn("text-[10px]", staff.is_active !== false ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20")}>
                        {staff.is_active !== false ? "✓ Active" : "Inactive"}
                      </Badge>
                      {joinedAt && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          <Calendar className="h-2.5 w-2.5 mr-1" />
                          Joined {new Date(joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </Badge>
                      )}
                      {tenure > 0 && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">{tenure} months tenure</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button size="sm" className="gap-1.5 rounded-xl h-9" onClick={saveEdit} disabled={updateStaffMutation.isPending}>
                          <Save className="h-3.5 w-3.5" />Save
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl h-9" onClick={() => setIsEditing(false)}>
                          <X className="h-3.5 w-3.5" />Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl h-9" onClick={startEdit}>
                          <Edit3 className="h-3.5 w-3.5" />Edit
                        </Button>
                        <Button size="sm" variant={staff.is_active !== false ? "destructive" : "default"} className="gap-1.5 rounded-xl h-9" onClick={handleToggleActive} disabled={updateStaffMutation.isPending}>
                          {staff.is_active !== false ? (
                            <><AlertCircle className="h-3.5 w-3.5" /> Deactivate</>
                          ) : (
                            <><CheckCircle2 className="h-3.5 w-3.5" /> Reactivate</>
                          )}
                        </Button>
                        {staff.phone_number && (
                          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl h-9" onClick={() => { navigator.clipboard.writeText(staff.phone_number); toast.success("Phone copied!"); }}>
                            <Phone className="h-3.5 w-3.5" />Call
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl h-9" onClick={() => toast.info(`Chat with ${fullName.split(" ")[0]}…`)}>
                          <MessageCircle className="h-3.5 w-3.5" />Message
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                  {staff.phone_number && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />{staff.phone_number}
                      <button onClick={() => { navigator.clipboard.writeText(staff.phone_number); toast.success("Copied!"); }}>
                        <Copy className="h-3 w-3 opacity-40 hover:opacity-100 transition-opacity" />
                      </button>
                    </span>
                  )}
                  {staff.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />{staff.email}
                      <button onClick={() => { navigator.clipboard.writeText(staff.email); toast.success("Copied!"); }}>
                        <Copy className="h-3 w-3 opacity-40 hover:opacity-100 transition-opacity" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border/30">
              {[
                { label: "Total Assigned", value: appointments.length, icon: Briefcase, accent: "text-primary" },
                { label: "Completed", value: pastBookings.length, icon: CheckCircle2, accent: "text-emerald-500" },
                { label: "Active Now", value: inProgressBookings.length + upcomingBookings.length, icon: CalendarDays, accent: "text-blue-500" },
                { label: "Commission %", value: `${staff.commission_percentage ?? 0}%`, icon: IndianRupee, accent: "text-emerald-500" },
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
                Bookings
                {appointments.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary/20 text-primary text-[8px] font-bold">
                    {appointments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="attendance" className="text-xs rounded-lg">Attendance</TabsTrigger>
              <TabsTrigger value="salary" className="text-xs rounded-lg">Salary</TabsTrigger>
              <TabsTrigger value="feedback" className="text-xs rounded-lg">Feedback</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs rounded-lg">Alerts</TabsTrigger>
            </TabsList>
          </div>

          {/* ════════ OVERVIEW ════════ */}
          <TabsContent value="overview" className="mt-0 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Booking summary */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Total Bookings", value: appointments.length, max: Math.max(appointments.length, 1) },
                    { label: "Completed", value: pastBookings.length, max: Math.max(appointments.length, 1) },
                    { label: "In Progress", value: inProgressBookings.length, max: Math.max(appointments.length, 1) },
                    { label: "Upcoming", value: upcomingBookings.length, max: Math.max(appointments.length, 1) },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">{m.label}</span>
                        <span className="text-xs font-semibold">{m.value}</span>
                      </div>
                      <Progress value={m.max > 0 ? Math.round((m.value / m.max) * 100) : 0} className="h-1.5" />
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No appointment data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Salary snapshot */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-emerald-500" />This Month — Salary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salary ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Services", value: salary.completed_this_month, color: "text-foreground" },
                        { label: "Revenue", value: `₹${Number(salary.revenue_this_month).toLocaleString("en-IN")}`, color: "text-foreground" },
                        { label: "Commission", value: `₹${Number(salary.commission_this_month).toLocaleString("en-IN")}`, color: "text-emerald-500" },
                        { label: "Net Pay", value: `₹${Number(salary.net_pay).toLocaleString("en-IN")}`, color: "text-primary" },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl bg-muted/30 p-3">
                          <p className={cn("text-lg font-serif font-bold", s.color)}>{s.value}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptySlate icon={IndianRupee} label="No salary data available" />
                  )}
                </CardContent>
              </Card>

              {/* Schedule snapshot */}
              <Card className="border-border/40 lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {schedule.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {schedule.slice(0, 14).map((shift: any, i: number) => (
                        <div key={i} className={cn("rounded-xl px-3 py-2 text-center border min-w-[90px]",
                          shift.type === "time_off" ? "bg-muted/20 border-border/20" : "bg-card border-border/30"
                        )}>
                          <p className="text-xs font-semibold mb-0.5">
                            {new Date(shift.shift_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                          {shift.type === "time_off" ? (
                            <p className="text-[10px] text-muted-foreground">Off</p>
                          ) : (
                            <p className="text-[10px] text-primary font-medium">{shift.start_time} – {shift.end_time}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptySlate icon={CalendarDays} label="No schedule configured" />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ════════ BOOKINGS ════════ */}
          <TabsContent value="bookings" className="mt-0 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Assigned", value: appointments.length, icon: CalendarDays, accent: "text-primary", bg: "bg-primary/10" },
                { label: "In Progress", value: inProgressBookings.length, icon: Timer, accent: "text-primary", bg: "bg-primary/10" },
                { label: "Upcoming", value: upcomingBookings.length, icon: Calendar, accent: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Completed", value: pastBookings.length, icon: CheckCircle2, accent: "text-emerald-500", bg: "bg-emerald-500/10" },
              ].map(s => (
                <Card key={s.label} className="border-border/40">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                      <s.icon className={cn("h-4 w-4", s.accent)} />
                    </div>
                    <div>
                      <p className="text-lg font-serif font-bold">{s.value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {appointments.length === 0 ? (
              <EmptySlate icon={CalendarDays} label="No bookings assigned yet" />
            ) : (
              <Card className="border-border/40">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/20">
                    {appointments.map((appt: any) => (
                      <div key={appt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                          appt.status === "completed" ? "bg-emerald-500/10" : appt.status === "in_progress" ? "bg-primary/10" : "bg-blue-500/10"
                        )}>
                          {appt.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                           appt.status === "in_progress" ? <Timer className="h-4 w-4 text-primary" /> :
                           <Calendar className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{appt.customer_name ?? "Customer"}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {(appt.service_names ?? []).join(", ") || "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {(appt.start_time ?? appt.scheduled_at)
                              ? new Date(appt.start_time ?? appt.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                              : "—"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge className={cn("text-[9px] rounded-md", bookingStatusStyles[appt.status] ?? bookingStatusStyles.pending)}>
                            {appt.status?.replace("_", " ") ?? "Pending"}
                          </Badge>
                          {appt.total_amount > 0 && (
                            <p className="text-sm font-serif font-bold mt-1">₹{Number(appt.total_amount).toLocaleString("en-IN")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ════════ ATTENDANCE ════════ */}
          <TabsContent value="attendance" className="mt-0 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Clock-in/out log */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-primary" />Clock-In / Clock-Out Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attendance.length > 0 ? (
                    <div className="rounded-xl border border-border/30 overflow-hidden">
                      <div className="grid grid-cols-5 gap-1 px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium bg-muted/20">
                        <span>Date</span><span>In</span><span>Out</span><span>Hours</span><span className="text-right">Status</span>
                      </div>
                      {attendance.map((rec: any, i: number) => {
                        const hoursWorked = rec.clock_out_at
                          ? Math.round((new Date(rec.clock_out_at).getTime() - new Date(rec.clock_in_at).getTime()) / 3600000 * 10) / 10
                          : null;
                        const clockInHour = new Date(rec.clock_in_at).getHours();
                        const isLate = clockInHour >= 10;
                        const statusKey = rec.clock_out_at ? (isLate ? "late" : "on_time") : "on_time";
                        return (
                          <div key={i} className="grid grid-cols-5 gap-1 px-4 py-3 text-sm items-center border-t border-border/15">
                            <span className="text-xs font-medium">
                              {new Date(rec.date ?? rec.clock_in_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {new Date(rec.clock_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {rec.clock_out_at ? new Date(rec.clock_out_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}
                            </span>
                            <span className="text-xs text-muted-foreground">{hoursWorked != null ? `${hoursWorked}h` : "—"}</span>
                            <div className="text-right">
                              <Badge className={cn("text-[8px] rounded-md", clockStatusStyles[statusKey] ?? clockStatusStyles.on_time)}>
                                {statusKey === "on_time" ? "On Time" : "Late"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptySlate icon={LogOut} label="No attendance records yet" />
                  )}
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />Upcoming Shifts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {schedule.length > 0 ? (
                    <div className="space-y-2">
                      {schedule.slice(0, 10).map((shift: any, i: number) => (
                        <div key={i} className={cn("flex items-center gap-3 p-3 rounded-xl border",
                          shift.type === "time_off" ? "border-border/20 bg-muted/20" : "border-border/30 bg-card"
                        )}>
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            shift.type === "time_off" ? "bg-muted/50" : "bg-primary/10"
                          )}>
                            {shift.type === "time_off" ? <X className="h-4 w-4 text-muted-foreground" /> : <Clock className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold">
                              {new Date(shift.shift_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {shift.type === "time_off" ? "Day off" : `${shift.start_time} – ${shift.end_time}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <EmptySlate icon={CalendarDays} label="No schedule configured" />
                      <Button size="sm" variant="outline" className="w-full mt-3 rounded-xl text-xs" onClick={() => toast.info("Schedule editor coming soon!")}>
                        Set Schedule
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ════════ SALARY ════════ */}
          <TabsContent value="salary" className="mt-0 space-y-5">
            {salary ? (
              <>
                <div className="grid gap-5 lg:grid-cols-2">
                  <Card className="border-primary/20 bg-primary/[0.02]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-primary" />This Month Payout
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-2">
                        <p className="text-4xl font-serif font-bold text-primary">
                          ₹{Number(salary.net_pay).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Net Pay — {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <Separator className="my-4 bg-border/30" />
                      <div className="space-y-2.5">
                        {[
                          { label: "Base Salary", value: salary.base_salary },
                          { label: `Commission (${salary.commission_percentage}%)`, value: salary.commission_this_month, color: "text-emerald-500" },
                        ].map(item => (
                          <div key={item.label} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className={cn("font-serif font-semibold", item.color)}>
                              ₹{Number(item.value ?? 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />Service Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Services this month", value: salary.completed_this_month },
                        { label: "Revenue generated", value: `₹${Number(salary.revenue_this_month).toLocaleString("en-IN")}` },
                        { label: "Commission rate", value: `${salary.commission_percentage}%` },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between text-sm rounded-xl bg-muted/20 px-4 py-3">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" className="w-full gap-1.5 rounded-xl mt-2" onClick={() => toast.info("Payment processing coming soon!")}>
                        <Banknote className="h-3.5 w-3.5" />Process Payment
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Earnings trend chart */}
                <Card className="border-border/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-emerald-500" />Earnings Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {earningsChart.every(e => e.earnings === 0) ? (
                      <EmptySlate icon={IndianRupee} label="Historical earnings data will appear here" />
                    ) : (
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={earningsChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${v}k`} />
                            <Tooltip formatter={(v: number) => [`₹${v}k`, "Earnings"]} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                            <Area type="monotone" dataKey="earnings" stroke="hsl(152, 56%, 39%)" fill="hsl(152, 56%, 39%)" fillOpacity={0.15} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="p-12 text-center rounded-xl border border-dashed border-border/40">
                <IndianRupee className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No salary info configured</p>
                <Button size="sm" variant="outline" className="mt-3 rounded-xl" onClick={() => toast.info("Salary setup coming soon!")}>
                  Configure Salary
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ════════ FEEDBACK ════════ */}
          <TabsContent value="feedback" className="mt-0 space-y-5">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />Rating Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staff.rating != null ? (
                  <div className="text-center py-4">
                    <p className="text-5xl font-serif font-bold text-amber-500">{Number(staff.rating).toFixed(1)}</p>
                    <StarRating rating={Math.round(staff.rating)} />
                    <p className="text-xs text-muted-foreground mt-2">Based on customer reviews</p>
                  </div>
                ) : (
                  <EmptySlate icon={Star} label="No rating data yet" />
                )}
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />Customer Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptySlate icon={MessageSquare} label="Customer reviews will appear here as bookings are completed" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ NOTIFICATIONS / ALERTS ════════ */}
          <TabsContent value="notifications" className="mt-0 space-y-5">
            {/* Send notification */}
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />Send Notification to {fullName.split(" ")[0]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-3">
                  <Select value={sendNotifType} onValueChange={setSendNotifType}>
                    <SelectTrigger className="w-40 h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="schedule">Schedule Change</SelectItem>
                      <SelectItem value="booking">Booking Update</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder={`Type a message to send to ${fullName.split(" ")[0]}…`}
                  value={sendNotifMsg}
                  onChange={e => setSendNotifMsg(e.target.value)}
                  className="rounded-xl text-sm min-h-[60px] resize-none"
                />
                <Button
                  size="sm"
                  className="mt-3 gap-1.5 rounded-xl"
                  onClick={() => {
                    if (!sendNotifMsg.trim()) { toast.error("Please enter a message"); return; }
                    toast.success(`Notification sent to ${fullName.split(" ")[0]}`);
                    setSendNotifMsg("");
                  }}
                >
                  <Send className="h-3.5 w-3.5" />Send
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />Notification History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptySlate icon={AlertCircle} label="Notifications sent to this staff member will appear here" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}
