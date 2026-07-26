/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FadeIn, StaggerContainer, StaggerItem } from "@kshuri/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus, Search, ShieldCheck, ShieldAlert, Briefcase,
  Star, Users, UserCheck, AlertCircle, TrendingUp, Calendar,
  ChevronRight, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffList, useInviteStaff } from "@kshuri/api-client/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@kshuri/api-client";

interface Staff {
  id: string; name: string; role?: string; status?: string; avatar?: string;
  phone?: string; email?: string; rating?: number; totalEarnings?: number;
  completedJobs?: number; joinedAt?: string;
  serviceHistory: number;
  verified: boolean;
}



// ─── Staff Card ──────────────────────────────────────────────────
function StaffCard({ staff, onClick }: { staff: Staff; onClick: () => void }) {
  const performanceScore = Math.min(100, Math.round((staff.serviceHistory / 400) * 100));
  const perf: any = null;

  return (
    <Card className="border-border/40 cursor-pointer hover:shadow-md transition-all duration-300 group" onClick={onClick}>
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start gap-3">
          <div className="relative">
            <img src={staff.avatar} alt={staff.name} className="h-12 w-12 rounded-xl object-cover border-2 border-border/40 group-hover:border-primary/30 transition-colors" />
            <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${staff.verified ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{staff.name}</p>
              {staff.verified ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{staff.role}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Briefcase className="h-3 w-3" />{staff.serviceHistory}</span>
              {perf && <span className="flex items-center gap-1 text-[11px] text-amber-400"><Star className="h-3 w-3 fill-amber-400" />{perf.rating}</span>}
              {perf && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><TrendingUp className="h-3 w-3" />{perf.repeatCustomers}% repeat</span>}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground transition-colors" />
        </div>

        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-muted-foreground">Performance</span>
            <span className="font-semibold text-foreground">{performanceScore}%</span>
          </div>
          <Progress value={performanceScore} className="h-1" />
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Calendar className="h-3 w-3" /> Joined {new Date(staff.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </span>
          {/* eslint-disable-next-line no-constant-binary-expression -- placeholder block; certifications feature pending backend wiring */}
          {false && (
            <Badge variant="outline" className="text-[8px] rounded-full gap-0.5">
              <GraduationCap className="h-2.5 w-2.5" />
              0 certs
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ────────────────────────────────────────────────────────
export default function StaffPage() {
  const navigate = useNavigate();
  const staffResult = useStaffList();
  const inviteStaff = useInviteStaff();
  const apiClient = useApiClient();
  
  const { data: locationsResult } = useQuery({
    queryKey: ['business-locations'],
    queryFn: () => apiClient.get('/business/locations').then(res => res.data.data),
  });
  const locations = Array.isArray(locationsResult) ? locationsResult : [];

  const rawStaffList = Array.isArray(staffResult?.data) ? staffResult.data : [];
  const staffList: Staff[] = rawStaffList.map((s: any) => ({
    id: s.id,
    name: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || 'Unknown',
    email: s.email,
    avatar: s.avatar_url,
    role: s.role,
    status: s.is_active ? 'active' : 'inactive',
    verified: true,
    serviceHistory: 0,
    joinedAt: s.created_at ?? new Date().toISOString(),
  }));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("junior_stylist");
  const [inviteCommission, setInviteCommission] = useState("40");
  const [inviteLocation, setInviteLocation] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.role || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "verified" && s.verified) || (filter === "unverified" && !s.verified);
    return matchesSearch && matchesFilter;
  });

  const verifiedCount = staffList.filter(s => s.verified).length;
  const totalServices = staffList.reduce((t, s) => t + (s.serviceHistory || 0), 0);
  // Compute average from actual staff ratings; fall back to null when nobody is rated yet
  // so the tile renders "—" instead of an inherited placeholder number.
  const ratedStaff = staffList
    .map(s => Number((s as { rating?: number | null }).rating ?? NaN))
    .filter(r => Number.isFinite(r) && r > 0);
  const avgRating: number | null = ratedStaff.length > 0
    ? ratedStaff.reduce((sum, r) => sum + r, 0) / ratedStaff.length
    : null;

  const handleInviteStaff = async () => {
    if (!inviteEmail || !inviteLocation) {
      toast.error("Please enter email and select a location");
      return;
    }
    try {
      await inviteStaff.mutateAsync({
        email: inviteEmail,
        role: inviteRole as any,
        commission_percentage: parseInt(inviteCommission) || 0,
        location_id: inviteLocation,
      });
      toast.success("Staff invite sent!");
      setAddOpen(false);
      setInviteEmail("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send invite");
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1440px] mx-auto">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Staff</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{staffList.length} members · {verifiedCount} verified</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-9 rounded-xl"><Plus className="h-4 w-4" /> Add Staff</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Staff Email Address *" type="email" className="h-10 rounded-xl" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="senior_stylist">Senior Stylist</SelectItem>
                    <SelectItem value="junior_stylist">Junior Stylist</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Commission Percentage (e.g. 40)" type="number" className="h-10 rounded-xl" value={inviteCommission} onChange={e => setInviteCommission(e.target.value)} />
                <Select value={inviteLocation} onValueChange={setInviteLocation}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Location *" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc: any) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.display_name}</SelectItem>
                    ))}
                    {locations.length === 0 && <SelectItem value="none" disabled>No locations found</SelectItem>}
                  </SelectContent>
                </Select>
                <Button className="w-full h-10 rounded-xl" onClick={handleInviteStaff}>Send Invite</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      {/* Summary */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Staff", value: staffList.length, icon: Users, iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
            { label: "Verified", value: verifiedCount, icon: UserCheck, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
            { label: "Total Services", value: totalServices, icon: TrendingUp, iconBg: "bg-primary/10", iconColor: "text-primary" },
            { label: "Avg Rating", value: avgRating != null ? avgRating.toFixed(1) : "—", icon: Star, iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/40">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.iconBg)}>
                  <s.icon className={cn("h-4 w-4", s.iconColor)} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-serif font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="h-10 rounded-xl bg-muted/50">
              <TabsTrigger value="all" className="text-xs rounded-lg">All</TabsTrigger>
              <TabsTrigger value="verified" className="text-xs rounded-lg gap-1"><ShieldCheck className="h-3 w-3" />Verified</TabsTrigger>
              <TabsTrigger value="unverified" className="text-xs rounded-lg gap-1"><AlertCircle className="h-3 w-3" />Pending</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </FadeIn>

      <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map(s => (
          <StaggerItem key={s.id}>
            <StaffCard staff={s} onClick={() => navigate(`/staff/${s.id}`)} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {filteredStaff.length === 0 && (
        <div className="py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><Search className="h-7 w-7 text-muted-foreground/50" /></div>
          <p className="text-sm font-medium">No staff found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
