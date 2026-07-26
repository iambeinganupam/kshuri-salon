// ─────────────────────────────────────────────────────────────────────────────
// Service-category UI module — shared picker, grid, breadcrumb.
//
// One component, four use cases:
//   • ServiceCategoryPicker — vendor onboarding / catalog editor / filter
//   • ServiceCategoryGrid   — homepage 8-card grid
//   • ServiceCategoryBreadcrumb — trail on /services/[slug] pages
// ─────────────────────────────────────────────────────────────────────────────

export { ServiceCategoryPicker } from './ServiceCategoryPicker';
export type {
  ServiceCategoryPickerMode,
  ServiceCategoryPickerProps,
} from './ServiceCategoryPicker';

export { ServiceCategoryGrid } from './ServiceCategoryGrid';
export type { ServiceCategoryGridProps } from './ServiceCategoryGrid';

export {
  ServiceCategoryBreadcrumb,
} from './ServiceCategoryBreadcrumb';
export type {
  ServiceCategoryBreadcrumbProps,
  ServiceCategoryBreadcrumbItem,
} from './ServiceCategoryBreadcrumb';

export { CATEGORY_ICON_MAP, resolveCategoryIcon } from './category-icons';
export type { ServiceCategoryNode } from './types';
