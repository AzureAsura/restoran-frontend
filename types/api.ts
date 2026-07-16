export type Area = "indoor" | "outdoor";

export type MenuItemStatus = "available" | "out_of_stock";

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
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
  table: {
    id: string;
    name: string;
    area: Area;
  };
  payment_status: PaymentStatus;
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
