import { apiFetch } from "@/lib/api-client";
import type { AnalyticsOverview, AnalyticsTimelineEntry, MenuPerformanceEntry } from "@/types/api";

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
