// ─────────────────────────────────────────────────────────────────────────────
// Common Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Shared types used across multiple domain modules.
// ─────────────────────────────────────────────────────────────────────────────

/** Vendor types (polymorphic FK target) */
export type VendorType = 'salon_location' | 'freelancer';

/** Date range filter for analytics and report endpoints */
export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/** Sort direction for list endpoints */
export type SortOrder = 'asc' | 'desc';

/** Standard pagination params sent to list endpoints */
export interface PaginationParams {
  limit?: number;
  cursor?: string;
  page?: number;
}

/** Time series data point for chart rendering */
export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}
