import { apiFetch } from "@/lib/api-client";
import type {
  AnalyticsOverview,
  AnalyticsTimelineEntry,
  MenuFinancials,
  MenuPerformanceEntry,
  ReservationAnalytics,
  RevenuePeriod,
  RevenueReport,
} from "@/types/api";

export type MenuPerformanceRange = "today" | "week";

export function analyticsOverviewQueryOptions(date: string, cookie?: string) {
  return {
    queryKey: ["analytics-overview", date] as const,
    queryFn: () =>
      apiFetch<AnalyticsOverview>(
        `/admin/analytics?date=${date}`,
        cookie ? { headers: { Cookie: cookie } } : {}
      ),
  };
}

export function analyticsTimelineQueryOptions(date: string, cookie?: string) {
  return {
    queryKey: ["analytics-timeline", date] as const,
    queryFn: () =>
      apiFetch<AnalyticsTimelineEntry[]>(
        `/admin/analytics/timeline?date=${date}`,
        cookie ? { headers: { Cookie: cookie } } : {}
      ),
  };
}

export function menuPerformanceQueryOptions(range: MenuPerformanceRange, cookie?: string) {
  return {
    queryKey: ["menu-performance", range] as const,
    queryFn: () =>
      apiFetch<MenuPerformanceEntry[]>(
        `/admin/analytics/menu-performance?range=${range}`,
        cookie ? { headers: { Cookie: cookie } } : {}
      ),
  };
}

export function revenueReportQueryOptions(period: RevenuePeriod, date: string, cookie?: string) {
  return {
    queryKey: ["revenue-report", period, date] as const,
    queryFn: () =>
      apiFetch<RevenueReport>(
        `/admin/analytics/revenue?period=${period}&date=${date}`,
        cookie ? { headers: { Cookie: cookie } } : {}
      ),
  };
}

export function reservationAnalyticsQueryOptions(period: RevenuePeriod, date: string, cookie?: string) {
  return {
    queryKey: ["reservation-analytics", period, date] as const,
    queryFn: () =>
      apiFetch<ReservationAnalytics>(
        `/admin/analytics/reservations?period=${period}&date=${date}`,
        cookie ? { headers: { Cookie: cookie } } : {}
      ),
  };
}

export function menuFinancialsQueryOptions(period: RevenuePeriod, date: string, cookie?: string) {
  return {
    queryKey: ["menu-financials", period, date] as const,
    queryFn: () =>
      apiFetch<MenuFinancials>(
        `/admin/analytics/menu-financials?period=${period}&date=${date}`,
        cookie ? { headers: { Cookie: cookie } } : {}
      ),
  };
}
