// ─────────────────────────────────────────────────────────────────────────────
// ServiceStatsCards — three compact KPI cards (Total / Active / Avg Price).
// Computed from the already-normalised CatalogService list so callers don't
// duplicate the math.
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle2, IndianRupee, Package } from "lucide-react";
import { Card, CardContent } from "../card";
import { StaggerContainer, StaggerItem } from "../motion";
import { cn } from "../../lib/utils";
import type { CatalogService } from "./types";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}

function StatCard({ icon, label, value, tone }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-border/40 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ServiceStatsCardsProps {
  services: CatalogService[];
}

export function ServiceStatsCards({ services }: ServiceStatsCardsProps) {
  const total = services.length;
  const active = services.filter((s) => s.status === "active").length;
  const avgPrice = total > 0
    ? Math.round(services.reduce((sum, s) => sum + s.price, 0) / total)
    : 0;

  return (
    <StaggerContainer>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StaggerItem>
          <StatCard
            icon={<Package className="h-4 w-4 text-primary" />}
            label="Total Services"
            value={String(total)}
            tone="bg-primary/10"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            label="Active"
            value={String(active)}
            tone="bg-emerald-500/10"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={<IndianRupee className="h-4 w-4 text-amber-400" />}
            label="Avg Price"
            value={`₹${avgPrice.toLocaleString()}`}
            tone="bg-amber-500/10"
          />
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}
