// ─────────────────────────────────────────────────────────────────────────────
// Analytics Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type { DateRange, TimeSeriesPoint } from '../types/common.types';
import type {
  KPIData,
  StaffPerformanceRow,
  CustomerInsights,
  TopService,
} from '../types/analytics.types';

type BackendRange = 'today' | '7d' | '30d' | 'custom';

function toBackendRange(range: DateRange): BackendRange {
  const map: Record<DateRange, BackendRange> = {
    today: 'today', week: '7d', month: '30d', quarter: '30d', year: '30d', custom: 'custom',
  };
  return map[range] ?? '30d';
}

/** ANLY-01: KPI summary cards */
export async function getKPI(
  client: AxiosInstance,
  range: DateRange,
  customStart?: string,
  customEnd?: string,
): Promise<KPIData> {
  const { data } = await client.get<{ success: true; data: KPIData }>(
    '/analytics/kpi',
    { params: { range: toBackendRange(range), start: customStart, end: customEnd } },
  );
  const d = data.data;
  // pg returns DECIMAL/NUMERIC columns as strings — coerce all numeric fields here
  return {
    ...d,
    total_revenue: Number(d.total_revenue ?? 0),
    avg_booking_value: Number(d.avg_booking_value ?? 0),
    completion_rate: Number(d.completion_rate ?? 0),
    revenue_change_pct: Number(d.revenue_change_pct ?? 0),
    bookings_change_pct: d.bookings_change_pct != null ? Number(d.bookings_change_pct) : undefined,
    total_bookings: Number(d.total_bookings ?? 0),
    new_customers: Number(d.new_customers ?? 0),
  };
}

/** ANLY-02: Revenue time series */
export async function getRevenueSeries(
  client: AxiosInstance,
  range: DateRange,
): Promise<TimeSeriesPoint[]> {
  const { data } = await client.get<{ success: true; data: TimeSeriesPoint[] }>(
    '/analytics/revenue-series',
    { params: { range: toBackendRange(range) } },
  );
  return data.data;
}

/** ANLY-03: Booking trend series */
export async function getBookingTrends(
  client: AxiosInstance,
  range: DateRange,
): Promise<TimeSeriesPoint[]> {
  const { data } = await client.get<{ success: true; data: TimeSeriesPoint[] }>(
    '/analytics/booking-trends',
    { params: { range: toBackendRange(range) } },
  );
  return data.data;
}

/** ANLY-04: Staff performance table */
export async function getStaffPerformance(
  client: AxiosInstance,
  range: DateRange,
  limit = 10,
): Promise<StaffPerformanceRow[]> {
  const { data } = await client.get<{ success: true; data: StaffPerformanceRow[] }>(
    '/analytics/staff-performance',
    { params: { range: toBackendRange(range), limit } },
  );
  return (data.data ?? []).map(r => ({
    ...r,
    total_revenue: Number(r.total_revenue ?? 0),
    avg_rating: Number(r.avg_rating ?? 0),
    completion_rate: Number(r.completion_rate ?? 0),
    total_bookings: Number(r.total_bookings ?? 0),
  }));
}

/** ANLY-05: Customer insights */
export async function getCustomerInsights(
  client: AxiosInstance,
  range: DateRange,
): Promise<CustomerInsights> {
  const { data } = await client.get<{ success: true; data: CustomerInsights }>(
    '/analytics/customers',
    { params: { range: toBackendRange(range) } },
  );
  const d = data.data;
  return {
    ...d,
    new_customers: Number(d.new_customers ?? 0),
    returning_customers: Number(d.returning_customers ?? 0),
    churn_rate: Number(d.churn_rate ?? 0),
    avg_visits_per_customer: Number(d.avg_visits_per_customer ?? 0),
    top_customers: (d.top_customers ?? []).map(c => ({
      ...c,
      total_spent: Number(c.total_spent ?? 0),
      visit_count: Number(c.visit_count ?? 0),
    })),
  };
}

/** Top services by revenue */
export async function getTopServices(
  client: AxiosInstance,
  range: DateRange,
): Promise<TopService[]> {
  const { data } = await client.get<{ success: true; data: TopService[] }>(
    '/analytics/top-services',
    { params: { range: toBackendRange(range) } },
  );
  return (data.data ?? []).map(s => ({
    ...s,
    total_revenue: Number(s.total_revenue ?? 0),
    revenue_share_pct: Number(s.revenue_share_pct ?? 0),
    booking_count: Number(s.booking_count ?? 0),
  }));
}
