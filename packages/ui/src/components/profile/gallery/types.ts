// ─────────────────────────────────────────────────────────────────────────────
// Gallery — shared types
// ─────────────────────────────────────────────────────────────────────────────
// Designed to be subject-agnostic so the same Card / Lightbox / Grid components
// work for services today and products in a later phase. Only the data adapter
// (in PortfolioTab) changes.
// ─────────────────────────────────────────────────────────────────────────────

export type GallerySubjectKind = "service" | "product";

export interface GallerySubject {
  kind: GallerySubjectKind;
  id: string;
  name: string;
  categoryName: string | null;
  /** Service price OR product unit price, in the vendor's currency */
  price: number | null;
  /** Service duration in minutes, if applicable */
  durationMinutes?: number | null;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption: string | null;
  subject: GallerySubject;
  createdAt?: string;
}
