// ─────────────────────────────────────────────────────────────────────────────
// ServiceDetailSheet — slide-out detail sheet for a single service.
// Tabs: About / Gallery / Reviews. CTA toggles "Add to Booking" / "Added".
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
import { Badge } from "../badge";
import { Button } from "../button";
import { Card, CardContent } from "../card";
import {
  Star, Clock, CalendarDays, Info, Image as ImageIcon, MessageSquare,
  TrendingUp, Sparkles, Check, Plus, ThumbsUp, ChevronRight,
} from "lucide-react";
import type { VendorService, VendorReviewItem } from "./types";

interface ServiceDetailSheetProps {
  service: VendorService | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /**
   * Customer-facing CTA state. Ignored when `footer` is supplied (admin /
   * management contexts can render their own footer e.g. Edit / Delete).
   */
  isInCart?: boolean;
  onToggleCart?: (id: string) => void;
  /**
   * Optional service-specific reviews. Defaults to an empty list — the
   * sheet renders a friendly empty state.
   */
  serviceReviews?: VendorReviewItem[];
  /**
   * Service-linked gallery items. The shared profile components don't fetch
   * data — the consuming page must filter the vendor's media feed by
   * `service_id` and pipe the results in here.
   */
  galleryImages?: Array<{
    /** Public image URL. Required — falls back to a placeholder if missing. */
    url?: string | null;
    /** Caption / alt text. Defaults to "Work" if absent. */
    label?: string | null;
    /** Optional pill rendered top-left (e.g. "before" / "after"). */
    type?: "before" | "after";
  }>;
  /** Lifetime booking count, surfaced in the quick-stats row. */
  bookingCount?: number | null;
  /**
   * Replaces the default "Add to Booking" CTA. Useful for management
   * contexts (e.g. the Categories page renders Edit / Delete here).
   * When supplied, `isInCart` / `onToggleCart` are ignored.
   */
  footer?: ReactNode;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.floor(rating) ? "fill-accent text-accent" : "text-muted/40"
          }`}
        />
      ))}
    </div>
  );
}

export default function ServiceDetailSheet({
  service,
  open,
  onOpenChange,
  isInCart = false,
  onToggleCart,
  serviceReviews = [],
  galleryImages = [],
  bookingCount = null,
  footer,
}: ServiceDetailSheetProps) {
  const [tab, setTab] = useState("about");

  if (!service) return null;

  const avgRating =
    serviceReviews.length > 0
      ? serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length
      : 0;

  // Vendor-authored bullet list. Empty array → section is hidden so we
  // never show stub copy.
  const whatsIncluded = service.inclusions ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden">
        {/* Hero */}
        <div className="p-6 pb-4 bg-gradient-to-b from-primary/10 to-transparent text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-xl font-bold font-serif">{service.name}</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center gap-2 mt-2">
            {service.trending && (
              <Badge className="bg-destructive/15 text-destructive text-[10px] gap-1 border-0">
                <TrendingUp className="h-3 w-3" /> Trending
              </Badge>
            )}
            {service.category && (
              <Badge variant="secondary" className="text-[10px]">{service.category}</Badge>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 px-6 pb-4">
          {[
            { icon: "₹", label: "Price", value: service.price.toLocaleString("en-IN") },
            { icon: Clock, label: "Minutes", value: service.duration_minutes ?? "—" },
            { icon: CalendarDays, label: "Bookings", value: bookingCount ?? 0 },
          ].map((stat, i) => (
            <div key={i} className="text-center p-2.5 rounded-xl bg-muted/40">
              <p className="text-xl font-bold font-serif">
                {typeof stat.icon === "string" ? `${stat.icon} ` : ""}
                {stat.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 bg-muted/50 h-9 rounded-lg">
            <TabsTrigger value="about" className="text-xs gap-1 rounded-md">
              <Info className="h-3.5 w-3.5" /> About
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs gap-1 rounded-md">
              <ImageIcon className="h-3.5 w-3.5" /> Gallery ({galleryImages.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs gap-1 rounded-md">
              <MessageSquare className="h-3.5 w-3.5" /> Reviews ({serviceReviews.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* About */}
            <TabsContent value="about" className="mt-0 space-y-5">
              <div>
                <h4 className="text-sm font-bold mb-1.5">Service Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description ?? "No description provided."}
                </p>
              </div>

              {whatsIncluded.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold mb-2">What's Included</h4>
                  <ul className="space-y-2">
                    {whatsIncluded.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold mb-2">Pricing</h4>
                <Card className="border-border/40">
                  <CardContent className="p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base service charge</span>
                      <span className="font-medium">₹{service.price.toLocaleString("en-IN")}</span>
                    </div>
                    <hr className="border-border/40" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{service.price.toLocaleString("en-IN")}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Gallery — service-linked photos. Renders real images from
                `galleryImages[].url`, falling back to a tasteful placeholder
                whenever the URL is missing. */}
            <TabsContent value="gallery" className="mt-0">
              {galleryImages.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No gallery photos for this service yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {galleryImages.map((img, i) => {
                    const label = img.label?.trim() ?? "";
                    return (
                      <div
                        key={i}
                        className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-b from-muted/30 to-muted/60"
                      >
                        {img.url ? (
                          <img
                            src={img.url}
                            alt={label || "Service photo"}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}
                        {img.type && (
                          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] z-10 capitalize">
                            {img.type}
                          </Badge>
                        )}
                        {label && (
                          <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            <p className="text-xs font-semibold text-card line-clamp-2">{label}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="mt-0 space-y-4">
              {serviceReviews.length > 0 ? (
                <>
                  <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold font-serif">{avgRating.toFixed(1)}</p>
                        <StarDisplay rating={avgRating} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {serviceReviews.length} review{serviceReviews.length > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">for {service.name}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {serviceReviews.map((review) => (
                    <Card key={review.id} className="border-border/40">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {review.author_name[0]?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{review.author_name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <StarDisplay rating={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                        <button className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors">
                          <ThumbsUp className="h-3 w-3" /> Helpful
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No reviews yet for this service.
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer — defaults to the customer-facing "Add to Booking" CTA;
            management contexts pass `footer={...}` to render their own
            actions (Edit / Delete, etc.). */}
        <div className="p-4 border-t border-border/40">
          {footer ?? (
            <Button
              className={`w-full h-12 rounded-xl font-semibold text-sm gap-2 ${
                isInCart
                  ? "bg-success hover:bg-success/90 text-success-foreground"
                  : ""
              }`}
              onClick={() => onToggleCart?.(service.id)}
              disabled={!onToggleCart}
            >
              {isInCart ? (
                <>
                  <Check className="h-4 w-4" /> Added to Booking · ₹{service.price.toLocaleString("en-IN")}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add to Booking · ₹{service.price.toLocaleString("en-IN")}
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
