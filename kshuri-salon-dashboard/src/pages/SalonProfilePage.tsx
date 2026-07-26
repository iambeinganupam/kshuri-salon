/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FadeIn, StaggerContainer, StaggerItem } from "@kshuri/ui";
import {
  Scissors, Users, Package, Star, MapPin, Phone, Clock,
  Shield, ArrowRight, TrendingUp, CalendarDays, UserCheck,
  LayoutGrid, Wallet, Award, Edit,
} from "lucide-react";
import {
  useBusinessProfile, useServices, useStaffList,
  useLocation, useWorkingHours, useProducts,
} from "@kshuri/api-client/hooks";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function SalonProfilePage() {
  const navigate = useNavigate();

  const businessResult = useBusinessProfile();
  const servicesResult = useServices();
  const staffResult = useStaffList();
  const productsResult = useProducts();

  const salonData: any = businessResult?.data ?? null;
  const servicesData: any[] = Array.isArray(servicesResult?.data) ? servicesResult.data : [];
  const staffData: any[] = Array.isArray(staffResult?.data) ? staffResult.data : [];
  const productsRaw: any = productsResult?.data;
  const productsData: any[] = Array.isArray(productsRaw)
    ? productsRaw
    : Array.isArray(productsRaw?.items)
    ? productsRaw.items
    : [];

  const primaryLocationId: string | undefined = salonData?.primary_location_id;
  const locationResult = useLocation(primaryLocationId ?? "");
  const workingHoursResult = useWorkingHours();
  const locationData: any = primaryLocationId ? locationResult?.data ?? null : null;

  // Today's working hours
  const workingHoursRaw: any[] = Array.isArray(workingHoursResult?.data) ? workingHoursResult.data : [];
  const todayJsDay = new Date().getDay();
  const todayHours = workingHoursRaw.find((h: any) => h.day_of_week === todayJsDay);
  const isOpenToday = todayHours ? !todayHours.is_closed : false;
  const openTime = todayHours?.open_time ? todayHours.open_time.slice(0, 5) : null;
  const closeTime = todayHours?.close_time ? todayHours.close_time.slice(0, 5) : null;
  const hoursLabel = isOpenToday && openTime && closeTime ? `${openTime} – ${closeTime}` : null;

  const addressLine = [locationData?.address_line1, locationData?.city]
    .filter(Boolean)
    .join(", ");

  // Build a salon-compatible object from API data — no hardcoded fallbacks
  const salon = {
    name: salonData?.brand_name ?? salonData?.display_name ?? salonData?.legal_business_name ?? "",
    bannerImage: salonData?.cover_image_url ?? "",
    address: addressLine,
    phone: salonData?.contact_phone ?? "",
    rating: Number(salonData?.avg_rating ?? 0),
    reviewCount: Number(salonData?.review_count ?? 0),
    isKshuriAssured: salonData?.kyc_verified ?? false,
    logo: salonData?.logo_url ?? "",
    email: salonData?.contact_email ?? "",
  };

  const serviceCategories = [...new Set(servicesData.map((s: any) => s.category_name ?? s.category?.name ?? s.category).filter(Boolean))];
  const verifiedStaff = staffData.filter((s: any) => s.verified ?? s.kyc_verified).length;
  const onlineFreelancers = 0; // freelancers handled separately via useVendorSearch

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-[1440px] mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">My Outlet</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of your outlet, services, staff, and operations
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-xl self-start" onClick={() => navigate("/portfolio")}>
            <Edit className="h-3.5 w-3.5" /> Edit Public Profile
          </Button>
        </div>
      </FadeIn>

      {/* Salon Card */}
      <FadeIn delay={0.05}>
        <Card className="border-border/40 overflow-hidden">
          <div className="relative h-32 lg:h-40 overflow-hidden bg-muted/30">
            {salon.bannerImage ? (
              <img src={salon.bannerImage} alt={salon.name} className="w-full h-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-4 left-4 lg:left-6 flex items-end gap-4">
              <div className="h-14 w-14 lg:h-16 lg:w-16 rounded-xl border-2 border-card bg-card overflow-hidden shadow-lg flex items-center justify-center">
                {salon.logo ? (
                  <img src={salon.logo} alt={salon.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold font-serif text-primary">
                    {salon.name ? salon.name.charAt(0).toUpperCase() : ""}
                  </span>
                )}
              </div>
              <div className="text-card pb-0.5">
                <h2 className="text-lg font-bold font-serif">{salon.name || "—"}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold">
                    {salon.rating > 0 ? salon.rating.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs opacity-80">({salon.reviewCount} reviews)</span>
                  {salon.isKshuriAssured && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] gap-1">
                      <Shield className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-4 lg:p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {salon.address && (
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {salon.address}</span>
              )}
              {salon.phone && (
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {salon.phone}</span>
              )}
              {hoursLabel && (
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {hoursLabel}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Quick Stats — compact horizontal row of icon + value + label per cell.
          Avoiding `divide-x` here because it adds a left border to wrapped-row
          first cells (CSS grid + Tailwind divide-x quirk). Tile background +
          gap is enough visual separation. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: "Services", value: servicesData.length, icon: Scissors, color: "text-primary" },
          { label: "Categories", value: serviceCategories.length, icon: LayoutGrid, color: "text-blue-400" },
          { label: "Staff", value: staffData.length, icon: Users, color: "text-emerald-400" },
          { label: "Freelancers", value: 0, icon: UserCheck, color: "text-amber-400" },
          { label: "Products", value: productsData.length, icon: Package, color: "text-purple-400" },
          { label: "Reviews", value: salon.reviewCount, icon: Star, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/40 bg-card/40">
            <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold font-serif leading-none">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Services by Category + Staff Overview */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Services by Category */}
        <FadeIn delay={0.1} className="lg:col-span-3">
          <Card className="border-border/40">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Scissors className="h-4 w-4 text-primary" />
                Services by Category
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary hover:text-primary font-medium" onClick={() => navigate("/services")}>
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceCategories.map((cat) => {
                  const catServices = servicesData.filter((s: any) => (s.category_name ?? s.category?.name ?? s.category) === cat);
                  const prices = catServices.map((s: any) => Number(s.default_price ?? s.price ?? 0)).filter((p) => p > 0);
                  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length) : 0;
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{cat}</p>
                        <p className="text-[11px] text-muted-foreground">{catServices.length} services · Avg ₹{avgPrice.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {catServices.some(s => s.status === "pending-review") && (
                          <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/25">
                            Pending
                          </Badge>
                        )}
                        <div className="flex -space-x-1">
                          {["female", "male", "unisex"].map((g) => {
                            const has = catServices.some(s => s.gender === g);
                            if (!has) return null;
                            return (
                              <div key={g} className={cn(
                                "h-5 w-5 rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold",
                                g === "female" ? "bg-pink-500/20 text-pink-400" : g === "male" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                              )}>
                                {g[0].toUpperCase()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Team Overview */}
        <FadeIn delay={0.15} className="lg:col-span-2">
          <Card className="border-border/40 h-full">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                Team Overview
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary hover:text-primary font-medium" onClick={() => navigate("/staff")}>
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">No staff yet</p>
                ) : (
                  staffData.slice(0, 4).map((staff: any) => {
                    const fullName = staff.name
                      ?? [staff.user?.first_name, staff.user?.last_name].filter(Boolean).join(" ")
                      ?? staff.user?.email
                      ?? "Staff";
                    const initials = fullName
                      .split(" ")
                      .map((n: string) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const verified = staff.verified ?? staff.kyc_verified ?? false;
                    return (
                      <div key={staff.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{fullName}</p>
                            <p className="text-[11px] text-muted-foreground">{staff.role}</p>
                          </div>
                        </div>
                        {verified && (
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Verified
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}

                <Separator className="bg-border/30" />

                {/* Freelancers summary */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Freelancers</p>
                      <p className="text-[11px] text-muted-foreground">{onlineFreelancers} online</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/freelancers")}>
                    View <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Products + Quick Links */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Products Overview */}
        <FadeIn delay={0.2}>
          <Card className="border-border/40">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-400" />
                Products
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary hover:text-primary font-medium" onClick={() => navigate("/services")}>
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {productsData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">No products yet</p>
                ) : (
                  productsData.slice(0, 4).map((product: any) => {
                    const stock = Number(product.stock ?? product.stock_quantity ?? 0);
                    const price = Number(product.price ?? product.unit_price ?? 0);
                    return (
                      <div key={product.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary/30 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                          <p className="text-[11px] text-muted-foreground">{product.category_name ?? product.category?.name ?? product.category ?? ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold font-serif text-primary">₹{price.toLocaleString("en-IN")}</p>
                          <div className="flex items-center gap-1">
                            <div className={cn("h-1.5 w-1.5 rounded-full", stock > 10 ? "bg-emerald-500" : stock > 0 ? "bg-amber-500" : "bg-destructive")} />
                            <span className="text-[10px] text-muted-foreground">{stock} in stock</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Quick Navigation */}
        <FadeIn delay={0.25}>
          <Card className="border-border/40 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Manage Services", icon: Scissors, path: "/services", desc: `${servicesData.length} active` },
                  { label: "Staff & Schedule", icon: Users, path: "/staff", desc: `${verifiedStaff} verified` },
                  { label: "View Bookings", icon: CalendarDays, path: "/bookings", desc: "Today's schedule" },
                  { label: "Billing & Payments", icon: Wallet, path: "/billing", desc: "Settlements" },
                  { label: "Analytics", icon: TrendingUp, path: "/analytics", desc: "Performance" },
                  { label: "Portfolio", icon: Award, path: "/portfolio", desc: "Public profile" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="rounded-lg p-2 bg-primary/10 shrink-0">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{action.label}</p>
                      <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
