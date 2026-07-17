import type { StaffRole } from "@/types/api";

// Single source of truth for which roles can access which /admin page —
// shared by proxy.ts (redirects wrong-role access before the page renders)
// and AdminSidebar.tsx (hides links the current role can't use), so the two
// can't drift apart. Keyed by the path segment right after "/admin/".
export const ADMIN_ROUTE_ROLES: Record<string, StaffRole[]> = {
  dashboard: ['owner'],
  bookings: ['owner', 'cashier'],
  tables: ['owner', 'cashier'],
  pos: ['owner', 'cashier'],
  kitchen: ['owner', 'kitchen'],
  menu: ['owner', 'cashier'],
  finance: ['owner'],
  settings: ['owner'],
};

export function getAdminRouteRoles(path: string): StaffRole[] | undefined {
  const segment = path.replace(/^\/admin\/?/, '').split('/')[0];
  return ADMIN_ROUTE_ROLES[segment];
}
