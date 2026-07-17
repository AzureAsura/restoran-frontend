export type Area = "indoor" | "outdoor";

export type MenuItemStatus = "available" | "out_of_stock";

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  tags: string[];
  status: MenuItemStatus;
  sort_order: number;
  created_at: string;
  category?: { id: string; name: string };
}

export interface MenuCategoryGroup {
  category: MenuCategory;
  items: MenuItem[];
}

export type BookingStatus =
  | "confirmed"
  | "seated"
  | "completed"
  | "no_show"
  | "cancelled";

export type BookingSource = "web" | "walk_in" | "phone";

export type AreaPreference = "indoor" | "outdoor" | "no_preference";

export interface CreateBookingResponse {
  booking_id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  table: {
    id: string;
    name: string;
    area: Area;
    capacity: number;
  };
  status: BookingStatus;
  message: string;
}

export interface Booking {
  id: string;
  booking_code: string;
  customer: {
    id: string;
    name: string | null;
    phone: string;
    total_visits: number;
    no_show_count: number;
  } | null;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  area_preference: AreaPreference | null;
  special_requests: string | null;
  status: BookingStatus;
  source: BookingSource;
  table: {
    id: string;
    name: string;
    area: Area;
    capacity: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export type TableStatus = "available" | "reserved" | "occupied" | "maintenance";

export interface Table {
  id: string;
  restaurant_id: string;
  name: string;
  area: Area;
  capacity: number;
  status: TableStatus;
  sort_order: number;
  created_at: string;
}

export interface CreateTableInput {
  name: string;
  area: Area;
  capacity: number;
  status?: TableStatus;
  sort_order?: number;
}

export interface UpdateTableInput {
  name?: string;
  area?: Area;
  capacity?: number;
  status?: TableStatus;
  sort_order?: number;
}

export type OrderStatus = "active" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid";
export type OrderItemStatus = "pending" | "cooking" | "ready" | "served";

export interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  qty: number;
  price_at_time: number;
  notes: string | null;
  status: OrderItemStatus;
}

export interface Order {
  id: string;
  restaurant_id: string;
  booking_id: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  table: {
    id: string;
    name: string;
    area: Area;
  };
  subtotal: number;
  tax: number;
  service_charge: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  // null = paid alone (single PATCH); shared across every order paid+printed
  // together via POST /admin/orders/pay-batch.
  payment_group_id: string | null;
  paid_at: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderBillItem {
  name: string;
  qty: number;
  price_at_time: number;
  price_at_time_formatted: string;
  line_total: number;
  line_total_formatted: string;
  notes: string | null;
}

export interface OrderBill {
  order_id: string;
  // Struk header — this DTO doubles as the printable receipt.
  restaurant: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  table: {
    id: string;
    name: string;
    area: Area;
  };
  payment_status: PaymentStatus;
  paid_at: string | null;
  items: OrderBillItem[];
  subtotal: number;
  subtotal_formatted: string;
  tax_rate_percent: number;
  tax: number;
  tax_formatted: string;
  service_charge_rate_percent: number;
  service_charge: number;
  service_charge_formatted: string;
  total: number;
  total_formatted: string;
  created_at: string;
}

export interface KitchenQueueItem {
  id: string;
  qty: number;
  notes: string | null;
  status: OrderItemStatus;
  created_at: string;
  order: {
    id: string;
    created_at: string;
    table: {
      id: string;
      name: string;
      area: Area;
    };
  };
  menu_item: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

export interface AnalyticsOverview {
  total_bookings: number;
  total_walk_ins: number;
  total_revenue: number;
  occupancy_rate: number;
  no_show_count: number;
  menu_top: { name: string; order_count: number }[];
}

export interface AnalyticsTimelineEntry {
  hour: string;
  booking_count: number;
}

export interface MenuPerformanceEntry {
  menu_item_id: string;
  name: string;
  order_count: number;
}

// ── Keuangan (/admin/finance) ──

export type RevenuePeriod = "week" | "month" | "year";

interface AnalyticsPeriodRange {
  period: RevenuePeriod;
  range: { start: string; end: string };
}

export interface RevenueSeriesEntry {
  bucket: string;
  label: string;
  revenue: number;
  revenue_formatted: string;
  // Distinct payment_group_id (fallback to order id) within this bucket —
  // a merged struk counts once, not once per underlying order.
  order_count: number;
}

export interface RevenueByCategoryEntry {
  category_id: string;
  category: string;
  revenue: number;
  revenue_formatted: string;
  qty_sold: number;
}

export interface RevenueByHourEntry {
  hour: string;
  revenue: number;
  revenue_formatted: string;
}

export interface RevenueReport extends AnalyticsPeriodRange {
  summary: {
    total_revenue: number;
    total_revenue_formatted: string;
    subtotal: number;
    tax: number;
    service_charge: number;
    order_count: number;
    avg_order_value: number;
    avg_order_value_formatted: string;
  };
  previous_period: {
    total_revenue: number;
    total_revenue_formatted: string;
    // null when the previous period had zero revenue — growth % is
    // undefined there, not a misleading number.
    growth_percent: number | null;
  };
  by_category: RevenueByCategoryEntry[];
  by_hour: RevenueByHourEntry[];
  series: RevenueSeriesEntry[];
}

export type WeekdayName =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface ReservationAnalytics extends AnalyticsPeriodRange {
  occupancy: { avg_rate_percent: number };
  no_show: {
    count: number;
    // Denominator for rate_percent: bookings whose outcome is resolved
    // (completed + no_show only) — a still-confirmed or cancelled booking
    // was never a "did they show up" question.
    resolved_count: number;
    rate_percent: number;
    estimated_lost_revenue: number;
    estimated_lost_revenue_formatted: string;
  };
  popular_times: {
    by_day_of_week: { day: WeekdayName; booking_count: number }[];
    by_hour: { hour: string; booking_count: number }[];
  };
}

export interface MenuFinancialItem {
  menu_item_id: string;
  name: string;
  qty_sold: number;
  revenue: number;
  revenue_formatted: string;
}

export interface MenuFinancialCrossSellPair {
  menu_item_a: { id: string; name: string };
  menu_item_b: { id: string; name: string };
  pair_count: number;
}

export interface MenuFinancials extends AnalyticsPeriodRange {
  // Every active menu item, including ones never ordered (qty_sold: 0) —
  // sort ascending client-side for "rarely ordered".
  items: MenuFinancialItem[];
  cross_sell: MenuFinancialCrossSellPair[];
}

export type StaffRole = "owner" | "cashier" | "kitchen";

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    role: StaffRole;
  };
  session: {
    id: string;
    expiresAt: string;
  };
}
