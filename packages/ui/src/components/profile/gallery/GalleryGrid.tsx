// ─────────────────────────────────────────────────────────────────────────────
// GalleryGrid — chip filter row + responsive card grid for one gallery feed.
// State-light: keeps only the currently-selected category chip locally; the
// item list and primary action come from the parent so the same component can
// power Services today and Products tomorrow.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "../../button";
import { cn } from "../../../lib/utils";

import GalleryCard from "./GalleryCard";
import GalleryLightbox from "./GalleryLightbox";
import type { GalleryItem } from "./types";

const ALL = "__all__";

interface GalleryGridProps {
  items: GalleryItem[];
  /** Empty-state copy shown when items.length === 0 */
  emptyTitle: string;
  emptyHint?: string;
  /** Optional CTA from the lightbox; omit to render an info-only modal */
  onPrimaryAction?: (item: GalleryItem) => void;
  primaryActionLabel?: string;
}

export default function GalleryGrid({
  items,
  emptyTitle,
  emptyHint,
  onPrimaryAction,
  primaryActionLabel,
}: GalleryGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  // Distinct category names present in the feed — drives the chip row
  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const it of items) {
      if (it.subject.categoryName) seen.add(it.subject.categoryName);
    }
    return Array.from(seen).sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (selectedCategory === ALL) return items;
    return items.filter((it) => it.subject.categoryName === selectedCategory);
  }, [items, selectedCategory]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Camera className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">{emptyTitle}</p>
        {emptyHint && <p className="text-xs mt-1 opacity-70">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Button
            variant={selectedCategory === ALL ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs h-8 rounded-lg px-4 shrink-0",
              selectedCategory !== ALL && "text-muted-foreground",
            )}
            onClick={() => setSelectedCategory(ALL)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              className={cn(
                "text-xs h-8 rounded-lg px-4 shrink-0",
                selectedCategory !== cat && "text-muted-foreground",
              )}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Camera className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-xs">No photos in this category yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <GalleryCard key={item.id} item={item} onClick={setActiveItem} />
          ))}
        </div>
      )}

      <GalleryLightbox
        item={activeItem}
        open={!!activeItem}
        onOpenChange={(v) => !v && setActiveItem(null)}
        onPrimaryAction={onPrimaryAction
          ? (it) => { onPrimaryAction(it); setActiveItem(null); }
          : undefined}
        primaryActionLabel={primaryActionLabel}
      />
    </div>
  );
}
