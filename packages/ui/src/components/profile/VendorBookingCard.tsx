// ─────────────────────────────────────────────────────────────────────────────
// VendorBookingCard — sticky right-rail "Starting from / Book Appointment"
// card on desktop. Switches to "cart mode" when the customer has selected
// services from the Services tab.
// ─────────────────────────────────────────────────────────────────────────────

import { Card, CardContent } from "../card";
import { Button } from "../button";
import {
  CalendarDays, Shield,
  Heart, X, Clock, ShoppingBag,
} from "lucide-react";
import { FadeIn } from "../motion";
import type { VendorProfile, VendorService } from "./types";

interface VendorBookingCardProps {
  vendor: VendorProfile;
  selectedServices: Set<string>;
  allServices: VendorService[];
  onRemoveService: (id: string) => void;
  onBrowseServices: () => void;
  onBookAppointment: () => void;
  onCheckAvailability: () => void;
}

export default function VendorBookingCard({
  vendor,
  selectedServices,
  allServices,
  onRemoveService,
  onBookAppointment,
  onCheckAvailability,
}: VendorBookingCardProps) {
  const cartItems = allServices.filter((s) => selectedServices.has(s.id));
  const totalPrice = cartItems.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = cartItems.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const hasCart = cartItems.length > 0;

  // Compute price range from active services (override the snapshot on the
  // VendorProfile if we have fresher service-level data).
  const activePrices = allServices
    .filter((s) => s.is_active !== false && s.price != null)
    .map((s) => s.price);
  const priceMin = activePrices.length > 0 ? Math.min(...activePrices) : vendor.price_min ?? null;
  const priceMax = activePrices.length > 0 ? Math.max(...activePrices) : vendor.price_max ?? null;
  const priceLabel =
    priceMin != null && priceMax != null
      ? priceMin === priceMax
        ? `₹${priceMin.toLocaleString("en-IN")}`
        : `₹${priceMin.toLocaleString("en-IN")} – ₹${priceMax.toLocaleString("en-IN")}`
      : "—";

  return (
    <div className="hidden lg:block">
      <div className="sticky top-20 space-y-3">
        <FadeIn delay={0.15}>
          <Card className="border-border/60 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
              <div className="p-6">
                {hasCart ? (
                  /* ── Cart Mode ── */
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Your Booking
                    </p>
                    <div className="space-y-2 mb-4">
                      {cartItems.map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {s.duration_minutes ?? "—"} min
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold font-serif">₹{s.price.toLocaleString("en-IN")}</span>
                            <button
                              onClick={() => onRemoveService(s.id)}
                              className="h-6 w-6 rounded-full bg-muted/60 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <hr className="border-border/40 mb-3" />

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-xl font-bold font-serif">₹{totalPrice.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Est. duration
                      </span>
                      <span className="text-xs text-muted-foreground">{totalDuration} min</span>
                    </div>

                    <Button
                      className="w-full h-12 font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-shadow gap-2"
                      onClick={onBookAppointment}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Book {cartItems.length} Service{cartItems.length > 1 ? "s" : ""}
                    </Button>
                  </>
                ) : (
                  /* ── Empty / Default Mode ── */
                  <>
                    {vendor.hourly_rate ? (
                      <>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Hourly Rate
                        </p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-2xl font-bold font-serif">
                            ₹{vendor.hourly_rate.toLocaleString("en-IN")}
                          </p>
                          <span className="text-sm text-muted-foreground">/hr</span>
                        </div>
                        {priceMin != null ? (
                          <p className="text-xs text-muted-foreground mb-3">
                            or services from ₹{priceMin.toLocaleString("en-IN")}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mb-3">per hour</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          {priceMin != null ? "Starting From" : "Services"}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold font-serif">{priceLabel}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">per service</p>
                      </>
                    )}

                    {vendor.is_open_now != null && (
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${vendor.is_open_now ? "bg-success" : "bg-muted-foreground"}`} />
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${vendor.is_open_now ? "bg-success" : "bg-muted-foreground"}`} />
                        </span>
                        <span className={`text-sm font-medium ${vendor.is_open_now ? "text-success" : "text-muted-foreground"}`}>
                          {vendor.is_open_now ? "Available for booking" : "Currently closed"}
                        </span>
                      </div>
                    )}

                    <Button
                      className="w-full h-12 font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-shadow"
                      onClick={onBookAppointment}
                    >
                      Book Appointment
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full mt-2.5 h-11 gap-2 text-sm rounded-xl"
                      onClick={onCheckAvailability}
                    >
                      <CalendarDays className="h-4 w-4" /> Check Availability
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-3 mb-3">
                      Add services using the + button to build your booking
                    </p>

                    {/* Call/Chat removed — direct vendor contact stays inside the
                        Kshuri booking + messaging flows. Customers can't reach
                        the vendor's phone until a booking is mutually confirmed. */}
                    {/* Share lives in VendorHeader (next to vendor name) — one
                        canonical Share affordance per page, like Yelp / Airbnb /
                        Google Maps. The booking sidebar keeps only Save so the
                        action set stays focused on the booking intent. */}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg h-9 w-full">
                      <Heart className="h-3.5 w-3.5" /> Save
                    </Button>
                  </>
                )}

                {/* Trust badge */}
                <div className="mt-4 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                    <Shield className="h-4 w-4" /> Kshuri Protected Booking
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    All bookings are managed through Kshuri with secure payments and quality assurance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center mt-3">
            <button className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
              Report this listing
            </button>
          </p>
        </FadeIn>
      </div>
    </div>
  );
}
