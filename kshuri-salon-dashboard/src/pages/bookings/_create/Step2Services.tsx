// ─────────────────────────────────────────────────────────────────────────────
// Step2Services — multi-select list of the salon's active services. Renders a
// loading skeleton while the catalog query is in-flight and a friendly empty
// state when the salon hasn't published any services yet.
// ─────────────────────────────────────────────────────────────────────────────
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { VendorService } from "@kshuri/api-client/types";
import type { CreateBookingForm } from "./useCreateBookingForm";

interface Props {
  form: CreateBookingForm;
  services: VendorService[];
  isLoading: boolean;
}

export function Step2Services({ form, services, isLoading }: Props) {
  const { state, derived, actions } = form;
  const activeServices = services.filter((s) => s.is_active !== false);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[12px] font-semibold mb-1.5 block">Select Services *</label>
        <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
          {isLoading && activeServices.length === 0 ? (
            <ServiceListSkeleton />
          ) : activeServices.length === 0 ? (
            <EmptyServices />
          ) : (
            activeServices.map((s) => {
              const isSelected = state.selectedServiceIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2.5 text-sm cursor-pointer p-2.5 rounded-xl transition-colors border",
                    isSelected
                      ? "bg-primary/5 border-primary/20"
                      : "border-transparent hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => actions.toggleService(s.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium block truncate">{s.name}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                      {s.category?.name && (
                        <>
                          <span className="truncate">{s.category.name}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{s.duration_minutes ?? 0}min</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold shrink-0 tabular-nums">
                    ₹{Number(s.default_price ?? 0).toLocaleString("en-IN")}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {derived.selectedServices.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/15">
          <span className="text-xs">
            <span className="font-semibold">{derived.selectedServices.length}</span> service
            {derived.selectedServices.length === 1 ? "" : "s"} ·{" "}
            <span className="font-semibold">{derived.totalDuration}</span> min
          </span>
          <span className="font-serif font-bold text-primary tabular-nums">
            ₹{derived.totalAmount.toLocaleString("en-IN")}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 h-11 rounded-xl"
          onClick={actions.goBack}
        >
          Back
        </Button>
        <Button
          className="flex-1 h-11 rounded-xl"
          disabled={!derived.isStepValid[2]}
          onClick={actions.goNext}
        >
          Continue <ArrowUpRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function ServiceListSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </>
  );
}

function EmptyServices() {
  return (
    <div className="text-center p-8 rounded-xl bg-muted/20 border border-border/25">
      <div className="h-10 w-10 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-[12px] font-semibold mb-1">No services yet</p>
      <p className="text-[11px] text-muted-foreground">
        Add services from the Salon → Services page first.
      </p>
    </div>
  );
}

