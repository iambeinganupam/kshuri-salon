// ─────────────────────────────────────────────────────────────────────────────
// VendorHeader — name, tagline, rating row, contact + socials, category tags.
//
// Vendor-agnostic: works for `vendor_type === "salon_location"` and
// `vendor_type === "freelancer"`. The business-type label, today's open/close
// state, and category tags all come pre-shaped from the adapter — no
// per-vendor branching inside the component.
//
// Privacy: vendors' raw phone numbers are NEVER rendered here. All contact
// goes through the in-app booking + messaging flows. The `phone` field on
// `VendorProfile` remains in the type for internal/admin surfaces but the
// public preview must not surface it.
// ─────────────────────────────────────────────────────────────────────────────

import { Badge } from "../badge";
import { Button } from "../button";
import {
  Star, MapPin, Clock, Shield, Share2, Heart,
  Globe, Instagram, Youtube,
} from "lucide-react";
import { FadeIn } from "../motion";
import { useVendorShare } from "../../sharing/useVendorShare";
import type { VendorProfile } from "./types";

interface VendorHeaderProps {
  vendor: VendorProfile;
  /** Render in the vendor's own dashboard preview tab. Hides the inline
   *  Share + Save buttons because the dashboard's page header already owns
   *  those actions (avoids two Share buttons on the same screen). The
   *  customer-portal vendor profile leaves this false so the public-facing
   *  Share lives next to the vendor name, Yelp/Airbnb-style. */
  ownerPreview?: boolean;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function VendorHeader({ vendor, ownerPreview = false }: VendorHeaderProps) {
  const share = useVendorShare({
    slug: vendor.url_slug,
    vendorName: vendor.display_name,
  });
  const hasHours = vendor.today_open_time && vendor.today_close_time;
  const hoursLabel = hasHours
    ? `${vendor.is_open_now ? "Open" : "Closed"} · ${vendor.is_open_now ? "Closes" : "Opens"} ${formatTime(vendor.is_open_now ? vendor.today_close_time! : vendor.today_open_time!)}`
    : vendor.is_open_now != null
      ? vendor.is_open_now
        ? "Open now"
        : "Closed today"
      : null;

  const businessTypeLabel =
    vendor.business_type_label ??
    (vendor.vendor_type === "salon_location" ? "Salon & Spa" : "Independent Freelancer");

  return (
    <FadeIn>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Business type badge */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] border-border/60 uppercase tracking-wider font-sans font-medium">
              {businessTypeLabel}
            </Badge>
            {vendor.is_verified && (
              <Badge className="bg-success/10 text-success text-[10px] gap-1 border-0 font-sans">
                <Shield className="h-3 w-3" /> Kshuri Assured
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif leading-tight">
            {vendor.display_name}
          </h1>
          {vendor.tagline && (
            <p className="text-sm md:text-base text-muted-foreground italic mt-1.5">
              {vendor.tagline}
            </p>
          )}

          {/* Rating row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <span className="inline-flex items-center gap-0.5 bg-accent/15 text-accent-foreground px-2 py-0.5 rounded-md">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                <span className="font-bold">
                  {vendor.rating_avg && vendor.rating_avg > 0 ? vendor.rating_avg.toFixed(1) : "—"}
                </span>
              </span>
              <span className="text-muted-foreground">
                ({vendor.rating_count} review{vendor.rating_count !== 1 ? "s" : ""})
              </span>
            </span>
            {vendor.address_full && (
              <>
                <span className="hidden sm:inline text-border">·</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[260px]">{vendor.address_full}</span>
                </span>
              </>
            )}
          </div>

          {/* Quick stats — hours + social icons. The vendor's phone number is
              intentionally NOT rendered here; customers book/contact through
              the app. */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {hoursLabel && (
              <span className={`inline-flex items-center gap-1.5 text-xs bg-muted/50 px-2.5 py-1 rounded-full ${vendor.is_open_now ? "text-emerald-400" : "text-muted-foreground"}`}>
                <Clock className="h-3.5 w-3.5" />
                {hoursLabel}
              </span>
            )}

            {/* Social icons — only render the ones that exist. Compact icon-only
                buttons keep visual weight low while still being prominent. */}
            {(vendor.website_url || vendor.instagram_url || vendor.youtube_url) && (
              <div className="inline-flex items-center gap-1 ml-0.5">
                {vendor.website_url && (
                  <a
                    href={vendor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Website"
                    title="Visit website"
                    className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}
                {vendor.instagram_url && (
                  <a
                    href={vendor.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    title="Visit Instagram"
                    className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                  </a>
                )}
                {vendor.youtube_url && (
                  <a
                    href={vendor.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    title="Visit YouTube channel"
                    className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Youtube className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Category tags from real services */}
          {vendor.category_tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {vendor.category_tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] font-medium px-2.5 py-0.5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Desktop action buttons — hidden in dashboard owner-preview mode
            (the page header's "Share portfolio" CTA owns the share action
            there; the vendor doesn't need to favourite their own profile). */}
        {!ownerPreview && (
          <div className="hidden md:flex items-center gap-2 shrink-0 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs rounded-full transition-colors hover:bg-primary/5 hover:border-primary/40"
              onClick={share.onShare}
              disabled={!share.canShare}
              aria-label={share.canShare ? "Share this vendor" : (share.disabledReason ?? "Share unavailable")}
              title={share.canShare ? undefined : (share.disabledReason ?? undefined)}
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full">
              <Heart className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
