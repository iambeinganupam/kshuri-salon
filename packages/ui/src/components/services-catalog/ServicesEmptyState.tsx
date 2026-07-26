// ─────────────────────────────────────────────────────────────────────────────
// ServicesEmptyState — friendly placeholder for the catalog list. Two modes:
//   • `hasAny=false` → first-run nudge with a primary "Add" CTA
//   • `hasAny=true`  → "no results match" hint (filters too narrow)
// ─────────────────────────────────────────────────────────────────────────────

import { Plus, Sparkles } from "lucide-react";
import { Card, CardContent } from "../card";
import { Button } from "../button";

interface ServicesEmptyStateProps {
  hasAny: boolean;
  onAdd: () => void;
}

export function ServicesEmptyState({ hasAny, onAdd }: ServicesEmptyStateProps) {
  return (
    <Card className="rounded-2xl border-dashed border-border/40">
      <CardContent className="flex flex-col items-center justify-center py-14 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-serif text-lg font-bold">
          {hasAny ? "No services match your filters" : "No services yet"}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {hasAny
            ? "Try clearing the search or audience filter."
            : "Add the services you offer so customers can find and book them."}
        </p>
        {!hasAny && (
          <Button onClick={onAdd} className="mt-4 rounded-xl font-semibold">
            <Plus className="mr-1.5 h-4 w-4" /> Add your first service
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
