// ─────────────────────────────────────────────────────────────────────────────
// VendorBanner — hero banner for the vendor's public profile.
//
// Renders the Airbnb-style 5-up mosaic when there are 3+ gallery thumbnails;
// falls back to a single hero image otherwise. Works for both salons
// (`vendor_type: "salon_location"`) and freelancers; the only vendor-specific
// chrome is the "Kshuri Verified" badge driven off `vendor.is_verified`.
// ─────────────────────────────────────────────────────────────────────────────

import { Badge } from "../badge";
import { Button } from "../button";
import { Shield, Share2, Heart, Camera } from "lucide-react";
import type { VendorProfile } from "./types";

interface VendorBannerProps {
  vendor: VendorProfile;
  /**
   * Owner-preview vs customer browsing context. When true, hides the back/save/share
   * floating chrome — there's nothing to navigate "back" to from the vendor's own
   * Portfolio page, and the owner can share their own profile from the page header.
   */
  ownerPreview?: boolean;
}

export default function VendorBanner({ vendor, ownerPreview = true }: VendorBannerProps) {
  const galleryThumbs = vendor.banner_gallery.slice(0, 4);
  const hasMosaic = galleryThumbs.length >= 3;
  const totalPhotos = (vendor.banner_url ? 1 : 0) + galleryThumbs.length;

  return (
    <div className="relative">
      {/* Desktop hero — Airbnb-style mosaic when gallery is rich, single hero
          otherwise. Avoids the "broken grid with empty cells" look on profiles
          with few uploaded photos. */}
      <div className="hidden md:block mx-4 lg:mx-8 mt-4">
        {hasMosaic ? (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
            {vendor.banner_url ? (
              <div className="col-span-2 row-span-2 relative group">
                <img
                  src={vendor.banner_url}
                  alt={vendor.display_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
              </div>
            ) : (
              <div className="col-span-2 row-span-2 bg-muted/30 flex items-center justify-center">
                <Camera className="h-10 w-10 text-muted-foreground/30" />
              </div>
            )}
            {galleryThumbs.map((img, i) => (
              <div key={i} className="relative group overflow-hidden">
                <img
                  src={img}
                  alt={`Gallery ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
              </div>
            ))}
            <button className="absolute bottom-4 right-4 bg-card text-foreground text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" /> Show all {totalPhotos} photos
            </button>
          </div>
        ) : (
          // Hero-only fallback — keeps the layout calm until the vendor has
          // enough portfolio variety to justify the 5-up mosaic.
          <div className="relative h-[320px] lg:h-[380px] rounded-2xl overflow-hidden">
            {vendor.banner_url ? (
              <img
                src={vendor.banner_url}
                alt={vendor.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted/40 to-muted/20 flex flex-col items-center justify-center gap-2">
                <Camera className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/70">Upload a banner to give your profile a hero image</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
          </div>
        )}
      </div>

      {/* Mobile Banner */}
      <div className="md:hidden relative h-64 overflow-hidden">
        {vendor.banner_url ? (
          <img
            src={vendor.banner_url}
            alt={vendor.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted/30 flex items-center justify-center">
            <Camera className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-transparent to-foreground/60" />
        {!ownerPreview && (
          <div className="absolute top-0 right-0 flex gap-2 p-4">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-card/70 backdrop-blur-md text-foreground hover:bg-card/90 shadow-sm">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-card/70 backdrop-blur-md text-foreground hover:bg-card/90 shadow-sm">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        )}
        {/* Bottom badges — only render when there's something to say */}
        {vendor.is_verified && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge className="bg-success/90 text-success-foreground text-[10px] gap-1 backdrop-blur-sm">
              <Shield className="h-3 w-3" /> Kshuri Verified
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
