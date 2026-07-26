// ─────────────────────────────────────────────────────────────────────────────
// vendor-adapter — maps the salon dashboard's domain shapes into the
// vendor-agnostic shapes consumed by `@kshuri/ui` profile components.
//
// Two flavours are exposed:
//   • `salonApiToVendorProfile` — takes the raw API response from
//     `useBusinessProfile()` (snake_case, possibly partial) and returns a
//     `VendorProfile`. Use this in new code.
//   • `salonShapeToVendorProfile` — takes the camelCase `salon` object that
//     `PortfolioPage.tsx` currently builds inline. Used while the legacy
//     PortfolioPage is still alive; Phase 2 deletes it.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Certification,
  VendorMedia,
  VendorProfile,
  VendorService,
  WorkingHours,
} from "@kshuri/ui";

type Loose = Record<string, unknown>;

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const bool = (v: unknown): boolean => v === true;

/** Compose a single-line address string from the row's pieces. */
function composeAddress(salon: Loose): string | null {
  const parts = [
    salon.address_line1,
    salon.address_line2,
    salon.city,
    salon.state,
    salon.postal_code,
  ]
    .filter((p): p is string => typeof p === "string" && p.length > 0);
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Map the `useBusinessProfile()` response (which may be partial / `null`)
 * into a `VendorProfile`. Optional collateral (services, gallery, working
 * hours) is layered on after construction so callers can build the profile
 * once and decorate it with whatever is available.
 */
export function salonApiToVendorProfile(
  salon: Loose | null | undefined,
  opts: {
    services?: VendorService[];
    gallery?: VendorMedia[];
    workingHours?: WorkingHours[];
    rating?: { avg: number | null; count: number };
    engagement?: { view_count?: number; favorite_count?: number };
  } = {},
): VendorProfile {
  const today = new Date().getDay();
  const todayHours = (opts.workingHours ?? []).find((h) => h.day_of_week === today);
  const isOpenNow = todayHours ? !todayHours.is_closed : null;

  const activePrices = (opts.services ?? [])
    .filter((s) => s.is_active !== false && s.price != null)
    .map((s) => Number(s.price));
  const priceMin = activePrices.length > 0 ? Math.min(...activePrices) : null;
  const priceMax = activePrices.length > 0 ? Math.max(...activePrices) : null;

  const categoryTags = Array.from(
    new Set(
      (opts.services ?? [])
        .map((s) => s.category)
        .filter((c): c is string => typeof c === "string" && c.length > 0),
    ),
  );

  return {
    id: String(salon?.id ?? ""),
    vendor_type: "salon_location",
    url_slug: str(salon?.url_slug) ?? null,

    display_name:
      str(salon?.brand_name) ??
      str(salon?.display_name) ??
      str(salon?.legal_business_name) ??
      "My Outlet",
    tagline: str(salon?.tagline),
    description: str(salon?.description),
    primary_category: str(salon?.primary_category),

    rating_avg: opts.rating?.avg ?? num(salon?.avg_rating) ?? num(salon?.rating),
    rating_count: opts.rating?.count ?? Number(salon?.review_count ?? 0),
    view_count: opts.engagement?.view_count ?? Number(salon?.view_count ?? 0),
    favorite_count:
      opts.engagement?.favorite_count ?? Number(salon?.favorite_count ?? 0),

    banner_url:
      str(salon?.cover_image_url) ??
      str(salon?.cover_url) ??
      str(salon?.banner_image) ??
      str(salon?.banner_url),
    logo_url: str(salon?.logo_url),
    banner_gallery: (opts.gallery ?? [])
      .map((m) => m.url)
      .filter((u): u is string => typeof u === "string" && u.length > 0)
      .slice(0, 4),

    address_full: composeAddress(salon ?? {}),
    city: str(salon?.city),
    phone: str(salon?.contact_phone) ?? str(salon?.phone),
    website_url: str(salon?.website_url),
    instagram_url: str(salon?.instagram_url),
    youtube_url: str(salon?.youtube_url),

    is_verified: bool(salon?.kyc_verified),
    years_in_business: num(salon?.years_in_business),

    specializations: arr<string>(salon?.specializations),
    languages: arr<string>(salon?.languages),
    category_tags: categoryTags,
    amenity_keys: arr<string>(salon?.amenities),

    certifications: arr<Certification>(salon?.certifications),

    price_min: priceMin,
    price_max: priceMax,

    business_type_label:
      str(salon?.business_type) ?? "Salon & Spa",

    is_open_now: isOpenNow,
    today_open_time: todayHours?.open_time ?? null,
    today_close_time: todayHours?.close_time ?? null,
  };
}

/**
 * Convert the camelCase `salon` object built inline in
 * `PortfolioPage.tsx:132` into a `VendorProfile`. Temporary bridge — kept
 * only while the legacy PortfolioPage is still around.
 */
export function salonShapeToVendorProfile(salon: Loose): VendorProfile {
  return salonApiToVendorProfile({
    id: salon.id,
    brand_name: salon.name,
    cover_image_url: salon.bannerImage,
    logo_url: salon.logo,
    address_line1: salon.addressLine1,
    address_line2: salon.addressLine2,
    city: salon.city,
    state: salon.state,
    postal_code: salon.postalCode,
    contact_phone: salon.phone,
    contact_email: salon.email,
    avg_rating: salon.rating,
    review_count: salon.reviewCount,
    kyc_verified: salon.isKshuriAssured,
    description: salon.description,
    tagline: salon.tagline,
    specializations: salon.specializations,
    languages: salon.languages,
    website_url: salon.websiteUrl,
    instagram_url: salon.instagramUrl,
    youtube_url: salon.youtubeUrl,
    years_in_business: salon.yearsInBusiness,
    certifications: salon.certifications,
    amenities: salon.amenities,
    business_type: salon.businessType,
  });
}

/**
 * Map raw API service rows into `VendorService[]`. Salon services use
 * `default_price` historically; freelancers use `price`.
 */
export function salonServicesToVendorServices(rows: unknown[]): VendorService[] {
  return arr<Loose>(rows).map((r) => ({
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    description: str(r.description),
    price: Number(r.default_price ?? r.price ?? 0),
    duration_minutes:
      typeof r.duration_minutes === "number"
        ? r.duration_minutes
        : typeof r.duration === "number"
          ? r.duration
          : null,
    category: str(r.category),
    is_active: r.is_active !== false,
    trending: bool(r.trending) || bool(r.is_trending),
    featured: bool(r.featured) || bool(r.is_featured),
    inclusions: Array.isArray(r.inclusions)
      ? (r.inclusions as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
  }));
}

/** Map raw media rows (or paginated `{ items }`) into `VendorMedia[]`. */
export function salonMediaToVendorMedia(raw: unknown): VendorMedia[] {
  const list: Loose[] = Array.isArray(raw)
    ? (raw as Loose[])
    : Array.isArray((raw as Loose | null)?.items)
      ? ((raw as Loose).items as Loose[])
      : [];

  return list.map((m) => ({
    id: String(m.id ?? ""),
    url: String(m.url ?? m.media_url ?? ""),
    caption: str(m.caption),
    service_id: str(m.service_id),
    service_name: str(m.service_name),
    service_category: str(m.service_category) ?? str(m.category),
  }));
}
