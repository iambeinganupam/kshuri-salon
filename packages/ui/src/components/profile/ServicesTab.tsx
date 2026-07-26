// ─────────────────────────────────────────────────────────────────────────────
// ServicesTab — public-preview Services sub-tab.
//
// Lists active services grouped by category, with tap-to-add toggle and
// a click handler for "open detail sheet" behaviour.
// ─────────────────────────────────────────────────────────────────────────────

import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import { Clock, Sparkles, Plus, Check, TrendingUp } from "lucide-react";
import { FadeIn } from "../motion";
import type { VendorService } from "./types";

interface ServicesTabProps {
  services: VendorService[];
  selectedServices: Set<string>;
  onToggleService: (id: string) => void;
  onServiceClick: (service: VendorService) => void;
}

export default function ServicesTab({
  services,
  selectedServices,
  onToggleService,
  onServiceClick,
}: ServicesTabProps) {
  // Treat `is_active === false` as inactive; everything else (including
  // legacy rows that pre-date the flag) renders.
  const activeServices = services.filter((s) => s.is_active !== false);

  const byCategory = activeServices.reduce<Record<string, VendorService[]>>(
    (acc, s) => {
      const key = s.category ?? "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    },
    {},
  );

  return (
    <FadeIn>
      {Object.entries(byCategory).map(([category, catServices]) => (
        <div key={category} className="mb-7">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            {category}
          </h3>
          <div className="space-y-2">
            {catServices.map((service) => {
              const isSelected = selectedServices.has(service.id);
              return (
                <Card
                  key={service.id}
                  className={`border-border/40 transition-all cursor-pointer hover:shadow-sm ${
                    isSelected ? "ring-2 ring-primary/30 border-primary/40" : ""
                  }`}
                  onClick={() => onServiceClick(service)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                      <Sparkles className={`h-4 w-4 ${service.trending ? "text-destructive" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{service.name}</p>
                        {service.trending && (
                          <Badge className="bg-destructive/15 text-destructive text-[9px] gap-0.5 border-0 h-5">
                            <TrendingUp className="h-2.5 w-2.5" /> Trending
                          </Badge>
                        )}
                        {service.featured && (
                          <Badge className="bg-success/15 text-success text-[9px] gap-0.5 border-0 h-5">
                            <Sparkles className="h-2.5 w-2.5" /> Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {service.duration_minutes
                          ? `${service.duration_minutes} min`
                          : "Duration TBD"}
                        {service.description ? ` · ${service.description}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-base font-bold font-serif">
                        ₹{service.price.toLocaleString("en-IN")}
                      </p>
                      <button
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "border border-border hover:border-primary/50 text-muted-foreground hover:text-primary"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleService(service.id);
                        }}
                      >
                        {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </FadeIn>
  );
}
