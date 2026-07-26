// ─────────────────────────────────────────────────────────────────────────────
// API Module: Analytics — kshuri-salon-dashboard (B2B)
// Backend: /api/v1/analytics
// Endpoints: ANLY-01 … ANLY-05 + top-services
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface KPIData {
  total_revenue: number;
  total_bookings: number;
  new_customers: number;
  avg_booking_value: number;
  completion_rate: number;
  revenue_change_pct: number;
  bookings_change_pct: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface StaffPerformanceRow {
  staff_id: string;
  staff_name: string;
  total_bookings: number;
  total_revenue: number;
  avg_rating: number;
  completion_rate: number;
}

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

export interface TopService {
  service_id: string;
  service_name: string;
  booking_count: number;
  total_revenue: number;
  revenue_share_pct: number;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * ANLY-01: KPI summary cards for dashboard
 */
export async function getKPI(
  range: DateRange,
  customStart?: string,
  customEnd?: string,
): Promise<KPIData> {
  const { data } = await apiClient.get<{ success: true; data: KPIData }>(
    '/analytics/kpi',
    { params: { range, start: customStart, end: customEnd } },
  );
  return data.data;
}

/**
 * ANLY-02: Revenue time series (for area/line chart)
 */
export async function getRevenueSeries(range: DateRange): Promise<TimeSeriesPoint[]> {
  const { data } = await apiClient.get<{ success: true; data: TimeSeriesPoint[] }>(
    '/analytics/revenue-series',
    { params: { range } },
  );
  return data.data;
}

/**
 * ANLY-03: Booking trend series (for bar chart)
 */
export async function getBookingTrends(range: DateRange): Promise<TimeSeriesPoint[]> {
  const { data } = await apiClient.get<{ success: true; data: TimeSeriesPoint[] }>(
    '/analytics/booking-trends',
    { params: { range } },
  );
  return data.data;
}

/**
 * ANLY-04: Staff performance table (Manager / Harmony Hub)
 */
export async function getStaffPerformance(
  range: DateRange,
  limit = 10,
): Promise<StaffPerformanceRow[]> {
  const { data } = await apiClient.get<{ success: true; data: StaffPerformanceRow[] }>(
    '/analytics/staff-performance',
    { params: { range, limit } },
  );
  return data.data;
}

/**
 * ANLY-05: Customer insights (retention, churn, top customers)
 */
export async function getCustomerInsights(range: DateRange): Promise<CustomerInsights> {
  const { data } = await apiClient.get<{ success: true; data: CustomerInsights }>(
    '/analytics/customers',
    { params: { range } },
  );
  return data.data;
}

/**
 * Top services by revenue (bonus endpoint for dashboard widget)
 */
export async function getTopServices(range: DateRange): Promise<TopService[]> {
  const { data } = await apiClient.get<{ success: true; data: TopService[] }>(
    '/analytics/top-services',
    { params: { range } },
  );
  return data.data;
}
