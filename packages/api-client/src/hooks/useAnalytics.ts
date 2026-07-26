// ─────────────────────────────────────────────────────────────────────────────
// Analytics Hooks — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../providers/ApiClientProvider';
import * as analyticsService from '../services/analytics.service';
import type { DateRange } from '../types/common.types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const analyticsKeys = {
  all: ['analytics'] as const,
  kpi: (range: DateRange) => [...analyticsKeys.all, 'kpi', range] as const,
  revenueSeries: (range: DateRange) =>
    [...analyticsKeys.all, 'revenue-series', range] as const,
  bookingTrends: (range: DateRange) =>
    [...analyticsKeys.all, 'booking-trends', range] as const,
  staffPerformance: (range: DateRange) =>
    [...analyticsKeys.all, 'staff-performance', range] as const,
  customerInsights: (range: DateRange) =>
    [...analyticsKeys.all, 'customer-insights', range] as const,
  topServices: (range: DateRange) =>
    [...analyticsKeys.all, 'top-services', range] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** KPI summary cards */
export function useDashboardKPIs(range: DateRange, customStart?: string, customEnd?: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: analyticsKeys.kpi(range),
    queryFn: () => analyticsService.getKPI(client, range, customStart, customEnd),
  });
}

/** Revenue time series */
export function useRevenueSeries(range: DateRange) {
  const client = useApiClient();
  return useQuery({
    queryKey: analyticsKeys.revenueSeries(range),
    queryFn: () => analyticsService.getRevenueSeries(client, range),
  });
}

/** Booking trends */
export function useBookingTrends(range: DateRange) {
  const client = useApiClient();
  return useQuery({
    queryKey: analyticsKeys.bookingTrends(range),
    queryFn: () => analyticsService.getBookingTrends(client, range),
  });
}

/** Staff performance table */
export function useStaffPerformance(range: DateRange, limit?: number) {
  const client = useApiClient();
  return useQuery({
    queryKey: analyticsKeys.staffPerformance(range),
    queryFn: () => analyticsService.getStaffPerformance(client, range, limit),
  });
}

/** Customer insights */
export function useCustomerInsights(range: DateRange) {
  const client = useApiClient();
  return useQuery({
    queryKey: analyticsKeys.customerInsights(range),
    queryFn: () => analyticsService.getCustomerInsights(client, range),
  });
}

/** Top services by revenue */
export function useTopServices(range: DateRange) {
  const client = useApiClient();
  return useQuery({
    queryKey: analyticsKeys.topServices(range),
    queryFn: () => analyticsService.getTopServices(client, range),
  });
}
