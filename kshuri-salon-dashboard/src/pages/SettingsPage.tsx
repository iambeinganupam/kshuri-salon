/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@kshuri/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Tabs imports retired — Settings is now a single scrollable layout that
// mirrors the freelancer dashboard. Kept as a comment so anyone restoring
// the tabs UX knows where to look.
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Store,
  User,
  Crown,
  Camera,
  Check,
  Upload,
  Eye,
  Bell,
  Shield,
  Lock,
  Clock,
  Globe,
  AlertTriangle,
  Trash2,
  Loader2,
  Save,
  Star,
} from "lucide-react";
import { useBusinessProfile, useUpdateBusinessProfile, useProfile, useUpdateProfile, useWorkingHours, useUpdateWorkingHours } from "@kshuri/api-client/hooks";
import { VendorSubscriptionSection } from "@kshuri/ui";
import { cn } from "@/lib/utils";
import { PasswordChangeDialog } from "./settings/PasswordChangeDialog";

interface WorkingHour {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

/* SettingsSection — stacked card layout matching the freelancer Settings
   page. Title + icon at the top inside CardHeader; description sits right
   below the title; fields fill the full width below in CardContent. One
   section per Card, separated by the page's `space-y-5` rhythm.

   Previously this was a two-column "Stripe / Linear / Vercel" split with
   the description on the left and the form on the right. We retired that
   in favour of the simpler stacked layout the freelancer dashboard uses,
   so the two settings pages render identically.
*/
interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  iconAccent?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function SettingsSection({
  title, description, icon: Icon, iconAccent, badge, children, footer,
}: SettingsSectionProps) {
  return (
    <Card className="border-border/30 shadow-soft rounded-2xl bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className={cn("h-4 w-4 text-primary", iconAccent)} />
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="font-serif text-base leading-tight">{title}</CardTitle>
              {description && (
                <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {footer && (
          <>
            <Separator className="bg-border/30" />
            <div className="flex justify-end">{footer}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();

  const { data: salonRaw } = useBusinessProfile();
  const { data: profileRaw } = useProfile();
  const { data: workingHoursRaw = [] } = useWorkingHours();
  const updateBusiness = useUpdateBusinessProfile();
  const updateProfile = useUpdateProfile();
  const updateWorkingHours = useUpdateWorkingHours();

  // Subscription wiring moved to the shared <VendorSubscriptionSection/>
  // which fetches plans / myPlan / mutation itself. Removed the local
  // usePlans() / useMyPlan() / useSubscribeToPlan() calls and the
  // is_publicly_selectable filter — they all live inside the component now.

  const salonData: any = salonRaw ?? null;
  const profileData: any = profileRaw ?? null;

  // Salon form state
  const [salonName, setSalonName] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [tradeLicense, setTradeLicense] = useState("");
  const [website, setWebsite] = useState("");
  const [salonSaving, setSalonSaving] = useState(false);

  // Owner form state
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerSaving, setOwnerSaving] = useState(false);

  // Vendor UPI identity (Phase 1 manual UPI). Lives on the business
  // profile so multi-location chains share a single payee identity.
  const [upiId, setUpiId] = useState("");
  const [upiDisplayName, setUpiDisplayName] = useState("");
  const [upiSaving, setUpiSaving] = useState(false);

  // Sync form state when API data loads
  useEffect(() => {
    if (salonData) {
      setSalonName(salonData.brand_name ?? salonData.display_name ?? salonData.legal_business_name ?? "");
      setSalonAddress(salonData.address_line1 ?? salonData.address ?? "");
      setGstNumber(salonData.gstin ?? salonData.gst_number ?? "");
      setTradeLicense(salonData.trade_license ?? "");
      setWebsite(salonData.website_url ?? "");
      setUpiId(salonData.upi_id ?? "");
      setUpiDisplayName(salonData.upi_display_name ?? "");
    }
  }, [salonData]);

  useEffect(() => {
    if (profileData) {
      setOwnerName([profileData.first_name, profileData.last_name].filter(Boolean).join(" ") || profileData.email || "");
      setOwnerPhone(profileData.phone_number ?? "");
      setOwnerEmail(profileData.email ?? "");
    }
  }, [profileData]);

  // Day indices use JS Date convention: 0=Sunday, 1=Monday … 6=Saturday
  // DAYS array is Mon-Sun, so DAYS[idx] has day_of_week = (idx + 1) % 7
  const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  useEffect(() => {
    if (Array.isArray(workingHoursRaw) && workingHoursRaw.length > 0) {
      const mapped: WorkingHour[] = DAY_NAMES.map((day, idx) => {
        const jsDay = (idx + 1) % 7; // Mon=1 … Sat=6, Sun=0
        const found: any = (workingHoursRaw as any[]).find((h: any) => h.day_of_week === jsDay);
        return { day, open: found?.open_time?.slice(0, 5) ?? "09:00", close: found?.close_time?.slice(0, 5) ?? "21:00", isOpen: !(found?.is_closed ?? false) };
      });
      setWorkingHours(mapped);
    }
  }, [workingHoursRaw]);

  // Password form state
  // Password change opens a dedicated modal — keeps the Settings page tidy
  // and matches the pattern used by GitHub / Linear / Vercel / Stripe.
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const [notifications, setNotifications] = useState({
    newBooking: true,
    bookingCancelled: true,
    paymentReceived: true,
    settlementDue: true,
    staffUpdates: false,
    marketingEmails: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([
    { day: "Monday", open: "09:00", close: "21:00", isOpen: true },
    { day: "Tuesday", open: "09:00", close: "21:00", isOpen: true },
    { day: "Wednesday", open: "09:00", close: "21:00", isOpen: true },
    { day: "Thursday", open: "09:00", close: "21:00", isOpen: true },
    { day: "Friday", open: "09:00", close: "21:00", isOpen: true },
    { day: "Saturday", open: "10:00", close: "20:00", isOpen: true },
    { day: "Sunday", open: "10:00", close: "18:00", isOpen: false },
  ]);
  const [hoursSaving, setHoursSaving] = useState(false);

  const handleSaveSalon = () => {
    setSalonSaving(true);
    updateBusiness.mutate(
      { brand_name: salonName, website_url: website },
      {
        onSuccess: () => { setSalonSaving(false); toast.success("Outlet details saved!"); },
        onError: () => { setSalonSaving(false); toast.error("Failed to save outlet details"); },
      },
    );
  };

  const handleSaveOwner = () => {
    setOwnerSaving(true);
    const nameParts = ownerName.trim().split(" ");
    const first_name = nameParts[0] ?? "";
    const last_name = nameParts.slice(1).join(" ") || undefined;
    updateProfile.mutate(
      { first_name, last_name, phone_number: ownerPhone },
      {
        onSuccess: () => { setOwnerSaving(false); toast.success("Owner details saved!"); },
        onError: () => { setOwnerSaving(false); toast.error("Failed to save owner details"); },
      },
    );
  };

  const handleSaveUpi = () => {
    const trimmed = upiId.trim();
    if (trimmed && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(trimmed)) {
      toast.error("Enter a valid UPI ID, e.g. salon@upi");
      return;
    }
    setUpiSaving(true);
    updateBusiness.mutate(
      {
        // null clears the saved value; trimmed string saves the new VPA.
        upi_id: trimmed || null,
        upi_display_name: upiDisplayName.trim() || null,
      },
      {
        onSuccess: () => { setUpiSaving(false); toast.success("UPI details saved"); },
        onError: (err: unknown) => {
          setUpiSaving(false);
          const apiMsg = (err as {
            response?: { data?: { error?: { message?: string } } };
          })?.response?.data?.error?.message;
          toast.error(apiMsg ?? "Failed to save UPI details");
        },
      },
    );
  };

  // handleSubscribePlan retired — moved into the shared
  // <VendorSubscriptionSection/> which owns the mutation + confirmation
  // prompt itself. The salon Settings just wires toast hooks to it.

  const handleSaveNotifications = () => {
    setNotifSaving(true);
    setTimeout(() => { setNotifSaving(false); toast.success("Notification preferences saved!"); }, 800);
  };

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleSaveHours = () => {
    setHoursSaving(true);
    const payload = workingHours.map(h => ({
      day_of_week: (DAYS.indexOf(h.day) + 1) % 7, // Mon=1…Sat=6, Sun=0 (JS Date convention)
      open_time: h.isOpen ? h.open : null,
      close_time: h.isOpen ? h.close : null,
      is_closed: !h.isOpen,
    }));
    updateWorkingHours.mutate(payload as any, {
      onSuccess: () => { setHoursSaving(false); toast.success("Working hours saved!"); },
      onError: () => { setHoursSaving(false); toast.error("Failed to save working hours"); },
    });
  };

  const updateHour = (index: number, field: keyof WorkingHour, value: string | boolean) => {
    setWorkingHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const handleNotificationToggle = (key: string, checked: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: checked }));
    toast.info(`${key === "newBooking" ? "New Booking" : key === "bookingCancelled" ? "Cancellation" : key === "paymentReceived" ? "Payment" : key === "settlementDue" ? "Settlement" : key === "staffUpdates" ? "Staff" : "Marketing"} notifications ${checked ? "enabled" : "disabled"}`);
  };

  // ── Profile completeness for the top header card ──────────────────────────
  // Same shape as the freelancer Settings page: tally a small fixed set of
  // checks against the salon profile so a single % score communicates
  // "what's missing" at a glance.
  const completenessChecks = [
    { key: "name", done: Boolean((salonData?.brand_name ?? salonData?.display_name ?? "").trim()) },
    { key: "email", done: Boolean((salonData?.contact_email ?? profileData?.email ?? "").trim()) },
    { key: "address", done: Boolean((salonData?.address_line1 ?? salonData?.address ?? "").trim()) },
    { key: "description", done: Boolean((salonData?.description ?? salonData?.tagline ?? "").trim()) },
    { key: "banner", done: Boolean(salonData?.banner_url ?? salonData?.cover_image_url ?? salonData?.cover_url) },
    { key: "logo", done: Boolean(salonData?.logo_url) },
    { key: "hours", done: Array.isArray(workingHoursRaw) && workingHoursRaw.some((h: { is_closed?: boolean }) => h?.is_closed === false) },
  ];
  const completenessDone = completenessChecks.filter((c) => c.done).length;
  const completenessPct = Math.round((completenessDone / completenessChecks.length) * 100);

  const accountVerified = Boolean(
    salonData?.kyc_status === "approved" || salonData?.is_verified === true,
  );
  const avgRating = Number(salonData?.avg_rating ?? 0);
  const reviewCount = Number(salonData?.review_count ?? 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 space-y-5 max-w-3xl mx-auto">
      <FadeIn>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your outlet profile and preferences</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl" onClick={() => navigate("/salon-profile")}>
            <Eye className="h-3.5 w-3.5" /> View Public Profile
          </Button>
        </div>
      </FadeIn>

      {/* Profile Completeness — first thing the user sees, matches the
          freelancer Settings header rhythm exactly. */}
      <FadeIn delay={0.02}>
        <Card className="border-border/30 shadow-soft rounded-2xl bg-gradient-to-r from-primary/5 via-card to-accent/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-foreground">Profile Completeness</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {completenessPct === 100
                    ? "Your outlet profile is fully set up 🎉"
                    : "Complete your profile to attract more bookings"}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-lg text-xs font-bold px-2.5 py-1">
                {completenessPct}%
              </Badge>
            </div>
            <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  completenessPct === 100 ? "bg-success" : "bg-primary",
                )}
                style={{ width: `${completenessPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Status + Rating — 2-col stats grid matching the freelancer header. */}
      <FadeIn delay={0.04}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="rounded-2xl border-2 border-border/30 bg-card shadow-soft">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account</p>
                <p className="font-bold text-sm text-foreground">{accountVerified ? "Verified" : "Pending"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/30 shadow-soft bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Rating</p>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm text-foreground">{avgRating.toFixed(1)}</p>
                  <span className="text-[11px] text-muted-foreground">({reviewCount} reviews)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Single scrollable layout — matches the freelancer Settings page.
          Tabs (Outlet / Owner / Notifications / Hours / Plan) were converted
          to vertically stacked sections so vendors get one continuous,
          obviously-scannable form instead of clicking between siloed views.
          The section grouping itself is unchanged. */}
      <div className="space-y-5">
        {/* ─── Outlet ─── */}
          <div className="space-y-5">
            <FadeIn delay={0.08}>
              <SettingsSection
                title="Outlet Profile"
                description="The public-facing identity of your salon — shown to customers in search results, maps and booking confirmations."
                icon={Store}
                footer={
                  <Button size="sm" className="h-10 px-5 rounded-xl gap-1.5" onClick={handleSaveSalon} disabled={salonSaving}>
                    {salonSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {salonSaving ? "Saving…" : "Save Changes"}
                  </Button>
                }
              >
                <div>
                  <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Outlet Name</label>
                  <Input value={salonName} onChange={e => setSalonName(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Address</label>
                  <Input value={salonAddress} onChange={e => setSalonAddress(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-semibold text-foreground mb-1.5 block">GST Number</label>
                    <Input value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5" className="h-11 rounded-xl font-mono" />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Trade License</label>
                    <Input value={tradeLicense} onChange={e => setTradeLicense(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Website</label>
                  <div className="flex gap-2">
                    <Input placeholder="https://yoursalon.com" className="h-11 rounded-xl flex-1" value={website} onChange={e => setWebsite(e.target.value)} />
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={() => website && window.open(website.startsWith("http") ? website : `https://${website}`, "_blank")}>
                      <Globe className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SettingsSection>
            </FadeIn>

            <FadeIn delay={0.12}>
              <SettingsSection
                title="Brand Assets"
                description="Banner image headlines your public profile. Gallery photos are managed inside the Portfolio page so they stay alongside the rest of your media."
                icon={Camera}
              >
                <div>
                  <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Banner Image</label>
                  <div className="relative rounded-xl overflow-hidden h-40 bg-muted group cursor-pointer border border-border/30" onClick={() => toast.info("Banner upload coming soon!")}>
                    {salonData?.banner_url || salonData?.cover_image_url ? (
                      <img src={salonData.banner_url ?? salonData.cover_image_url} alt="Banner" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-1.5">
                        <Camera className="h-5 w-5" />
                        <p className="text-xs">No banner uploaded yet</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Button size="sm" variant="secondary" className="gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity rounded-xl shadow-lg">
                        <Camera className="h-3.5 w-3.5" /> Change Banner
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Recommended 1600 × 600 px · JPEG or PNG</p>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Gallery</label>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full sm:w-auto h-10 px-4 rounded-xl" onClick={() => navigate("/portfolio")}>
                    <Upload className="h-3.5 w-3.5" /> Manage Gallery in Portfolio
                  </Button>
                </div>
              </SettingsSection>
            </FadeIn>
        </div>

        {/* ─── Owner / Payments / Security ─── */}
        {/* Stripe / Linear / Vercel-style description-form sections, stacked
            vertically with subtle separators. Title + description on the
            left, fields on the right. Each save action sits at the
            bottom-right of its own section. */}
        <div className="space-y-5">
            <FadeIn delay={0.08}>
              <SettingsSection
                title="Owner Details"
                description="The personal contact information shown to your team. Customers see your salon's name, not your personal one."
                icon={User}
                footer={
                  <Button size="sm" className="h-10 px-5 rounded-xl gap-1.5" onClick={handleSaveOwner} disabled={ownerSaving}>
                    {ownerSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {ownerSaving ? "Saving…" : "Save Changes"}
                  </Button>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Name</label>
                    <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Phone</label>
                    <Input value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Email</label>
                    <Input value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
              </SettingsSection>
            </FadeIn>

            <FadeIn delay={0.10}>
              <SettingsSection
                title="Receive Payments"
                description="Customers can scan a UPI QR generated from this ID to pay you directly. Cash is always available as a fallback."
                icon={Crown}
                iconAccent="text-primary"
                badge={
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-semibold">
                    UPI
                  </Badge>
                }
                footer={
                  <Button size="sm" className="h-10 px-5 rounded-xl gap-1.5" onClick={handleSaveUpi} disabled={upiSaving}>
                    {upiSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {upiSaving ? "Saving…" : "Save UPI Details"}
                  </Button>
                }
              >
                <div>
                  <label className="text-[12px] font-semibold text-foreground mb-1.5 block">UPI ID</label>
                  <Input
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="h-11 rounded-xl font-mono"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    e.g. <span className="font-mono">salon@paytm</span>, <span className="font-mono">name@oksbi</span>, <span className="font-mono">9876543210@upi</span>
                  </p>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-foreground mb-1.5 block">
                    Display Name <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input
                    value={upiDisplayName}
                    onChange={e => setUpiDisplayName(e.target.value)}
                    placeholder="Shown on customer's UPI app"
                    className="h-11 rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Defaults to your salon's display name if left blank.
                  </p>
                </div>
              </SettingsSection>
            </FadeIn>

            <FadeIn delay={0.12}>
              <SettingsSection
                title="Security"
                description="Manage your account access. We recommend a strong password at least 8 characters long."
                icon={Shield}
              >
                {/* Sign-in identity row — read-only context, mirrors how
                    GitHub / Stripe surface the verified email above the
                    password change CTA. */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/30 bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Sign-in email</p>
                    <p className="text-sm font-medium truncate mt-0.5">{ownerEmail || profileData?.email || "—"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-border/40 shrink-0">
                    Verified
                  </Badge>
                </div>

                {/* Password change row — clean status + single CTA. The
                    actual current/new/confirm form lives in the modal so
                    sensitive fields aren't visible by default. */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/30">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Password</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Updating signs you out of all other devices.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 rounded-lg gap-1.5 text-xs shrink-0"
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    <Shield className="h-3.5 w-3.5" /> Change Password
                  </Button>
                </div>
              </SettingsSection>
            </FadeIn>
        </div>

        {/* ─── Notifications ─── */}
          <FadeIn delay={0.08}>
            <SettingsSection
              title="Notification Preferences"
              description="Choose which events trigger an alert. Operational notifications (bookings, payments, settlements) are recommended; marketing is optional."
              icon={Bell}
              footer={
                <Button size="sm" className="h-10 px-5 rounded-xl gap-1.5" onClick={handleSaveNotifications} disabled={notifSaving}>
                  {notifSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {notifSaving ? "Saving…" : "Save Preferences"}
                </Button>
              }
            >
              <div className="divide-y divide-border/40 -my-2">
                {[
                  { key: "newBooking", label: "New Booking", desc: "Get notified when a new booking is placed" },
                  { key: "bookingCancelled", label: "Booking Cancelled", desc: "Alert when a customer cancels" },
                  { key: "paymentReceived", label: "Payment Received", desc: "Confirmation when payments are processed" },
                  { key: "settlementDue", label: "Settlement Due", desc: "Reminders for upcoming settlements" },
                  { key: "staffUpdates", label: "Staff Updates", desc: "Changes in staff availability or status" },
                  { key: "marketingEmails", label: "Marketing Emails", desc: "Tips, features, and promotional content" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3.5">
                    <div className="min-w-0 pr-4">
                      <Label className="text-[13px] font-semibold">{item.label}</Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => handleNotificationToggle(item.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </SettingsSection>
        </FadeIn>

        {/* ─── Working Hours ─── */}
          <FadeIn delay={0.08}>
            <Card className="max-w-lg border-border/40">
              <CardHeader className="pb-4"><CardTitle className="text-base">Working Hours</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {workingHours.map((schedule, idx) => (
                  <div key={schedule.day} className="flex items-center gap-3 py-2.5 px-1">
                    <div className="w-24">
                      <span className={cn("text-[13px] font-medium", !schedule.isOpen && "text-muted-foreground")}>{schedule.day}</span>
                    </div>
                    <Switch
                      checked={schedule.isOpen}
                      onCheckedChange={(checked) => updateHour(idx, "isOpen", checked)}
                    />
                    {schedule.isOpen ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={schedule.open}
                          onChange={(e) => updateHour(idx, "open", e.target.value)}
                          className="h-9 rounded-lg text-xs w-24 text-center"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={schedule.close}
                          onChange={(e) => updateHour(idx, "close", e.target.value)}
                          className="h-9 rounded-lg text-xs w-24 text-center"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
                <Separator className="bg-border/30 my-2" />
                <Button size="sm" className="w-full h-10 rounded-xl gap-1.5" onClick={handleSaveHours} disabled={hoursSaving}>
                  {hoursSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {hoursSaving ? "Saving..." : "Save Schedule"}
                </Button>
              </CardContent>
            </Card>
        </FadeIn>

        {/* ─── Subscription / Plan ─── */}
        {/* Shared with the freelancer Settings page via VendorSubscriptionSection
            so both vendor surfaces show identical plan UX. The component
            fetches its own plans / myPlan / subscribe mutation, filters to
            is_publicly_selectable, and adapts the grid for 1 / 2+ plan
            counts so the cards don't get squeezed at narrow widths. */}
        <FadeIn delay={0.08}>
          <VendorSubscriptionSection
            onSuccess={(msg) => toast.success(msg)}
            onError={(msg) => toast.error(msg)}
            onInfo={(msg) => toast.info(msg)}
          />
        </FadeIn>

          {/* Danger Zone */}
          <FadeIn delay={0.15}>
            <Card className="mt-6 border-destructive/20 bg-destructive/[0.02]">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Deactivating your salon will hide it from Estylr search results and pause all active bookings. This action can be reversed.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/5 rounded-xl"
                    onClick={() => toast.error("Account deactivation requires admin confirmation. Contact support.")}
                  >
                    Deactivate Outlet
                  </Button>
                </div>
              </CardContent>
            </Card>
        </FadeIn>
      </div>

      {/* Modal lives at the page level so it overlays whichever section
          opened it. */}
      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </div>
  );
}

// PlanCard moved to @kshuri/ui as part of <VendorSubscriptionSection/> so
// the salon + freelancer Settings pages render an identical block. See
// packages/ui/src/components/profile/VendorSubscriptionSection.tsx.
