// ─────────────────────────────────────────────────────────────────────────────
// @kshuri/ui — services-catalog barrel.
//
// Shared building blocks for the per-vendor catalog management page (the
// "Services" tab inside salon and freelancer dashboards). The UX is identical
// across the two surfaces — these primitives keep them in lock-step.
//
// Layer 1: types + canonical category list
// Layer 2: presentational primitives (StatsCards, Filters, Card, EmptyState)
// Layer 3: dialogs (PhotosEditor, FormDialog) — speak to the API directly
// ─────────────────────────────────────────────────────────────────────────────

export * from "./types";
export { SERVICE_CATEGORIES, type ServiceCategory } from "./service-categories";

export { ServiceCard } from "./ServiceCard";
export { ServiceFilters, type ServiceGenderFilter } from "./ServiceFilters";
export { ServiceStatsCards } from "./ServiceStatsCards";
export { ServicesEmptyState } from "./ServicesEmptyState";
export { ServicePhotosEditor, MAX_PHOTOS_PER_SERVICE } from "./ServicePhotosEditor";
export { ServiceFormDialog } from "./ServiceFormDialog";
