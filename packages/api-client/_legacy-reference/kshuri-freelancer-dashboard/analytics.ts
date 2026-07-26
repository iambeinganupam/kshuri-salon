// ─────────────────────────────────────────────────────────────────────────────
// API Module: Analytics — kshuri-freelancer-dashboard
// Backend: /api/v1/analytics
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from '../lib/apiClient';

export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year';

export interface KPIData {
  total_revenue: number;
  total_bookings: number;
  new_customers: number;
  avg_booking_value: number;
  completion_rate: number;
  revenue_change_pct: number;
}

export interface TimeSeriesPoint { date: string; value: number; }

export async function getKPI(range: DateRange): Promise<KPIData> {
  const { data } = await apiClient.get('/analytics/kpi', { params: { range } });
  return data.data;
}

export async function getRevenueSeries(range: DateRange): Promise<TimeSeriesPoint[]> {
  const { data } = await apiClient.get('/analytics/revenue-series', { params: { range } });
  return data.data;
}

export async function getBookingTrends(range: DateRange): Promise<TimeSeriesPoint[]> {
  const { data } = await apiClient.get('/analytics/booking-trends', { params: { range } });
  return data.data;
}
