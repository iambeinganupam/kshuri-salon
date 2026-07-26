// ─────────────────────────────────────────────────────────────────────────────
// PortfolioTab — public-preview Work Gallery sub-tab.
//
// Renders service-linked portfolio photos. Retail products render in a
// dedicated sub-tab above this one (salon-only) — they don't have photos
// in v1, so a Products gallery sub-tab would be dead UI.
// ─────────────────────────────────────────────────────────────────────────────

import { Image as ImageIcon } from "lucide-react";
import { Badge } from "../badge";

import GalleryGrid from "./gallery/GalleryGrid";
import type { GalleryItem } from "./gallery/types";

export interface PortfolioTabProps {
  /** Service-linked photos */
  serviceItems: GalleryItem[];
  /** Called when the customer hits "Book Appointment" from a service lightbox */
  onBookService?: (item: GalleryItem) => void;
}

export default function PortfolioTab({
  serviceItems,
  onBookService,
}: PortfolioTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold font-serif">Work Gallery</h3>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {serviceItems.length} {serviceItems.length === 1 ? "photo" : "photos"}
        </Badge>
      </div>

      <GalleryGrid
        items={serviceItems}
        emptyTitle="No service photos yet"
        emptyHint="Upload photos in the Manage Gallery tab and link them to a service"
        onPrimaryAction={onBookService}
        primaryActionLabel="Book Appointment"
      />
    </div>
  );
}
