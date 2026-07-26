// ─────────────────────────────────────────────────────────────────────────────
// @kshuri/ui — profile components barrel.
//
// Layer 1: vendor-agnostic types (single source of truth for prop shapes)
// Layer 2: gallery primitives (lightbox, grid, card)
// Layer 3: presentational sub-tabs (Gallery / About / Services / Reviews)
// Layer 4: composite blocks (VendorBanner, VendorHeader, VendorBookingCard)
// Layer 5: dialogs (BookingDialog, UploadMediaDialog, ServiceDetailSheet)
// Layer 6: helpers (amenity-icons)
// ─────────────────────────────────────────────────────────────────────────────

export * from "./types";

// Gallery primitives
export { default as GalleryCard } from "./gallery/GalleryCard";
export { default as GalleryGrid } from "./gallery/GalleryGrid";
export { default as GalleryLightbox } from "./gallery/GalleryLightbox";
export type { GalleryItem } from "./gallery/types";

// Presentational sub-tabs
export { default as PortfolioTab } from "./PortfolioTab";
export { default as AboutTab } from "./AboutTab";
export { default as ServicesTab } from "./ServicesTab";
export { default as ReviewsTab } from "./ReviewsTab";

// Composite blocks
export { default as VendorBanner } from "./VendorBanner";
export { default as VendorHeader } from "./VendorHeader";
export { default as VendorAmenityStrip } from "./VendorAmenityStrip";
export { default as VendorBookingCard } from "./VendorBookingCard";
export { VendorSubscriptionSection } from "./VendorSubscriptionSection";
export type { VendorSubscriptionSectionProps } from "./VendorSubscriptionSection";

// Dialogs
export { default as ServiceDetailSheet } from "./ServiceDetailSheet";
export { default as BookingDialog } from "./BookingDialog";
export { default as UploadMediaDialog } from "./UploadMediaDialog";

// Helpers
export { amenityIcon } from "./amenity-icons";

// Edit-tab sections (shared between vendor dashboards)
export { WorkingHoursEditor } from "./WorkingHoursEditor";
export { ProfileCompletenessCard } from "./edit/ProfileCompletenessCard";
export type { CompletenessCheck } from "./edit/ProfileCompletenessCard";
export { ProfileSectionCard } from "./edit/ProfileSectionCard";
export { SocialLinksEditor } from "./edit/SocialLinksEditor";
export type { SocialLinksValue, SocialLinksErrors } from "./edit/SocialLinksEditor";
export { CertificationsEditor } from "./edit/CertificationsEditor";
export type { CertificationItem } from "./edit/CertificationsEditor";
export { TagPicker } from "./edit/TagPicker";
export { BannerLogoUploader } from "./edit/BannerLogoUploader";

// Edit-mode shell (sticky save bar + lifecycle hook + draft autosave)
export { EditModeBar } from "./edit/EditModeBar";
export type { EditModeBarProps } from "./edit/EditModeBar";
export { useEditMode } from "./edit/useEditMode";
export type { EditModeApi, UseEditModeOptions } from "./edit/useEditMode";
export { useDraftAutosave } from "./edit/useDraftAutosave";
export type { UseDraftAutosaveOptions } from "./edit/useDraftAutosave";
export { NavigationGuardDialog } from "./edit/NavigationGuardDialog";
export type { NavigationGuardDialogProps } from "./edit/NavigationGuardDialog";
export { CategoryPicker } from "./edit/CategoryPicker";
export type { CategoryPickerProps } from "./edit/CategoryPicker";
export { CategorySingleSelect } from "./edit/CategorySingleSelect";
export type { CategorySingleSelectProps } from "./edit/CategorySingleSelect";
