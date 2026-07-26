// ─────────────────────────────────────────────────────────────────────────────
// ServiceCard — visual card surfaced on the catalog grid.
//
// Mirrors the public-preview look (gender accent stripe, category chips,
// price + duration row) so the management view stays consistent with how
// customers see the service. Inactive services dim and gain a "Hidden" pill.
// ─────────────────────────────────────────────────────────────────────────────

import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import { AlertCircle, Clock, Eye, EyeOff, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CatalogService } from "./types";

interface ServiceCardProps {
  service: CatalogService;
  onClick: () => void;
}

const GENDER_ACCENT: Record<CatalogService["gender"], string> = {
  female: "bg-pink-400",
  male: "bg-blue-400",
  unisex: "bg-purple-400",
};

const GENDER_BADGE: Record<CatalogService["gender"], string> = {
  female: "text-pink-400 border-pink-400/30",
  male: "text-blue-400 border-blue-400/30",
  unisex: "text-purple-400 border-purple-400/30",
};

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  const isInactive = service.status === "inactive";
  const isPending = service.status === "pending-review";

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden border-border/40 transition-all duration-300 hover:shadow-md",
        isInactive && "opacity-60",
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className={cn("h-1 w-full", GENDER_ACCENT[service.gender])} />
        <div className="p-4 lg:p-5">
          <div className="mb-2 flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <p className={cn("truncate text-sm font-semibold", isInactive && "line-through")}>
                  {service.name}
                </p>
                {isPending && (
                  <Badge variant="outline" className="shrink-0 border-amber-500/25 bg-amber-500/10 text-[9px] text-amber-400">
                    <AlertCircle className="mr-0.5 h-2.5 w-2.5" /> Review
                  </Badge>
                )}
                {isInactive && (
                  <Badge variant="outline" className="shrink-0 border-border/40 text-[9px] text-muted-foreground">
                    <EyeOff className="mr-0.5 h-2.5 w-2.5" /> Hidden
                  </Badge>
                )}
              </div>
              {service.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{service.description}</p>
              )}
            </div>
            <button
              className="rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              aria-label="View service"
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {service.category && (
              <Badge variant="secondary" className="text-[10px] font-normal">{service.category}</Badge>
            )}
            {service.subcategory && (
              <Badge variant="secondary" className="text-[10px] font-normal">{service.subcategory}</Badge>
            )}
            <Badge variant="outline" className={cn("text-[10px] font-normal capitalize", GENDER_BADGE[service.gender])}>
              {service.gender}
            </Badge>
            {service.inclusions.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Sparkles className="h-3 w-3" /> {service.inclusions.length} included
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{service.duration} min</span>
            </div>
            <p className="font-serif text-base font-bold text-primary tabular-nums">
              ₹{service.price.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
