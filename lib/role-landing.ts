import type { StaffRole } from "@/types/api";

export const ROLE_LANDING_PAGE: Record<StaffRole, string> = {
  owner: '/admin/tables',
  cashier: '/admin/pos',
  kitchen: '/admin/kitchen',
};
