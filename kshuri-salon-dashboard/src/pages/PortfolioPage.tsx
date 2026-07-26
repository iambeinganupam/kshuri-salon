/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useBlocker } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@kshuri/ui";
import {
  Eye, Grid3X3, Heart, Plus, Upload, Trash2, ImagePlus,
  Edit, MapPin, Phone, Clock, Star, Shield, Globe,
  MessageSquare, Pencil, Save, X, TrendingUp, Sparkles,
  Award, Users, ChevronRight, Search, Camera, Loader2,
  Tag, Languages, Instagram, Youtube, CheckCircle2, Package,
} from "lucide-react";
import {
  useBusinessProfile, useUpdateBusinessProfile,
  useServices, useDeleteService, useUpdateService,
  useProducts,
  usePortfolio, useUploadMedia, useDeleteMedia,
  useWorkingHours,
  useOwnVendorReviews,
  useEngagementMetrics,
} from "@kshuri/api-client/hooks";
import { useApiClient } from "@kshuri/api-client";
import {
  SALON_LANGUAGES,
  SALON_AMENITIES, SALON_AMENITY_GROUPS, SALON_AMENITIES_BY_KEY,
} from "@kshuri/api-client/types";
import {
  amenityIcon,
  VendorBanner,
  VendorHeader,
  VendorBookingCard,
  PortfolioTab,
  AboutTab,
  ServicesTab,
  ReviewsTab,
  ServiceDetailSheet,
  BookingDialog,
  UploadMediaDialog,
  WorkingHoursEditor,
  ServiceLocationCard,
  SharePortfolioButton,
  EditModeBar,
  useEditMode,
  useDraftAutosave,
  BannerLogoUploader,
  NavigationGuardDialog,
  CategoryPicker,
  type AddressPickerValue,
  type VendorService,
} from "@kshuri/ui";
import {
  salonApiToVendorProfile,
  salonServicesToVendorServices,
  salonMediaToVendorMedia,
} from "@/lib/vendor-adapter";
import { useAuth } from "@/lib/auth-context";

/**
 * Local alias kept while the inline mock-data path is still in use; once the
 * Phase 2 modular split lands, every reference will route through the
 * `@kshuri/ui` types directly.
 */
type Service = VendorService;

interface Certification {
  name: string;
  issuer: string;
  year: number;
  credential_id?: string;
}
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ALL_CATEGORIES = "__all__";


export default function PortfolioPage() {
  const { user } = useAuth();
  const businessResult = useBusinessProfile();
  const servicesResult = useServices();
  const productsResult = useProducts();
  const portfolioResult = usePortfolio();
  const workingHoursResult = useWorkingHours();
  const primaryLocationId: string | undefined =
    (businessResult.data as { primary_location_id?: string } | undefined)?.primary_location_id;
  const reviewsResult = useOwnVendorReviews({
    vendor_type: "salon_location",
    vendor_id: primaryLocationId ?? "",
    limit: 20,
  });
  const engagementResult = useEngagementMetrics();
  const engagement = engagementResult.data ?? {
    primary_location_id: null,
    view_count: 0,
    favorite_count: 0,
    review_count: 0,
    avg_rating: 0,
  };
  const updateProfile = useUpdateBusinessProfile();
  const apiClient = useApiClient();
  const deleteService = useDeleteService();
  const updateService = useUpdateService();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();

  const salonData: any = businessResult.data ?? null;
  const servicesData: any[] = Array.isArray(servicesResult.data) ? servicesResult.data : [];
  // portfolioResult returns an array of media items (UploadedMedia[]) or paginated {items}
  const portfolioRaw: any = portfolioResult.data;
  const portfolioItems: any[] = Array.isArray(portfolioRaw)
    ? portfolioRaw
    : Array.isArray(portfolioRaw?.items)
    ? portfolioRaw.items
    : [];

  // Derive today's working hours
  const workingHoursRaw: any[] = Array.isArray(workingHoursResult.data) ? workingHoursResult.data : [];
  const todayJsDay = new Date().getDay(); // 0=Sun, 1=Mon…6=Sat
  const todayHours = workingHoursRaw.find((h: any) => h.day_of_week === todayJsDay);
  const isOpen = todayHours ? !todayHours.is_closed : false;
  const openTime = todayHours?.open_time ? todayHours.open_time.slice(0, 5) : null;
  const closeTime = todayHours?.close_time ? todayHours.close_time.slice(0, 5) : null;

  // Derive price range from active services
  const activePrices = servicesData
    .filter((s: any) => s.is_active !== false && (s.default_price != null || s.price != null))
    .map((s: any) => Number(s.default_price ?? s.price));
  const priceMin = activePrices.length > 0 ? Math.min(...activePrices) : null;
  const priceMax = activePrices.length > 0 ? Math.max(...activePrices) : null;

  // Derive unique category tags from services
  const serviceTags = Array.from(
    new Set(servicesData.map((s: any) => s.category_name ?? s.category).filter(Boolean))
  ).slice(0, 5) as string[];

  const composedAddress = [
    salonData?.address_line1,
    salonData?.address_line2,
    salonData?.city,
    salonData?.state,
    salonData?.postal_code,
  ].filter(Boolean).join(", ");

  const salon = {
    name: salonData?.brand_name ?? salonData?.display_name ?? salonData?.legal_business_name ?? "My Outlet",
    bannerImage: salonData?.cover_image_url ?? salonData?.cover_url ?? salonData?.banner_image ?? "",
    // Surfaced for `SalonBanner`, which renders a 4-up mosaic of portfolio thumbnails.
    gallery: portfolioItems
      .map((m: { thumbnail_url?: string | null; url?: string | null; media_url?: string | null }) =>
        m.thumbnail_url ?? m.url ?? m.media_url ?? "")
      .filter(Boolean),
    address: composedAddress,
    addressLine1: salonData?.address_line1 ?? "",
    addressLine2: salonData?.address_line2 ?? "",
    city: salonData?.city ?? "",
    state: salonData?.state ?? "",
    postalCode: salonData?.postal_code ?? "",
    phone: salonData?.contact_phone ?? salonData?.phone ?? "",
    rating: Number(salonData?.avg_rating ?? salonData?.rating ?? 0),
    reviewCount: Number(salonData?.review_count ?? 0),
    isKshuriAssured: salonData?.kyc_verified ?? false,
    logo: salonData?.logo_url ?? "",
    email: salonData?.contact_email ?? salonData?.email ?? user?.email ?? "",
    description: salonData?.description ?? "",
    tagline: salonData?.tagline ?? "",
    specializations: Array.isArray(salonData?.specializations) ? salonData.specializations : [],
    languages: Array.isArray(salonData?.languages) ? salonData.languages : [],
    websiteUrl: salonData?.website_url ?? "",
    instagramUrl: salonData?.instagram_url ?? "",
    youtubeUrl: salonData?.youtube_url ?? "",
    yearsInBusiness: typeof salonData?.years_in_business === "number" ? salonData.years_in_business : null,
    certifications: Array.isArray(salonData?.certifications) ? salonData.certifications : [],
    amenities: Array.isArray(salonData?.amenities) ? (salonData.amenities as string[]) : [],
    categories: serviceTags,
    isOpen,
    openTime,
    closeTime,
    priceMin,
    priceMax,
    businessType: salonData?.business_type ?? null,
    primaryLocationId: salonData?.primary_location_id ?? null,
  };

  const ownerName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || salon.name;

  // Normalize API services into the vendor-agnostic VendorService shape.
  // `is_trending` / `is_featured` live on the server-side `services` row
  // (migration 026) and surface here as `trending` / `featured`.
  const mockServices: Service[] = servicesData.map((s: any) => ({
    id: String(s.id),
    name: String(s.name ?? ""),
    description: s.description ?? null,
    price: Number(s.default_price ?? s.price ?? 0),
    duration_minutes:
      typeof s.duration_minutes === "number"
        ? s.duration_minutes
        : typeof s.duration === "number"
          ? s.duration
          : null,
    category: s.category?.name ?? s.category_name ?? s.category ?? null,
    is_active: s.is_active !== false,
    trending: s.is_trending === true,
    featured: s.is_featured === true,
    inclusions: Array.isArray(s.inclusions)
      ? s.inclusions.filter((x: unknown): x is string => typeof x === "string")
      : [],
  }));
  // Retail products — surfaced as cards below Featured Services in the
  // public preview. Filter inactives defensively (backend RLS already does so).
  const productsData: Array<{
    id: string; name: string; description?: string; category?: string;
    price: number | string; stock?: number; is_active?: boolean;
  }> = Array.isArray(productsResult.data) ? productsResult.data : [];
  const activeProducts = productsData.filter((p) => p.is_active !== false);

  // Live reviews + rating distribution for the salon's primary location.
  const reviews = reviewsResult.data?.items ?? [];
  const reviewSummary = reviewsResult.data?.summary ?? {
    total_count: 0, avg_rating: 0,
    rating_5: 0, rating_4: 0, rating_3: 0, rating_2: 0, rating_1: 0,
  };

  // Vendor-shaped versions for the shared @kshuri/ui profile components.
  // Memoising would be a Phase 2 nicety — for now the inline call mirrors
  // every other derivation in this page.
  const vendorGallery = salonMediaToVendorMedia(portfolioRaw);
  const vendorServices = salonServicesToVendorServices(servicesData);
  const vendorProfile = salonApiToVendorProfile(salonData, {
    services: vendorServices,
    gallery: vendorGallery,
    workingHours: workingHoursRaw,
    rating: { avg: salon.rating, count: salon.reviewCount },
    engagement: { view_count: engagement.view_count, favorite_count: engagement.favorite_count },
  });

  // Active tab is URL-synced so refresh / share links keep the user on the same tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const VALID_TABS = ["preview", "gallery", "edit"] as const;
  const tabParam = searchParams.get("tab");
  const activeTab = (VALID_TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as typeof VALID_TABS[number])
    : "preview";
  const setActiveTab = (val: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", val);
    setSearchParams(next, { replace: true });
  };
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [previewSubTab, setPreviewSubTab] = useState("portfolio");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Resolve a service's category name from any of the shapes the API may return
  const resolveCategoryName = useCallback((s: any): string | null => {
    return (
      s?.category_name
      ?? s?.category?.name
      ?? (typeof s?.category === "string" ? s.category : null)
      ?? null
    );
  }, []);

  // Distinct category names the salon actually has services in — drives the chips
  const galleryCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const s of servicesData) {
      const name = resolveCategoryName(s);
      if (name) seen.add(name);
    }
    return Array.from(seen);
  }, [servicesData, resolveCategoryName]);

  // Active services flattened for the upload dialog (grouped by category name)
  const uploadServices = useMemo(
    () => servicesData
      .filter((s: any) => s.is_active !== false)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        category_name: resolveCategoryName(s),
      })),
    [servicesData, resolveCategoryName],
  );

  // service_id → photo count, for "X / 3" badges and disabling full services
  const usageByService = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of portfolioItems) {
      const sid = m.service_id ?? m.service?.id;
      if (sid) map[sid] = (map[sid] ?? 0) + 1;
    }
    return map;
  }, [portfolioItems]);

  // Lookup map: service_id → enriched service (for price/duration in lightbox)
  const serviceById = useMemo(() => {
    const map = new Map<string, any>();
    for (const s of servicesData) map.set(s.id, s);
    return map;
  }, [servicesData]);

  // Adapter: media items → GalleryItem[] for the public-preview gallery.
  // Subject defaults to the linked service's metadata (price, duration, category).
  // Items without a service link are still shown but with degraded subject info.
  const serviceGalleryItems = useMemo(() => {
    return portfolioItems
      .filter((m: any) => m.service_id ?? m.service?.id)
      .map((m: any) => {
        const svc = serviceById.get(m.service_id ?? m.service?.id);
        return {
          id: String(m.id),
          url: m.url ?? "",
          caption: m.caption ?? null,
          createdAt: m.created_at,
          subject: {
            kind: "service" as const,
            id: m.service?.id ?? m.service_id,
            name: m.service?.name ?? svc?.name ?? "Service",
            categoryName:
              m.service?.category_name
              ?? resolveCategoryName(svc)
              ?? null,
            price: Number(svc?.default_price ?? svc?.price ?? 0) || null,
            durationMinutes: svc?.duration_minutes ?? svc?.duration ?? null,
          },
        };
      });
  }, [portfolioItems, serviceById, resolveCategoryName]);

  // Filter gallery items by selected category name
  const filteredGalleryItems = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) return portfolioItems;
    return portfolioItems.filter((m: any) => m.service?.category_name === selectedCategory);
  }, [portfolioItems, selectedCategory]);

  // Cart / services selection state
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Edit profile fields — populated from server data when user enters edit mode.
  // Phone is intentionally NOT editable here: the vendor's contact phone is
  // captured at signup and surfaces only on admin/internal screens; customers
  // contact via the in-app booking + messaging flows, never via a phone chip.
  // `isEditing` / `isSaving` are owned by useEditMode below — declared after
  // the seed/save handlers so the hook can wrap them.
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editDescription, setEditDescription] = useState("");
  // Address fields are owned by the Service Location card (a separate
  // section on this page) — see ServiceLocationCard below.
  const [emailError, setEmailError] = useState<string | null>(null);
  const [outletNameError, setOutletNameError] = useState<string | null>(null);
  // Social links — full URL with scheme; backend Zod requires .url()
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editInstagramUrl, setEditInstagramUrl] = useState("");
  const [editYoutubeUrl, setEditYoutubeUrl] = useState("");
  const [websiteUrlError, setWebsiteUrlError] = useState<string | null>(null);
  const [instagramUrlError, setInstagramUrlError] = useState<string | null>(null);
  const [youtubeUrlError, setYoutubeUrlError] = useState<string | null>(null);
  // Manual override for years of experience — falls back to created_at calc when null
  const [editYearsInBusiness, setEditYearsInBusiness] = useState<string>("");
  const [yearsError, setYearsError] = useState<string | null>(null);
  // Certifications — list editor with inline add/remove
  const [editCertifications, setEditCertifications] = useState<Certification[]>([]);
  // Amenities — Set for cheap toggle/membership; serialised to string[] on save
  const [editAmenities, setEditAmenities] = useState<Set<string>>(new Set());

  // Edit - specializations / languages — seeded from API on enterEditMode
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // Edit - services (live data; trending/featured toggles persist via API)
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("All");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Gallery editing — seeded from real API data, kept in local state so UI can optimistically remove items
  const [editGallery, setEditGallery] = useState<{
    id: string; url: string; thumbnailUrl: string; caption: string; categoryName: string | null;
  }[]>([]);

  useEffect(() => {
    setEditGallery(
      filteredGalleryItems.map((m: any) => ({
        id: String(m.id),
        url: m.url ?? "",
        // Prefer the smaller thumbnail for grid renders; fall back to full image.
        thumbnailUrl: m.thumbnail_url ?? m.url ?? "",
        caption: m.caption ?? m.original_filename ?? "",
        categoryName: m.service?.category_name ?? null,
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioResult.data, selectedCategory]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleServiceClick = (service: Service) => {
    setDetailService(service);
    setDetailOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const results = await Promise.allSettled(ids.map((id) => deleteMedia.mutateAsync(id)));
    const succeeded = new Set<string>();
    let failedCount = 0;
    results.forEach((r, i) => {
      if (r.status === "fulfilled") succeeded.add(ids[i]!);
      else failedCount += 1;
    });
    setEditGallery((prev) => prev.filter((g) => !succeeded.has(g.id)));
    setSelectedIds(new Set());
    setIsSelecting(false);
    if (succeeded.size > 0 && failedCount === 0) {
      toast.success(`${succeeded.size} photo${succeeded.size === 1 ? "" : "s"} removed`);
    } else if (succeeded.size > 0 && failedCount > 0) {
      toast.warning(`${succeeded.size} removed, ${failedCount} failed`);
    } else {
      toast.error(`Failed to remove ${failedCount} photo${failedCount === 1 ? "" : "s"}`);
    }
  };


  // Populate edit fields from server data when entering edit mode. Toggling
  // isEditing itself is owned by useEditMode below — these handlers only
  // seed/reset draft state and inline errors.
  const enterEditMode = () => {
    setEditName(salon.name === "My Salon" ? "" : salon.name);
    setEditEmail(salon.email || "");
    setEditTagline(salon.tagline || "");
    setEditDescription(salon.description || "");
    setSpecializations(salon.specializations);
    setLanguages(salon.languages);
    setEditWebsiteUrl(salon.websiteUrl || "");
    setEditInstagramUrl(salon.instagramUrl || "");
    setEditYoutubeUrl(salon.youtubeUrl || "");
    setEditYearsInBusiness(salon.yearsInBusiness != null ? String(salon.yearsInBusiness) : "");
    setEditCertifications(salon.certifications);
    setEditAmenities(new Set(salon.amenities));
    setEmailError(null);
    setOutletNameError(null);
    setWebsiteUrlError(null);
    setInstagramUrlError(null);
    setYoutubeUrlError(null);
    setYearsError(null);
  };

  const cancelEditMode = () => {
    setEmailError(null);
    setOutletNameError(null);
    setWebsiteUrlError(null);
    setInstagramUrlError(null);
    setYoutubeUrlError(null);
    setYearsError(null);
  };

  const validateEmail = (v: string) =>
    !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email address";
  // URL validator — must include scheme. Backend Zod uses z.string().url().
  const validateUrl = (v: string) => {
    if (!v) return null;
    try { new URL(v); return null; } catch { return "Enter a full URL including https://"; }
  };
  const validateYears = (v: string) => {
    if (!v) return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 200) return "Enter a whole number between 0 and 200";
    return null;
  };
  // Required-name validator: outlet/brand must have a real name. Backend
  // requires `legal_business_name`/`brand_name` ≥ 1 char; we ask for 2 to
  // catch single-letter accidents.
  const validateOutletName = (v: string) =>
    !v.trim() ? "Outlet name is required" : v.trim().length < 2 ? "Use at least 2 characters" : null;

  // Strict comparator — only send fields the user actually changed.
  // Avoids hammering the API and sidesteps stale-state overwrite races.
  const arrayEq = (a: string[], b: string[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  const handleSaveProfile = async () => {
    const eErr = validateEmail(editEmail);
    const wErr = validateUrl(editWebsiteUrl);
    const igErr = validateUrl(editInstagramUrl);
    const ytErr = validateUrl(editYoutubeUrl);
    const yErr = validateYears(editYearsInBusiness);
    const nErr = validateOutletName(editName);
    setEmailError(eErr);
    setWebsiteUrlError(wErr);
    setInstagramUrlError(igErr);
    setYoutubeUrlError(ytErr);
    setYearsError(yErr);
    setOutletNameError(nErr);
    if (eErr || wErr || igErr || ytErr || yErr || nErr) {
      toast.error("Fix the highlighted fields before saving");
      // Throw so useEditMode keeps the page in edit mode and the sticky
      // EditModeBar surfaces "Fix the highlighted fields".
      throw new Error("Validation failed");
    }
    // Reject any half-filled certification rows so we don't ship broken data
    const incompleteCert = editCertifications.some((c) => !c.name.trim() || !c.issuer.trim() || !c.year);
    if (incompleteCert) {
      toast.error("Fill in name, issuer, and year for every certification — or remove blank rows");
      throw new Error("Incomplete certification rows");
    }

    const payload: Record<string, unknown> = {};
    if (editName !== salon.name) payload.brand_name = editName || undefined;
    if (editEmail !== salon.email) payload.contact_email = editEmail || undefined;
    if (editTagline !== salon.tagline) payload.tagline = editTagline || undefined;
    if (editDescription !== salon.description) payload.description = editDescription || undefined;
    // Address fields (line1/2, city, state, postal_code) are owned by the
    // Service Location card on this page — see ServiceLocationCard wiring
    // below. Saving them from two forms would race the same columns.
    if (!arrayEq(specializations, salon.specializations)) payload.specializations = specializations;
    if (!arrayEq(languages, salon.languages)) payload.languages = languages;
    if (editWebsiteUrl !== salon.websiteUrl) payload.website_url = editWebsiteUrl || undefined;
    if (editInstagramUrl !== salon.instagramUrl) payload.instagram_url = editInstagramUrl || undefined;
    if (editYoutubeUrl !== salon.youtubeUrl) payload.youtube_url = editYoutubeUrl || undefined;
    const yearsNum = editYearsInBusiness ? Number(editYearsInBusiness) : null;
    if (yearsNum !== salon.yearsInBusiness) {
      payload.years_in_business = yearsNum ?? undefined;
    }
    if (JSON.stringify(editCertifications) !== JSON.stringify(salon.certifications)) {
      payload.certifications = editCertifications;
    }
    // Amenities — order-insensitive comparison
    const editAmenitiesArr = Array.from(editAmenities).sort();
    const savedAmenitiesArr = [...salon.amenities].sort();
    if (!arrayEq(editAmenitiesArr, savedAmenitiesArr)) {
      payload.amenities = Array.from(editAmenities);
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to save");
      // No-op save — return normally so useEditMode collapses edit mode.
      return;
    }

    try {
      await updateProfile.mutateAsync(payload);
      toast.success("Profile updated");
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to save profile");
      throw err;
    }
  };

  // ── Dirty calculation — drives the sticky EditModeBar's "X unsaved
  // changes" pill and the Save button's enabled state. JSON.stringify is
  // fine here: each field is either a primitive or a small string[].
  const dirtyFields = useMemo(() => {
    const fields: Array<[string, string, string]> = [
      ["Outlet name", editName, salon.name === "My Salon" ? "" : salon.name],
      ["Email", editEmail, salon.email || ""],
      ["Tagline", editTagline, salon.tagline || ""],
      ["Description", editDescription, salon.description || ""],
      ["Specializations", JSON.stringify(specializations), JSON.stringify(salon.specializations)],
      ["Languages", JSON.stringify(languages), JSON.stringify(salon.languages)],
      ["Website", editWebsiteUrl, salon.websiteUrl || ""],
      ["Instagram", editInstagramUrl, salon.instagramUrl || ""],
      ["YouTube", editYoutubeUrl, salon.youtubeUrl || ""],
      ["Years", editYearsInBusiness, salon.yearsInBusiness != null ? String(salon.yearsInBusiness) : ""],
      ["Certifications", JSON.stringify(editCertifications), JSON.stringify(salon.certifications)],
      ["Amenities", JSON.stringify(Array.from(editAmenities).sort()), JSON.stringify([...salon.amenities].sort())],
    ];
    return fields.filter(([, draft, saved]) => draft !== saved).map(([label]) => label);
  }, [
    editName, editEmail, editTagline, editDescription,
    specializations, languages,
    editWebsiteUrl, editInstagramUrl, editYoutubeUrl,
    editYearsInBusiness, editCertifications, editAmenities,
    salon,
  ]);

  const hasInlineErrors = Boolean(
    emailError || outletNameError ||
    websiteUrlError || instagramUrlError || youtubeUrlError ||
    yearsError,
  );

  // Edit-mode controller — owns isEditing/isSaving and fires the
  // beforeunload guard while the user has unsaved changes.
  const editMode = useEditMode({
    isDirty: dirtyFields.length > 0,
    onEnter: enterEditMode,
    onCancel: cancelEditMode,
    onSave: handleSaveProfile,
  });
  const isEditing = editMode.isEditing;

  // Persist drafts to localStorage while editing so an accidental refresh
  // or tab close doesn't lose the user's in-flight changes. Keyed per
  // primary location so multiple branches don't collide.
  const draftKey = `kshuri:salon-portfolio-draft:${salonData?.primary_location_id ?? salonData?.id ?? "unknown"}`;
  const draftSnapshot = useMemo(() => ({
    editName, editEmail, editTagline, editDescription,
    specializations, languages,
    editWebsiteUrl, editInstagramUrl, editYoutubeUrl,
    editYearsInBusiness, editCertifications,
    editAmenities: Array.from(editAmenities),
  }), [
    editName, editEmail, editTagline, editDescription,
    specializations, languages,
    editWebsiteUrl, editInstagramUrl, editYoutubeUrl,
    editYearsInBusiness, editCertifications, editAmenities,
  ]);
  useDraftAutosave({
    storageKey: draftKey,
    draft: draftSnapshot,
    enabled: isEditing && dirtyFields.length > 0,
    onRestore: (saved) => {
      // Only restore if we're currently in edit mode — avoids replaying a
      // stale draft into a fresh view-mode session.
      if (!isEditing) return;
      setEditName(saved.editName ?? "");
      setEditEmail(saved.editEmail ?? "");
      setEditTagline(saved.editTagline ?? "");
      setEditDescription(saved.editDescription ?? "");
      setSpecializations(saved.specializations ?? []);
      setLanguages(saved.languages ?? []);
      setEditWebsiteUrl(saved.editWebsiteUrl ?? "");
      setEditInstagramUrl(saved.editInstagramUrl ?? "");
      setEditYoutubeUrl(saved.editYoutubeUrl ?? "");
      setEditYearsInBusiness(saved.editYearsInBusiness ?? "");
      setEditCertifications(saved.editCertifications ?? []);
      setEditAmenities(new Set(saved.editAmenities ?? []));
      toast.info("Restored your unsaved changes");
    },
  });

  // ── In-app navigation guard — react-router's useBlocker intercepts SPA
  // navigation (sidebar links, back/forward, anything that calls navigate)
  // while the user has unsaved changes, and surfaces the confirmation
  // dialog instead of letting them silently lose work.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isEditing &&
      dirtyFields.length > 0 &&
      currentLocation.pathname !== nextLocation.pathname,
  );
  const handleNavGuardSaveAndContinue = async () => {
    try {
      await editMode.save();
      // editMode.save resolves only on success → release the blocker.
      blocker.proceed?.();
    } catch {
      // Save failed; dialog stays open, sticky bar surfaces the error.
    }
  };
  const handleNavGuardDiscard = () => {
    editMode.cancel();
    blocker.proceed?.();
  };
  const handleNavGuardStay = () => {
    blocker.reset?.();
  };

  // Backend caps uploads at 10 MB; reject client-side so we don't waste bandwidth.
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
  const validateUploadFile = (file: File): string | null => {
    if (file.size > MAX_UPLOAD_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      return `Image is ${mb} MB — please upload a file under 10 MB`;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      return "Only JPEG, PNG, or WebP images are supported";
    }
    return null;
  };

  // Banner / Logo upload handlers — receive a File directly so they slot
  // into the shared <BannerLogoUploader/> component (which owns its own
  // hidden inputs + per-target spinner overlay, matching the freelancer
  // dashboard's behaviour exactly).
  const handleBannerUpload = useCallback(async (file: File) => {
    const err = validateUploadFile(file);
    if (err) { toast.error(err); throw new Error(err); }
    try {
      const media = await uploadMedia.mutateAsync({ file, options: { media_type: "cover" } });
      await updateProfile.mutateAsync({ cover_image_url: media.url });
      toast.success("Banner updated");
    } catch (err2) {
      const msg = (err2 as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to upload banner");
      throw err2;
    }
  }, [uploadMedia, updateProfile]);

  // Service location — Portfolio Edit page now exposes the salon's
  // public location (text address + lat/lng pin) inline, so the
  // business_admin doesn't have to bounce out to Settings → Salon
  // Location for a routine update. We mirror the Settings page's
  // sparse-payload logic: empty strings would fail Zod's min(1) on
  // address_line1/city/state, so we omit any cleared field.
  const [isLocationSaving, setIsLocationSaving] = useState(false);
  const locationInitialValue: AddressPickerValue = {
    address_line1: salonData?.address_line1 ?? undefined,
    city: salonData?.city ?? undefined,
    state: salonData?.state ?? undefined,
    postal_code: salonData?.postal_code ?? undefined,
    country_code: salonData?.country_code ?? undefined,
    latitude: salonData?.latitude ?? undefined,
    longitude: salonData?.longitude ?? undefined,
  };

  const handleSaveLocation = useCallback(async (next: AddressPickerValue) => {
    const businessPayload: Record<string, unknown> = {};
    const set = (key: string, v: string | undefined) => {
      const trimmed = (v ?? "").trim();
      if (trimmed) businessPayload[key] = trimmed;
    };
    set("address_line1", next.address_line1);
    set("city", next.city);
    set("state", next.state);
    set("postal_code", next.postal_code);

    setIsLocationSaving(true);
    try {
      if (Object.keys(businessPayload).length > 0) {
        await updateProfile.mutateAsync(businessPayload);
      }

      // Lat/lng live on the primary salon_locations row, not on the
      // business profile. The dedicated endpoint also accepts text
      // address fields for the location, so we forward those again so
      // the location row stays in sync with the brand profile.
      const locationId: string | undefined = salonData?.primary_location_id;
      if (locationId && (next.latitude != null || next.longitude != null)) {
        const locPayload: Record<string, unknown> = {
          lat: next.latitude,
          lng: next.longitude,
        };
        if ((next.address_line1 ?? "").trim()) {
          locPayload.address_line1 = next.address_line1!.trim();
        }
        if ((next.city ?? "").trim()) locPayload.city = next.city!.trim();
        if ((next.state ?? "").trim()) locPayload.state = next.state!.trim();
        if (/^\d{6}$/.test(next.postal_code ?? "")) {
          locPayload.pincode = next.postal_code;
        }
        await apiClient.put(`/business/locations/${locationId}`, locPayload);
      }
      toast.success("Salon location saved");
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error("Couldn't save location", { description: msg ?? (e as Error).message });
      // Rethrow so the shared ServiceLocationCard stays in edit mode on
      // failure (it collapses to view mode only when onSave resolves).
      throw e;
    } finally {
      setIsLocationSaving(false);
    }
  }, [apiClient, salonData, updateProfile]);

  const handleLogoUpload = useCallback(async (file: File) => {
    const err = validateUploadFile(file);
    if (err) { toast.error(err); throw new Error(err); }
    try {
      const media = await uploadMedia.mutateAsync({ file, options: { media_type: "profile" } });
      await updateProfile.mutateAsync({ logo_url: media.url });
      toast.success("Logo updated");
    } catch (err2) {
      const msg = (err2 as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to upload logo");
      throw err2;
    }
  }, [uploadMedia, updateProfile]);

  const handleBrowseServices = () => {
    setPreviewSubTab("services");
  };

  // removeSpecialization helper retired — the shared CategoryPicker calls
  // onRemove directly with the chip name; the inline updater there is short
  // enough to inline. Languages still uses the local helper below for now.

  const removeLanguage = (lang: string) => {
    setLanguages((prev) => prev.filter((l) => l !== lang));
  };

  // Note: `is_trending` is intentionally NOT a vendor-editable flag — it's
  // computed server-side from rolling booking volume so the public "Trending"
  // chip reflects real customer demand instead of self-promotion. Vendors
  // only control `is_featured` (toggle below).
  const toggleServiceFeatured = (svc: Service) => {
    updateService.mutate(
      { serviceId: svc.id, payload: { is_featured: !(svc.featured ?? false) } },
      {
        onError: (err) => {
          const msg = (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message;
          toast.error(msg ?? "Couldn't update featured flag");
        },
      },
    );
  };

  const deleteEditService = (id: string) => {
    deleteService.mutate(id, {
      onSuccess: () => toast.success("Service removed"),
      onError: () => toast.error("Failed to remove service"),
    });
  };

  // Filtered edit services (driven by live API data; toggles persist via mutation)
  const filteredEditServices = mockServices.filter((s) => {
    if (serviceSearch && !s.name.toLowerCase().includes(serviceSearch.toLowerCase())) return false;
    if (serviceCategoryFilter !== "All" && s.category !== serviceCategoryFilter) return false;
    return true;
  });

  const editServicesByCategory = filteredEditServices.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.category ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const activeEditServices = mockServices.filter((s) => s.is_active !== false);
  const avgPrice = activeEditServices.length > 0
    ? Math.round(activeEditServices.reduce((sum, s) => sum + s.price, 0) / activeEditServices.length)
    : 0;

  // Trending & featured services for preview
  const trendingServices = mockServices.filter((s) => s.trending && s.is_active !== false);
  const featuredServices = mockServices.filter((s) => s.featured && s.is_active !== false);

  // Rating distribution — no reviews API yet, show zeros
  // Rating distribution + total derived from live `reviewSummary` so the About
  // tab's mini-breakdown stays consistent with the Reviews tab summary.
  const ratingDist: Record<5 | 4 | 3 | 2 | 1, number> = {
    5: reviewSummary.rating_5,
    4: reviewSummary.rating_4,
    3: reviewSummary.rating_3,
    2: reviewSummary.rating_2,
    1: reviewSummary.rating_1,
  };
  const totalRatings = reviewSummary.total_count;
  const liveAvgRating = totalRatings > 0
    ? Math.round(reviewSummary.avg_rating * 10) / 10
    : salon.rating;

  // Years of experience is opt-in — we only ever surface what the salon
  // explicitly enters via the Edit tab. The previous implementation estimated
  // "years on the platform" via `Math.max(1, now - created_at)`, which made
  // every brand-new signup falsely advertise "1+ Yrs Experience" before they
  // had typed anything. That's the kind of trust-eroding noise we don't want
  // on a vendor's public profile.
  const yearsExp = salon.yearsInBusiness != null ? salon.yearsInBusiness : null;

  // Profile-completeness checklist — drives a progress card on the Edit tab.
  // Each item is independently observable so the user knows exactly what's left.
  // Tradeoff: simple equally-weighted items; if any item proves disproportionately
  // valuable for conversion we can promote it to a 2x weight later.
  const completenessChecks: { key: string; label: string; done: boolean }[] = [
    { key: "name",            label: "Outlet name",               done: !!salonData?.brand_name || !!salonData?.legal_business_name },
    { key: "logo",            label: "Logo uploaded",             done: !!salon.logo },
    { key: "banner",          label: "Banner uploaded",           done: !!salon.bannerImage },
    { key: "tagline",         label: "Tagline added",             done: !!salon.tagline },
    { key: "description",     label: "Description (50+ chars)",   done: (salon.description ?? "").trim().length >= 50 },
    { key: "email",           label: "Email address",             done: !!salon.email },
    { key: "address",         label: "Full address",              done: !!salon.addressLine1 && !!salon.city && !!salon.postalCode },
    { key: "services",        label: "At least 1 service",        done: mockServices.some((s) => s.is_active !== false) },
    { key: "photos",          label: "3+ portfolio photos",       done: portfolioItems.length >= 3 },
    { key: "specializations", label: "Specializations",           done: salon.specializations.length > 0 },
    { key: "social",          label: "1+ social link",            done: !!salon.websiteUrl || !!salon.instagramUrl || !!salon.youtubeUrl },
    { key: "experience",      label: "Years in business",         done: salon.yearsInBusiness != null },
    { key: "certifications",  label: "1+ certification",          done: salon.certifications.length > 0 },
    { key: "amenities",       label: "3+ amenities",              done: salon.amenities.length >= 3 },
  ];
  const completedCount = completenessChecks.filter((c) => c.done).length;
  const completenessPct = Math.round((completedCount / completenessChecks.length) * 100);

  // First-load skeleton — only when nothing is cached yet
  if (businessResult.isLoading && !businessResult.data) {
    return (
      <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Hard-fail state: business profile fetch errored
  if (businessResult.isError) {
    return (
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1440px] mx-auto">
        <Card className="border-destructive/40">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Couldn't load your portfolio</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We hit an error fetching your salon profile. Check your connection and try again.
              </p>
            </div>
            <Button onClick={() => businessResult.refetch()} disabled={businessResult.isFetching}>
              {businessResult.isFetching ? "Retrying…" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1440px] mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold lg:text-2xl tracking-tight">Portfolio</h1>
            <p className="mt-1 text-sm text-muted-foreground">Showcase your work</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Page header keeps only the Share + Open CTAs. The "Edit
                profile" button now sits on the tabs row (opposite the
                tab triggers) — much clearer that it's a tab-level action,
                not a page-level one. */}
            <SharePortfolioButton
              slug={salonData?.url_slug ?? null}
              vendorName={salon.name || undefined}
            />

          </div>
        </div>
      </FadeIn>

      {/* Main Tabs — horizontal scroll on narrow phones to prevent overflow.
          The tabs sit on the left; the page-level "Edit profile" button on
          the right (only on the Edit tab + not already editing). */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-3 -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="overflow-x-auto min-w-0">
            <TabsList className="bg-muted/50 h-10 rounded-xl w-max lg:w-auto">
              <TabsTrigger value="preview" className="gap-1.5 text-xs rounded-lg whitespace-nowrap">
                <Eye className="h-3.5 w-3.5" /> Public Preview
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-1.5 text-xs rounded-lg whitespace-nowrap">
                <Grid3X3 className="h-3.5 w-3.5" /> Manage Gallery
              </TabsTrigger>
              <TabsTrigger value="edit" className="gap-1.5 text-xs rounded-lg whitespace-nowrap">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </TabsTrigger>
            </TabsList>
          </div>
          {activeTab === "edit" && !isEditing && (
            <Button
              size="default"
              className="shrink-0 gap-2 text-sm h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 px-5 font-semibold"
              onClick={editMode.enter}
            >
              <Pencil className="h-4 w-4" /> Edit profile
            </Button>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* ─── PUBLIC PREVIEW TAB ─────────────────── */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="preview" className="mt-5 space-y-0">
          <Card className="border-border/40 overflow-hidden">
            <div className="bg-background rounded-xl">
              <VendorBanner vendor={vendorProfile} />

              {/* Quick Stats Bar — only renders cards backed by real data so the
                  layout doesn't show "—" tombstones for empty metrics. */}
              {(() => {
                const stats = [
                  salon.rating > 0
                    ? { icon: Star, label: "Rating", value: `${salon.rating.toFixed(1)}/5` }
                    : null,
                  mockServices.length > 0
                    ? { icon: Sparkles, label: "Services", value: String(mockServices.length) }
                    : null,
                  yearsExp != null
                    ? { icon: Award, label: "Experience", value: `${yearsExp}+ Yrs` }
                    : null,
                  salon.reviewCount > 0
                    ? { icon: Users, label: "Reviews", value: String(salon.reviewCount) }
                    : null,
                ].filter((s): s is NonNullable<typeof s> => s !== null);
                if (stats.length === 0) return null;
                const colsClass = stats.length >= 4
                  ? "grid-cols-2 md:grid-cols-4"
                  : stats.length === 3
                    ? "grid-cols-3"
                    : stats.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-1";
                return (
                  <div className="max-w-6xl mx-auto px-4 lg:px-8">
                    <StaggerContainer className={cn("grid gap-3 -mt-6 relative z-10 mb-6", colsClass)}>
                      {stats.map((stat) => (
                        <StaggerItem key={stat.label}>
                          <Card className="border-border/40 bg-card/95 backdrop-blur-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <stat.icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xl font-bold font-serif">{stat.value}</p>
                                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </div>
                );
              })()}

              {/* Main content */}
              <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10">
                  <div>
                    <VendorHeader vendor={vendorProfile} ownerPreview />

                    {/* Amenities quick-strip — at-a-glance facility scan, full
                        grouped detail still lives in the About sub-tab. */}
                    {salon.amenities.length > 0 && (
                      <div className="mt-5 -mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto">
                        <div className="flex gap-2 w-max lg:w-auto lg:flex-wrap">
                          {salon.amenities
                            .map((k: string) => SALON_AMENITIES_BY_KEY[k])
                            .filter((a): a is NonNullable<typeof a> => !!a)
                            .map((a) => {
                              const Icon = amenityIcon(a.key);
                              return (
                                <div
                                  key={a.key}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background/40 shrink-0"
                                  title={a.label}
                                >
                                  <Icon className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-[11px] font-medium whitespace-nowrap">{a.label}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Trending Services */}
                    {trendingServices.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-bold flex items-center gap-1.5 mb-3 text-destructive">
                          <TrendingUp className="h-4 w-4" /> Trending Services
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {trendingServices.map((s) => (
                            <Card
                              key={s.id}
                              className="border-border/40 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleServiceClick(s)}
                            >
                              <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className="bg-destructive/15 text-destructive text-[9px] border-0">
                                      <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> TRENDING
                                    </Badge>
                                    {s.featured && (
                                      <Badge className="bg-success/15 text-success text-[9px] border-0">
                                        <Sparkles className="h-2.5 w-2.5 mr-0.5" /> FEATURED
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm font-semibold">{s.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {s.duration_minutes ? `${s.duration_minutes} min` : "Duration TBD"}
                                    {s.category ? ` · ${s.category}` : ""}
                                  </p>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <p className="text-lg font-bold font-serif">₹{s.price.toLocaleString("en-IN")}</p>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Featured Services */}
                    {featuredServices.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-bold flex items-center gap-1.5 mb-3">
                          <Sparkles className="h-4 w-4 text-primary" /> Featured Services
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {featuredServices.map((s) => (
                            <Card
                              key={s.id}
                              className="border-primary/20 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleServiceClick(s)}
                            >
                              <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                  <Badge className="bg-success/15 text-success text-[9px] border-0 mb-1">
                                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> FEATURED
                                  </Badge>
                                  <p className="text-sm font-semibold">{s.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {s.duration_minutes ? `${s.duration_minutes} min` : "Duration TBD"}
                                    {s.category ? ` · ${s.category}` : ""}
                                  </p>
                                </div>
                                <p className="text-lg font-bold font-serif">₹{s.price.toLocaleString("en-IN")}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <hr className="my-6 border-border/60" />

                    {/* Sub-tabs */}
                    <Tabs value={previewSubTab} onValueChange={setPreviewSubTab}>
                      <TabsList className="w-full justify-start bg-transparent border-b border-border/60 rounded-none p-0 h-auto gap-0">
                        {[
                          { value: "portfolio", label: "Gallery", icon: Grid3X3 },
                          { value: "about", label: "About", icon: MessageSquare },
                          { value: "services", label: "Services", icon: Tag },
                          { value: "products", label: `Products (${activeProducts.length})`, icon: Package },
                          { value: "reviews", label: `Reviews (${reviews.length})`, icon: MessageSquare },
                        ].map((tab) => (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 data-[state=active]:text-primary font-medium"
                          >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <TabsContent value="portfolio" className="mt-6">
                        <PortfolioTab
                          serviceItems={serviceGalleryItems}
                          onBookService={() => setBookingDialogOpen(true)}
                        />
                      </TabsContent>
                      <TabsContent value="about" className="mt-6">
                        {/* About — focused on what's NOT already shown above the tabs:
                            description, certifications, languages, social presence.
                            Specializations / Amenities / Rating-breakdown live in
                            their own canonical surfaces (header chips, quick-strip,
                            Reviews tab) — repeating them here just bloats the page. */}
                        <FadeIn className="space-y-6">
                          <div>
                            <h2 className="text-xl font-bold font-serif mb-2">About {ownerName}</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {salon.description || "No business description added yet. Update your salon profile to add a description."}
                            </p>
                          </div>

                          {salon.languages.length > 0 && (
                            <p className="text-sm text-muted-foreground inline-flex items-center gap-2 flex-wrap">
                              <Languages className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">Languages spoken:</span>
                              <span>{salon.languages.join(" · ")}</span>
                            </p>
                          )}

                          {/* Certifications */}
                          {salon.certifications.length > 0 && (
                            <>
                              <h3 className="text-sm font-bold flex items-center gap-1.5 mb-3">
                                <Shield className="h-4 w-4 text-primary" /> Certifications
                              </h3>
                              <div className="space-y-2 mb-6">
                                {salon.certifications.map((c: Certification, idx: number) => (
                                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                      <Shield className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{c.name}</p>
                                      <p className="text-[11px] text-muted-foreground truncate">{c.issuer} · {c.year}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                        </FadeIn>
                      </TabsContent>
                      <TabsContent value="services" className="mt-6">
                        <ServicesTab
                          services={vendorServices}
                          selectedServices={selectedServices}
                          onToggleService={toggleService}
                          onServiceClick={handleServiceClick}
                        />
                      </TabsContent>
                      <TabsContent value="products" className="mt-6">
                        {productsResult.isLoading && activeProducts.length === 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <Skeleton key={i} className="h-24 rounded-xl" />
                            ))}
                          </div>
                        ) : activeProducts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-medium">No products listed yet</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                              Add retail products from the Categories page so customers can browse what you stock.
                            </p>
                          </div>
                        ) : (
                          <FadeIn className="space-y-4">
                            {(() => {
                              // Group products by category. Use "Other" bucket for
                              // anything without a category so the section header
                              // stays meaningful.
                              const grouped = activeProducts.reduce<Record<string, typeof activeProducts>>((acc, p) => {
                                const key = p.category?.trim() || "Other";
                                (acc[key] ??= []).push(p);
                                return acc;
                              }, {});
                              return Object.entries(grouped).map(([category, items]) => (
                                <div key={category}>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    {category} <span className="font-normal">({items.length})</span>
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {items.map((p) => {
                                      const stock = typeof p.stock === "number" ? p.stock : null;
                                      const price = Number(p.price ?? 0);
                                      const stockBadge =
                                        stock === null
                                          ? null
                                          : stock > 10
                                            ? { className: "bg-success/15 text-success", label: "In stock" }
                                            : stock > 0
                                              ? { className: "bg-amber-500/15 text-amber-400", label: `Only ${stock} left` }
                                              : { className: "bg-destructive/15 text-destructive", label: "Out of stock" };
                                      return (
                                        <Card key={p.id} className="border-border/40">
                                          <CardContent className="p-4 flex items-start gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                              <Package className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-semibold truncate">{p.name}</p>
                                                <p className="text-base font-bold font-serif shrink-0">
                                                  ₹{price.toLocaleString("en-IN")}
                                                </p>
                                              </div>
                                              {p.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                                              )}
                                              {stockBadge && (
                                                <Badge className={cn("mt-2 text-[10px] border-0", stockBadge.className)}>
                                                  {stockBadge.label}
                                                </Badge>
                                              )}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                  </div>
                                </div>
                              ));
                            })()}
                          </FadeIn>
                        )}
                      </TabsContent>
                      <TabsContent value="reviews" className="mt-6">
                        <ReviewsTab
                          reviews={reviews}
                          summary={reviewSummary}
                          isLoading={reviewsResult.isLoading}
                          isError={reviewsResult.isError}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                  {/* Booking column — sticky on desktop so it follows the
                      reader through the long About / Services scroll instead
                      of leaving a big empty L-shape. */}
                  <div className="lg:sticky lg:top-6 lg:self-start">
                    <VendorBookingCard
                      vendor={vendorProfile}
                      selectedServices={selectedServices}
                      allServices={vendorServices}
                      onRemoveService={(id) => toggleService(id)}
                      onBrowseServices={handleBrowseServices}
                      onBookAppointment={() => setBookingDialogOpen(true)}
                      onCheckAvailability={() => setBookingDialogOpen(true)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            This is how your profile appears to customers on Estylr
          </p>
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* ─── MANAGE GALLERY TAB ─────────────────── */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="gallery" className="mt-5 space-y-5">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Total Photos",
                value: portfolioItems.length.toLocaleString("en-IN"),
                icon: Grid3X3,
                hint: undefined,
              },
              {
                label: "Linked to Services",
                value: Object.keys(usageByService).length.toLocaleString("en-IN"),
                icon: ImagePlus,
                hint: "Photos linked to a service",
              },
              {
                label: "Profile Views",
                value: engagementResult.isLoading
                  ? "…"
                  : Number(engagement.view_count).toLocaleString("en-IN"),
                icon: Eye,
                hint: "Times your public outlet profile has been viewed",
              },
              {
                label: "Likes",
                value: engagementResult.isLoading
                  ? "…"
                  : Number(engagement.favorite_count).toLocaleString("en-IN"),
                icon: Heart,
                hint: "Customers who saved your outlet",
              },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <Card className="border-border/40" title={stat.hint}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-primary/10 shrink-0">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold font-serif text-foreground">{stat.value}</p>
                      <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <Button
                key={ALL_CATEGORIES}
                variant={selectedCategory === ALL_CATEGORIES ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs h-8 rounded-lg px-4 shrink-0",
                  selectedCategory !== ALL_CATEGORIES && "text-muted-foreground",
                )}
                onClick={() => setSelectedCategory(ALL_CATEGORIES)}
              >
                All
              </Button>
              {galleryCategories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs h-8 rounded-lg px-4 shrink-0",
                    selectedCategory !== cat && "text-muted-foreground",
                  )}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {isSelecting ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5 text-xs h-8 rounded-lg"
                    onClick={handleDelete}
                    disabled={selectedIds.size === 0 || deleteMedia.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleteMedia.isPending ? "Deleting…" : `Delete (${selectedIds.size})`}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-lg"
                    onClick={() => { setIsSelecting(false); setSelectedIds(new Set()); }}
                    disabled={deleteMedia.isPending}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 rounded-lg" onClick={() => setIsSelecting(true)}>Select</Button>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-8 rounded-lg"
                    onClick={() => setUploadDialogOpen(true)}
                    disabled={uploadServices.length === 0}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setUploadDialogOpen(true)}
              disabled={uploadServices.length === 0}
              className={cn(
                "aspect-[4/5] rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300",
                uploadServices.length === 0 && "opacity-50 cursor-not-allowed",
              )}
            >
              <Plus className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">
                {uploadServices.length === 0 ? "Add a service first" : "Add Photo"}
              </span>
            </button>

            {portfolioResult.isLoading && editGallery.length === 0 && (
              <div className="col-span-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
                ))}
              </div>
            )}

            {portfolioResult.isError && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm font-medium">Couldn't load your photos</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs h-8 rounded-lg"
                  onClick={() => portfolioResult.refetch()}
                  disabled={portfolioResult.isFetching}
                >
                  {portfolioResult.isFetching ? "Retrying…" : "Retry"}
                </Button>
              </div>
            )}

            {editGallery.length === 0 && !portfolioResult.isLoading && !portfolioResult.isError && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Camera className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No photos yet</p>
                <p className="text-xs mt-1 opacity-70">Upload your first portfolio photo to get started</p>
              </div>
            )}

            {editGallery.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
              <div
                key={item.id}
                className={cn(
                  "relative aspect-[4/5] rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 bg-gradient-to-b from-muted/20 to-muted/50",
                  isSelecting && isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                onClick={() => isSelecting ? toggleSelect(item.id) : undefined}
              >
                {item.url ? (
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.caption || "Portfolio photo"}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}

                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/60 to-transparent">
                    <p className="text-card text-xs font-medium leading-snug">{item.caption}</p>
                  </div>
                )}

                {isSelecting && (
                  <div className={cn(
                    "absolute top-2.5 right-2.5 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all",
                    isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-card/70 border-border backdrop-blur-sm"
                  )}>
                    {isSelected && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
                {!isSelecting && (
                  <button
                    className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-destructive/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMedia.mutate(item.id, {
                        onSuccess: () => {
                          setEditGallery((prev) => prev.filter((g) => g.id !== item.id));
                          toast.success("Photo removed");
                        },
                        onError: () => toast.error("Failed to delete photo"),
                      });
                    }}
                  >
                    <X className="h-3.5 w-3.5 text-foreground" />
                  </button>
                )}
              </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* ─── EDIT PROFILE TAB ───────────────────── */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="edit" className="mt-5 space-y-5">
          {/* ─── Profile Completeness — top of the page because it's the
              dashboard widget that drives action ("8 of 14 done…") and is
              what brings users back to the Edit tab. ─── */}
          <Card
            className={cn(
              "border-border/40",
              completenessPct === 100 && "border-success/40 bg-success/5",
            )}
          >
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {completenessPct === 100 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Profile complete
                    </>
                  ) : (
                    <>Complete your profile</>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {completenessPct === 100
                    ? "Great work — customers see a fully filled-out outlet profile."
                    : `${completedCount} of ${completenessChecks.length} done. A complete profile drives more bookings.`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold font-serif">{completenessPct}%</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    completenessPct === 100 ? "bg-success" : "bg-primary",
                  )}
                  style={{ width: `${completenessPct}%` }}
                />
              </div>
              {completenessPct < 100 && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {completenessChecks.map((c) => (
                    <li key={c.key} className="flex items-center gap-2 text-xs">
                      {c.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                      )}
                      <span className={cn(c.done ? "text-muted-foreground line-through" : "text-foreground")}>
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* ─── Banner & Logo — the first thing customers see on your
              public profile. Self-saves on file pick (independent of the
              page-level Edit button). ─── */}
          <BannerLogoUploader
            bannerUrl={salon.bannerImage}
            logoUrl={salon.logo}
            onBannerFile={handleBannerUpload}
            onLogoFile={handleLogoUpload}
          />

          {/* Basic Info — per-card Edit/Save/Cancel cluster removed; the
              page-level Edit button (right of the tabs row) + sticky
              EditModeBar at the viewport bottom now drive every section
              uniformly. No coloured ring in edit mode — the sticky bar
              already gives unambiguous visual feedback. */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Outlet Name <span className="text-destructive">*</span>
                  </label>
                  {isEditing ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          if (outletNameError) setOutletNameError(validateOutletName(e.target.value));
                        }}
                        onBlur={(e) => setOutletNameError(validateOutletName(e.target.value))}
                        className={cn("h-10 rounded-xl", outletNameError && "border-destructive focus-visible:ring-destructive")}
                        placeholder="e.g. Glow Salon & Spa, Urban Chic Studio"
                        maxLength={200}
                      />
                      {outletNameError && <p className="text-[11px] text-destructive">{outletNameError}</p>}
                    </>
                  ) : (
                    <p className="text-sm text-foreground font-medium py-2">{salon.name || "—"}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                  {isEditing ? (
                    <>
                      <Input
                        value={editEmail}
                        onChange={(e) => {
                          setEditEmail(e.target.value);
                          if (emailError) setEmailError(validateEmail(e.target.value));
                        }}
                        onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                        className={cn("h-10 rounded-xl", emailError && "border-destructive focus-visible:ring-destructive")}
                        placeholder="contact@example.com"
                        inputMode="email"
                      />
                      {emailError && <p className="text-[11px] text-destructive">{emailError}</p>}
                    </>
                  ) : (
                    <p className="text-sm text-foreground font-medium py-2">{salon.email || "—"}</p>
                  )}
                </div>

              </div>

              {/* Address fields moved to the dedicated "Salon location" card
                  below so the vendor edits address + pin in one place
                  alongside the map. Keeping them only here also unblocks
                  reverse-geocoded autofill from the map without two
                  forms fighting over the same state. */}

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tagline</label>
                {isEditing ? (
                  <>
                    <Input
                      value={editTagline}
                      onChange={(e) => setEditTagline(e.target.value)}
                      className="h-10 rounded-xl"
                      placeholder="A one-line hook for your outlet"
                      maxLength={160}
                    />
                    <p className="text-[10px] text-muted-foreground">{editTagline.length} / 160</p>
                  </>
                ) : (
                  <p className="text-sm text-foreground font-medium py-2 italic">{salon.tagline || "—"}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                {isEditing ? (
                  <>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="min-h-[88px] rounded-xl"
                      placeholder="Tell customers what makes your outlet special"
                      maxLength={1000}
                    />
                    <p className="text-[10px] text-muted-foreground">{editDescription.length} / 1000</p>
                  </>
                ) : (
                  <p className="text-sm text-foreground py-2 whitespace-pre-wrap">{salon.description || "—"}</p>
                )}
              </div>

              <Separator className="bg-border/40" />

              {/* Specializations — uses the shared CategoryPicker so the
                  picker, dropdowns, and "+ Add custom" affordances are
                  identical to the freelancer Skills picker. Salon picks
                  top-level taxonomy nodes; freelancer picks leaves. */}
              <div>
                <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Specializations
                </h4>
                {isEditing ? (
                  // mode="leaf" so the salon's picker mirrors the freelancer's
                  // Skills picker exactly: grouped subcategories under each
                  // parent. A salon "specialization" is the same shape as a
                  // freelancer "skill" — a specific leaf in the taxonomy.
                  // Legacy top-level entries (Hair, Skin, …) keep rendering as
                  // chips because the picker is name-based; vendors can swap
                  // them for the finer-grained leaves over time.
                  <CategoryPicker
                    mode="leaf"
                    value={specializations}
                    onAdd={({ name }) =>
                      setSpecializations((prev) => (prev.includes(name) ? prev : [...prev, name]))
                    }
                    onRemove={(name) =>
                      setSpecializations((prev) => prev.filter((s) => s !== name))
                    }
                    placeholder="Add a specialization"
                    emptyText="Add what your outlet specialises in."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {salon.specializations.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">None added yet.</p>
                    ) : (
                      salon.specializations.map((item) => (
                        <Badge key={item} variant="outline" className="text-xs gap-1 text-primary border-primary/30">
                          {item}
                        </Badge>
                      ))
                    )}
                  </div>
                )}

                {/* Auto-derived from services — every category / subcategory
                    in use on an active service surfaces here as a read-only
                    chip. Deduped against the manual Specializations list so
                    the same name never appears twice. Edit/preview-agnostic
                    — vendors see the same full picture in both modes. */}
                {(() => {
                  const manualNames = new Set(
                    (isEditing ? specializations : salon.specializations).map((s) =>
                      s.trim().toLowerCase(),
                    ),
                  );
                  const derivedNames = Array.from(
                    new Set(
                      servicesData
                        .filter((s: any) => s.is_active !== false)
                        .flatMap((s: any) => {
                          const out: string[] = [];
                          if (typeof s.category === "string" && s.category.trim()) {
                            out.push(s.category.trim());
                          }
                          if (typeof s.category?.name === "string" && s.category.name.trim()) {
                            out.push(s.category.name.trim());
                          }
                          if (typeof s.subcategory === "string" && s.subcategory.trim()) {
                            out.push(s.subcategory.trim());
                          }
                          return out;
                        }),
                    ),
                  ).filter((n) => !manualNames.has(n.toLowerCase()));
                  if (derivedNames.length === 0) return null;
                  return (
                    <div className="space-y-1.5 pt-2 border-t border-border/40 mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Also from your services
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {derivedNames.map((name) => (
                          <Badge
                            key={name}
                            variant="secondary"
                            className="text-xs gap-1 text-muted-foreground bg-muted/40 border-border/40"
                            title="Comes from a service you offer — remove the service to hide this"
                          >
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Languages — pickable in edit mode, read-only otherwise */}
              <div>
                <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                  <Languages className="h-3.5 w-3.5 text-primary" /> Languages
                </h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(isEditing ? languages : salon.languages).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      {isEditing ? "Add languages your team speaks." : "None added yet."}
                    </p>
                  )}
                  {(isEditing ? languages : salon.languages).map((lang) => (
                    <Badge key={lang} variant="outline" className="text-xs gap-1">
                      {lang}
                      {isEditing && (
                        <button type="button" onClick={() => removeLanguage(lang)} aria-label={`Remove ${lang}`}>
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Select
                    value=""
                    onValueChange={(val) => setLanguages((prev) => prev.includes(val) ? prev : [...prev, val])}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs w-40">
                      <SelectValue placeholder="Add language" />
                    </SelectTrigger>
                    <SelectContent>
                      {SALON_LANGUAGES.filter((v) => !languages.includes(v)).map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Social Links + Experience + Certifications ─── */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Social & Credibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Social URLs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Website
                  </label>
                  {isEditing ? (
                    <>
                      <Input
                        value={editWebsiteUrl}
                        onChange={(e) => {
                          setEditWebsiteUrl(e.target.value);
                          if (websiteUrlError) setWebsiteUrlError(validateUrl(e.target.value));
                        }}
                        onBlur={(e) => setWebsiteUrlError(validateUrl(e.target.value))}
                        className={cn("h-10 rounded-xl text-xs", websiteUrlError && "border-destructive focus-visible:ring-destructive")}
                        placeholder="https://yoursalon.com"
                        inputMode="url"
                      />
                      {websiteUrlError && <p className="text-[11px] text-destructive">{websiteUrlError}</p>}
                    </>
                  ) : (
                    <p className="text-sm py-2 truncate">
                      {salon.websiteUrl
                        ? <a href={salon.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{salon.websiteUrl}</a>
                        : "—"}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Instagram</label>
                  {isEditing ? (
                    <>
                      <Input
                        value={editInstagramUrl}
                        onChange={(e) => {
                          setEditInstagramUrl(e.target.value);
                          if (instagramUrlError) setInstagramUrlError(validateUrl(e.target.value));
                        }}
                        onBlur={(e) => setInstagramUrlError(validateUrl(e.target.value))}
                        className={cn("h-10 rounded-xl text-xs", instagramUrlError && "border-destructive focus-visible:ring-destructive")}
                        placeholder="https://instagram.com/youroutlet"
                        inputMode="url"
                      />
                      {instagramUrlError && <p className="text-[11px] text-destructive">{instagramUrlError}</p>}
                    </>
                  ) : (
                    <p className="text-sm py-2 truncate">
                      {salon.instagramUrl
                        ? <a href={salon.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{salon.instagramUrl}</a>
                        : "—"}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">YouTube</label>
                  {isEditing ? (
                    <>
                      <Input
                        value={editYoutubeUrl}
                        onChange={(e) => {
                          setEditYoutubeUrl(e.target.value);
                          if (youtubeUrlError) setYoutubeUrlError(validateUrl(e.target.value));
                        }}
                        onBlur={(e) => setYoutubeUrlError(validateUrl(e.target.value))}
                        className={cn("h-10 rounded-xl text-xs", youtubeUrlError && "border-destructive focus-visible:ring-destructive")}
                        placeholder="https://youtube.com/@youroutlet"
                        inputMode="url"
                      />
                      {youtubeUrlError && <p className="text-[11px] text-destructive">{youtubeUrlError}</p>}
                    </>
                  ) : (
                    <p className="text-sm py-2 truncate">
                      {salon.youtubeUrl
                        ? <a href={salon.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{salon.youtubeUrl}</a>
                        : "—"}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Years of Experience */}
              <div className="space-y-1.5 max-w-xs">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-3 w-3" /> Years in Business
                </label>
                {isEditing ? (
                  <>
                    <Input
                      value={editYearsInBusiness}
                      onChange={(e) => {
                        setEditYearsInBusiness(e.target.value);
                        if (yearsError) setYearsError(validateYears(e.target.value));
                      }}
                      onBlur={(e) => setYearsError(validateYears(e.target.value))}
                      className={cn("h-10 rounded-xl", yearsError && "border-destructive focus-visible:ring-destructive")}
                      placeholder="e.g. 12"
                      inputMode="numeric"
                    />
                    {yearsError && <p className="text-[11px] text-destructive">{yearsError}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      Leave blank to auto-calculate from your account creation date.
                    </p>
                  </>
                ) : (
                  <p className="text-sm py-2">
                    {salon.yearsInBusiness != null
                      ? `${salon.yearsInBusiness} ${salon.yearsInBusiness === 1 ? "year" : "years"}`
                      : "—"}
                  </p>
                )}
              </div>

              <Separator className="bg-border/40" />

              {/* Certifications repeater */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" /> Certifications & Training
                  </h4>
                  {isEditing && editCertifications.length < 20 && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="h-7 gap-1 text-[11px] rounded-lg"
                      onClick={() => setEditCertifications((prev) => [
                        ...prev,
                        { name: "", issuer: "", year: new Date().getFullYear() },
                      ])}
                    >
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  )}
                </div>

                {(isEditing ? editCertifications : salon.certifications).length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    {isEditing ? "Add a certification to build trust with customers." : "None added yet."}
                  </p>
                )}

                {isEditing
                  ? editCertifications.map((c, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_90px_auto] gap-2 mb-2 items-start">
                        <Input
                          value={c.name}
                          onChange={(e) => setEditCertifications((prev) => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                          placeholder="Certification name"
                          maxLength={150}
                          className="h-9 rounded-lg text-xs"
                        />
                        <Input
                          value={c.issuer}
                          onChange={(e) => setEditCertifications((prev) => prev.map((p, i) => i === idx ? { ...p, issuer: e.target.value } : p))}
                          placeholder="Issuer"
                          maxLength={150}
                          className="h-9 rounded-lg text-xs"
                        />
                        <Input
                          value={String(c.year)}
                          onChange={(e) => setEditCertifications((prev) => prev.map((p, i) => i === idx ? { ...p, year: Number(e.target.value) || 0 } : p))}
                          placeholder="Year"
                          inputMode="numeric"
                          maxLength={4}
                          className="h-9 rounded-lg text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setEditCertifications((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label="Remove certification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  : salon.certifications.map((c: Certification, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Shield className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.issuer} · {c.year}
                            {c.credential_id ? ` · ID ${c.credential_id}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Amenities (location facilities) ─── */}
          <Card className="border-border/40">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base font-semibold">Amenities & Facilities</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Pick what your branch offers. These show on your public profile and help customers choose.
                </p>
              </div>
              {!isEditing && salon.amenities.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {salon.amenities.length} active
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {SALON_AMENITY_GROUPS.map((group) => {
                const groupItems = SALON_AMENITIES.filter((a) => a.group === group);
                if (groupItems.length === 0) return null;
                if (!isEditing) {
                  // Read mode — only render the group if any of its keys are selected.
                  const selected = groupItems.filter((a) => salon.amenities.includes(a.key));
                  if (selected.length === 0) return null;
                  return (
                    <div key={group}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        {group}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {selected.map((a) => {
                          const Icon = amenityIcon(a.key);
                          return (
                            <div
                              key={a.key}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-background/40"
                            >
                              <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="text-xs font-medium truncate">{a.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                // Edit mode — every option as a toggleable chip.
                return (
                  <div key={group}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      {group}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {groupItems.map((a) => {
                        const Icon = amenityIcon(a.key);
                        const checked = editAmenities.has(a.key);
                        return (
                          <button
                            key={a.key}
                            type="button"
                            aria-pressed={checked}
                            onClick={() => setEditAmenities((prev) => {
                              const next = new Set(prev);
                              if (next.has(a.key)) next.delete(a.key); else next.add(a.key);
                              return next;
                            })}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all",
                              checked
                                ? "border-primary/60 bg-primary/10 text-foreground"
                                : "border-border/50 hover:border-border bg-background/40 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <Icon className={cn("h-3.5 w-3.5 shrink-0", checked && "text-primary")} />
                            <span className="text-xs font-medium truncate">{a.label}</span>
                            {checked && <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {!isEditing && salon.amenities.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No amenities listed yet. Click <span className="font-semibold not-italic">Edit profile</span> at the top to add them.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ────────────────────────────────────────────────────────────────
              From here on, every section saves itself (it has its own Save
              button / per-row controls), so they're grouped at the end and
              are NOT gated by the page-level Edit button.
              ──────────────────────────────────────────────────────────── */}

          {/* ─── Service location — shared editor (search, click-to-pin,
              draggable marker, auto-detect on first mount). Self-saves;
              writes the text address to the business profile and lat/lng
              to the primary salon_locations row in one call. ─── */}
          <ServiceLocationCard
            initialValue={locationInitialValue}
            isSaving={isLocationSaving}
            onSave={handleSaveLocation}
            title="Salon location"
          />

          {/* ─── Opening hours — shared editor (self-saves on per-day
              changes). ─── */}
          <WorkingHoursEditor
            onSaved={(msg) => toast.success(msg)}
            onError={(msg) => toast.error(msg)}
          />

          {/* Services & Pricing Manager */}
          <Card className="border-border/40">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">Services & Pricing</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {activeEditServices.length} active
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Avg ₹{avgPrice.toLocaleString("en-IN")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tweak pricing, trending + featured flags here. New services are added on the full catalog page.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs rounded-lg"
                  onClick={() => navigate("/services")}
                >
                  Manage all
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs rounded-lg"
                  onClick={() => navigate(`/services?action=add-service&from=${encodeURIComponent("/portfolio?tab=edit")}`)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeEditServices.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-8 text-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary mb-3">
                    <Tag className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No services yet</p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Customers can't book until you list at least one service with a price and duration.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 h-9 gap-1.5 rounded-xl"
                    onClick={() => navigate(`/services?action=add-service&from=${encodeURIComponent("/portfolio?tab=edit")}`)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add your first service
                  </Button>
                </div>
              )}

              {activeEditServices.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search services..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="pl-9 h-9 rounded-xl text-xs"
                    />
                  </div>
                  <Select value={serviceCategoryFilter} onValueChange={setServiceCategoryFilter}>
                    <SelectTrigger className="h-9 rounded-xl text-xs w-24">
                      <SelectValue placeholder="All..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {Array.from(new Set(mockServices.map((s) => s.category ?? "Other"))).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {Object.entries(editServicesByCategory).map(([category, services]) => (
                <div key={category}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {category} ({services.length})
                  </p>
                  <div className="space-y-1.5">
                    {services.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                          editingServiceId === s.id ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-border"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{s.name}</p>
                            {s.trending && (
                              <Badge className="bg-destructive/15 text-destructive text-[8px] border-0 h-4 px-1.5">
                                <TrendingUp className="h-2 w-2 mr-0.5" /> TREND
                              </Badge>
                            )}
                            {s.featured && (
                              <Badge className="bg-success/15 text-success text-[8px] border-0 h-4 px-1.5">
                                <Sparkles className="h-2 w-2 mr-0.5" /> FEAT
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {s.duration_minutes}min
                          </p>
                        </div>
                        <p className="text-sm font-bold font-serif shrink-0">₹{s.price.toLocaleString("en-IN")}</p>

                        {/* Featured — always visible per row. One tap marks
                            the service as Featured on the public profile.
                            Trending is intentionally NOT a vendor toggle:
                            it's computed server-side from rolling booking
                            volume so customers see real signal, not manual
                            self-promotion. */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Switch
                            checked={s.featured || false}
                            disabled={updateService.isPending}
                            onCheckedChange={() => toggleServiceFeatured(s)}
                            aria-label={s.featured ? "Remove from Featured" : "Mark as Featured"}
                          />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Feat
                          </span>
                        </div>

                        {editingServiceId === s.id ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingServiceId(null)} title="Done">
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEditService(s.id)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingServiceId(s.id)} title="Edit service">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Retail Products Manager */}
          <Card className="border-border/40">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">Retail Products</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {activeProducts.length} active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hair-care, beauty, accessories — anything you stock for walk-ins or online orders.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs rounded-lg"
                  onClick={() => navigate("/services")}
                >
                  Manage all
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs rounded-lg"
                  onClick={() => navigate(`/services?action=add-product&from=${encodeURIComponent("/portfolio?tab=edit")}`)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-8 text-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary mb-3">
                    <Package className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No products yet</p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    List retail products so customers can see what's available at your outlet.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 h-9 gap-1.5 rounded-xl"
                    onClick={() => navigate(`/services?action=add-product&from=${encodeURIComponent("/portfolio?tab=edit")}`)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add your first product
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeProducts.slice(0, 6).map((p) => {
                    const price = Number(p.price ?? 0);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => navigate("/services")}
                        className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 text-left transition-colors hover:border-primary/50"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                          {p.category && (
                            <p className="text-[11px] text-muted-foreground">{p.category}</p>
                          )}
                        </div>
                        <p className="shrink-0 font-serif text-sm font-bold">
                          ₹{price.toLocaleString("en-IN")}
                        </p>
                      </button>
                    );
                  })}
                  {activeProducts.length > 6 && (
                    <button
                      type="button"
                      onClick={() => navigate("/services")}
                      className="col-span-1 sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 bg-muted/10 p-3 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    >
                      View all {activeProducts.length} products →
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>

      {/* Service Detail Sheet — receives service-filtered slices of the
          vendor's gallery + reviews so the Gallery / Reviews tabs render
          real backend data instead of empty states. */}
      <ServiceDetailSheet
        service={detailService}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isInCart={detailService ? selectedServices.has(detailService.id) : false}
        onToggleCart={toggleService}
        galleryImages={
          detailService
            ? vendorGallery
                .filter((m) => m.service_id === detailService.id)
                .map((m) => ({ url: m.url, label: m.caption ?? m.service_name ?? null }))
            : []
        }
        serviceReviews={
          detailService
            ? reviews.filter((r: any) =>
                Array.isArray(r.service_ids)
                  ? r.service_ids.includes(detailService.id)
                  : r.service_id === detailService.id,
              )
            : []
        }
        bookingCount={
          detailService
            ? Number(
                (servicesData.find((s: any) => s.id === detailService.id) as any)
                  ?.booking_count ?? 0,
              )
            : 0
        }
      />

      <BookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        // Slot lookup expects the same vendor_id the service rows are
        // anchored to — the business_account id (`salonData.id`), not the
        // primary location id. The fallback covers callers that haven't
        // separated the two yet.
        vendorId={salonData?.id ?? salonData?.primary_location_id}
        vendorType="salon_location"
        services={vendorServices
          .filter((s) => s.is_active !== false)
          .map((s) => ({
            id: s.id,
            name: s.name,
            duration_minutes: s.duration_minutes,
            price: s.price,
            description: s.description,
            category: s.category,
          }))}
        preselectedServiceIds={Array.from(selectedServices)}
        isPreview
      />

      <UploadMediaDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        services={uploadServices}
        usageByService={usageByService}
      />

      {/* Sticky bottom Save / Cancel bar — visible only while editing.
          Reserve viewport space so the in-page content isn't hidden behind
          the bar's ~72px height. */}
      {isEditing && <div aria-hidden className="h-20" />}
      <EditModeBar
        isEditing={isEditing}
        isSaving={editMode.isSaving}
        isDirty={dirtyFields.length > 0}
        hasErrors={hasInlineErrors}
        dirtyCount={dirtyFields.length}
        label="Editing outlet profile"
        onSave={editMode.save}
        onCancel={editMode.cancel}
      />

      {/* In-app navigation guard — pops when the user clicks a sidebar
          link or otherwise tries to leave with unsaved changes. */}
      <NavigationGuardDialog
        open={blocker.state === "blocked"}
        dirtyCount={dirtyFields.length}
        isSaving={editMode.isSaving}
        hasErrors={hasInlineErrors}
        onSaveAndContinue={handleNavGuardSaveAndContinue}
        onDiscard={handleNavGuardDiscard}
        onStay={handleNavGuardStay}
      />
    </div>
  );
}
