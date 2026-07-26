// ─────────────────────────────────────────────────────────────────────────────
// Analytics Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Consolidated from:
//   - kshuri-salon-dashboard/src/api/analytics.ts
//   - kshuri-freelancer-dashboard/src/api/analytics.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { DateRange } from './common.types';

/** KPI card data for dashboard overview */
export interface KPIData {
  total_revenue: number;
  total_bookings: number;
  new_customers: number;
  avg_booking_value: number;
  completion_rate: number;
  revenue_change_pct: number;
  bookings_change_pct?: number;
}

/** Staff performance row for the manager analytics table */
export interface StaffPerformanceRow {
  staff_id: string;
  staff_name: string;
  total_bookings: number;
  total_revenue: number;
  avg_rating: number;
  completion_rate: number;
}

/** Customer retention and churn insights */
export interface CustomerInsights {
  new_customers: number;
  returning_customers: number;
  churn_rate: number;
  avg_visits_per_customer: number;
  top_customers: Array<{
    customer_id: string;
    name: string;
    visit_count: number;
    total_spent: number;
  }>;
}

/** Top service by revenue for dashboard widget */
export interface TopService {
  service_id: string;
  service_name: string;
  booking_count: number;
  total_revenue: number;
  revenue_share_pct: number;
}

/** Params for analytics endpoints */
export interface AnalyticsParams {
  range: DateRange;
  start?: string;
  end?: string;
  limit?: number;
}
