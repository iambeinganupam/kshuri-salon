// ─────────────────────────────────────────────────────────────────────────────
// GalleryLightbox — modal preview for a single gallery item.
// Shows the full image, caption, subject details and a primary CTA
// (Book Appointment for services, Inquire for products in a later phase).
// ─────────────────────────────────────────────────────────────────────────────

import { Calendar, Clock, Tag, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../dialog";
import { Badge } from "../../badge";
import { Button } from "../../button";
import type { GalleryItem } from "./types";

interface GalleryLightboxProps {
  item: GalleryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Primary CTA — for services this should open the booking flow */
  onPrimaryAction?: (item: GalleryItem) => void;
  /** Override the CTA label (defaults: "Book Appointment" / "Inquire") */
  primaryActionLabel?: string;
}

const formatPrice = (price: number | null) =>
  price == null ? null : `₹${Number(price).toLocaleString("en-IN")}`;

export default function GalleryLightbox({
  item,
  open,
  onOpenChange,
  onPrimaryAction,
  primaryActionLabel,
}: GalleryLightboxProps) {
  if (!item) return null;

  const isService = item.subject.kind === "service";
  const ctaLabel = primaryActionLabel ?? (isService ? "Book Appointment" : "Inquire");
  const priceLabel = formatPrice(item.subject.price);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0">
        <div className="grid md:grid-cols-[1.2fr_1fr]">
          {/* Image pane */}
          <div className="relative bg-muted/40 flex items-center justify-center min-h-[300px] md:min-h-[480px]">
            {item.url ? (
              <img
                src={item.url}
                alt={item.caption ?? item.subject.name}
                className="w-full h-full object-cover md:max-h-[560px]"
              />
            ) : (
              <div className="text-muted-foreground text-sm">No image</div>
            )}
          </div>

          {/* Detail pane */}
          <div className="p-6 flex flex-col gap-4">
            <DialogHeader className="text-left space-y-1.5">
              {item.subject.categoryName && (
                <Badge variant="outline" className="self-start text-[10px] gap-1">
                  <Tag className="h-3 w-3" /> {item.subject.categoryName}
                </Badge>
              )}
              <DialogTitle className="text-xl font-bold font-serif leading-tight">
                {item.subject.name}
              </DialogTitle>
            </DialogHeader>

            {item.caption && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.caption}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground">
              {priceLabel && (
                <span className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold font-serif">{priceLabel}</span>
                </span>
              )}
              {isService && item.subject.durationMinutes != null && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {item.subject.durationMinutes} min
                </span>
              )}
            </div>

            <div className="mt-auto pt-2">
              {onPrimaryAction && (
                <Button
                  className="w-full gap-2 h-11"
                  onClick={() => onPrimaryAction(item)}
                >
                  {isService && <Calendar className="h-4 w-4" />}
                  {ctaLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
