/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FadeIn, StaggerContainer, StaggerItem } from "@kshuri/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Star, MapPin, Wifi, WifiOff, Search, Zap, TrendingUp, ArrowUpDown, ChevronRight,
} from "lucide-react";
import { useVendorSearch } from "@kshuri/api-client/hooks";
// Page-local view model. Mirrors the fields the card + filters actually
// read; the source rows come from `useVendorSearch` (the discovery API)
// which returns a wider, less-typed object.
interface Freelancer {
  id: string;
  name: string;
  photo: string;
  rating: number;
  distance: number;
  isOnline: boolean;
  categories: string[];
  subcategories: string[];
  commissionRate: number;
  totalEarnings: number;
  verified: boolean;
  serviceHistory: number;
  joinedAt: string;
  phone: string;
  email: string;
  bio: string;
  /** Optional / display-only flags retained from the legacy shape. */
  specialty?: string;
  completedJobs?: number;
  status?: string;
  avatar?: string;
  skills?: string[];
}
import { cn } from "@/lib/utils";

function FreelancerCard({ freelancer, onClick }: { freelancer: Freelancer; onClick: () => void }) {
  return (
    <Card className="border-border/40 hover:shadow-md transition-all duration-300 group overflow-hidden cursor-pointer" onClick={onClick}>
      <CardContent className="p-0">
        <div className={`h-1 w-full ${freelancer.isOnline ? "bg-emerald-500" : "bg-muted-foreground/20"}`} />
        <div className="p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <div className="relative">
              <img src={freelancer.photo} alt={freelancer.name} className="h-14 w-14 rounded-xl object-cover border-2 border-border/40 group-hover:border-primary/30 transition-colors" />
              <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center ${freelancer.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"}`}>
                {freelancer.isOnline ? <Wifi className="h-2 w-2 text-white" /> : <WifiOff className="h-2 w-2 text-white" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{freelancer.name}</p>
                <Badge variant={freelancer.isOnline ? "default" : "secondary"} className={cn("text-[9px] h-4", freelancer.isOnline && "bg-emerald-500/15 text-emerald-400 border-emerald-500/25")}>
                  {freelancer.isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-0.5 text-xs font-medium"><Star className="h-3 w-3 fill-primary text-primary" />{freelancer.rating}</span>
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{freelancer.distance} km away</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground transition-colors" />
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {freelancer.categories.map((c) => <Badge key={c} variant="secondary" className="text-[10px] font-normal">{c}</Badge>)}
            {freelancer.subcategories.map((s) => <Badge key={s} variant="outline" className="text-[10px] font-normal">{s}</Badge>)}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/40">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Commission</p>
              <p className="text-sm font-semibold text-foreground">{freelancer.commissionRate}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Earned</p>
              <p className="text-sm font-semibold text-foreground font-serif">₹{freelancer.totalEarnings.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FreelancerPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("distance");

  const vendorResult = useVendorSearch({ vendor_type: "freelancer" });
  const rawFreelancers: any[] = vendorResult.data?.items ?? [];

  // Normalise to Freelancer shape
  const mockFreelancers: Freelancer[] = rawFreelancers.map((f: any) => ({
    id: f.id,
    name: f.business_name ?? f.display_name ?? f.name ?? f.full_name ?? "Unknown",
    photo: f.logo_url ?? f.photo ?? f.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.id}`,
    categories: f.categories ?? f.service_categories ?? (f.category ? [f.category] : []),
    subcategories: f.subcategories ?? [],
    rating: Number(f.avg_rating ?? f.rating ?? 0),
    distance: Number(f.distance_km ?? f.distance ?? 0),
    isOnline: f.is_open_to_work ?? f.is_online ?? f.isOnline ?? false,
    commissionRate: f.commission_rate ?? f.commissionRate ?? 20,
    totalEarnings: f.total_earnings ?? f.totalEarnings ?? 0,
    verified: f.is_verified ?? f.verified ?? f.kyc_verified ?? false,
    serviceHistory: f.review_count ?? f.service_history ?? 0,
    joinedAt: f.joined_at ?? f.created_at ?? new Date().toISOString(),
    phone: f.phone ?? f.phone_number ?? "",
    email: f.email ?? "",
    bio: f.bio ?? "",
  } as Freelancer));

  const onlineCount = mockFreelancers.filter(f => f.isOnline).length;
  const totalEarnings = mockFreelancers.reduce((t, f) => t + f.totalEarnings, 0);
  const avgRating = mockFreelancers.length > 0 ? (mockFreelancers.reduce((t, f) => t + f.rating, 0) / mockFreelancers.length).toFixed(1) : "0.0";

  const filtered = mockFreelancers
    .filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.categories.some(c => c.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || (statusFilter === "online" && f.isOnline) || (statusFilter === "offline" && !f.isOnline);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "earnings") return b.totalEarnings - a.totalEarnings;
      return 0;
    });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 max-w-[1440px] mx-auto">
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Freelancers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Request on-demand professionals within 5km</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="border-border/40">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"><Zap className="h-4 w-4 text-emerald-400" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Online</p><p className="text-lg font-serif font-bold text-emerald-400">{onlineCount}/{mockFreelancers.length}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Star className="h-4 w-4 text-primary" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Rating</p><p className="text-lg font-serif font-bold">{avgRating}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"><TrendingUp className="h-4 w-4 text-blue-400" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Earnings</p><p className="text-lg font-serif font-bold">₹{(totalEarnings / 1000).toFixed(0)}k</p></div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or category..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Nearest</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="earnings">Most Earnings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FadeIn>

      <FadeIn delay={0.12}>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-5">
          <TabsList className="h-10 rounded-xl bg-muted/50">
            <TabsTrigger value="all" className="text-xs rounded-lg gap-1.5">All ({mockFreelancers.length})</TabsTrigger>
            <TabsTrigger value="online" className="text-xs rounded-lg gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" /> Online ({onlineCount})
            </TabsTrigger>
            <TabsTrigger value="offline" className="text-xs rounded-lg gap-1.5">Offline ({mockFreelancers.length - onlineCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </FadeIn>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((f) => (
          <StaggerItem key={f.id}>
            <FreelancerCard freelancer={f} onClick={() => navigate(`/freelancers/${f.id}`)} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><Search className="h-7 w-7 text-muted-foreground/50" /></div>
          <p className="text-sm font-medium text-foreground">No freelancers found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search</p>
        </div>
      )}
    </div>
  );
}
