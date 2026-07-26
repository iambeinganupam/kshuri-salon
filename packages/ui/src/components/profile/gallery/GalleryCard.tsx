// ─────────────────────────────────────────────────────────────────────────────
// GalleryCard — single tile in the public gallery grid.
// Always-visible caption + subject name; click opens the lightbox.
// ─────────────────────────────────────────────────────────────────────────────

import { Camera } from "lucide-react";
import { Badge } from "../../badge";
import type { GalleryItem } from "./types";

interface GalleryCardProps {
  item: GalleryItem;
  onClick: (item: GalleryItem) => void;
}

export default function GalleryCard({ item, onClick }: GalleryCardProps) {
  const hasImage = Boolean(item.url);
  const headline = item.caption?.trim() || item.subject.name;
  const showSecondary = !!item.caption?.trim() && item.caption.trim() !== item.subject.name;

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="group relative aspect-[4/5] rounded-xl overflow-hidden text-left bg-gradient-to-b from-muted/20 to-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background transition-shadow hover:shadow-lg"
      aria-label={`Open ${item.subject.name}`}
    >
      {hasImage ? (
        <img
          src={item.url}
          alt={headline}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}

      {/* Category badge — top-left */}
      {item.subject.categoryName && (
        <Badge className="absolute top-2.5 left-2.5 bg-card/80 text-foreground border-0 text-[10px] backdrop-blur-md px-2 py-0.5">
          {item.subject.categoryName}
        </Badge>
      )}

      {/* Caption overlay — always visible, gradient bottom */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <p className="text-card text-sm font-semibold leading-tight line-clamp-2">
          {headline}
        </p>
        {showSecondary && (
          <p className="text-card/80 text-[11px] mt-0.5 line-clamp-1">
            {item.subject.name}
          </p>
        )}
      </div>
    </button>
  );
}
