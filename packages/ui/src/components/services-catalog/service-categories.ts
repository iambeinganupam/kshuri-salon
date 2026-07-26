// ─────────────────────────────────────────────────────────────────────────────
// Canonical service category list — single source of truth for the catalog
// management dropdown across salon + freelancer dashboards.
//
// Synced 2026-05-29 to match the consolidated 8-root taxonomy (migration 073).
// Free-text entries from older data are tolerated (the form falls through to
// "Other") but new services snap to one of these labels for consistent
// grouping. Phase 4 of the category-system rollout swaps these dropdowns for
// the DB-driven `<ServiceCategoryPicker />`; this constant can drop then.
//
// Legacy aliases preserved as comments — they still exist as deactivated
// rows in `service_categories` so old services pointing at them won't 404.
// ─────────────────────────────────────────────────────────────────────────────

export const SERVICE_CATEGORIES = [
  "Hair",
  "Skin & Facial",            // was "Skin"
  "Spa & Massage",            // was "Spa" / "Massage"
  "Nails",
  "Makeup",
  "Barber & Men's Grooming",  // was "Beard"
  "Hair Removal & Threading",
  "Mehndi / Henna",           // new in 073
  "Other",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
