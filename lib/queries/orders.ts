import { apiFetch, apiFetchPaginated } from "@/lib/api-client";
import type { Order, OrderBill, PaymentStatus } from "@/types/api";

export interface CreateOrderItemPayload {
  menu_item_id: string;
  qty: number;
  notes?: string;
}

export interface CreateOrderPayload {
  table_id: string;
  // Cashier-picked, not auto-matched — only set when explicitly linking this
  // order to a booking (e.g. the reserved party has arrived).
  booking_id?: string;
  customer_phone?: string;
  customer_name?: string;
  items: CreateOrderItemPayload[];
}

export function createOrder(payload: CreateOrderPayload) {
  return apiFetch<Order>("/admin/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function activeOrdersQueryOptions(tableId: string) {
  return {
    queryKey: ["orders", "active", tableId] as const,
    queryFn: () => apiFetch<Order[]>(`/admin/orders?table_id=${tableId}&status=active`),
  };
}

export function orderBillQueryOptions(orderId: string) {
  return {
    queryKey: ["order-bill", orderId] as const,
    queryFn: () => apiFetch<OrderBill>(`/admin/orders/${orderId}/bill`),
  };
}

export function updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus) {
  return apiFetch<Order>(`/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ payment_status: paymentStatus }),
  });
}

// Pays 1+ orders together as a single transaction/struk (split-bill) —
// server assigns one shared payment_group_id + paid_at to all of them.
export function payOrdersBatch(orderIds: string[]) {
  return apiFetch<Order[]>("/admin/orders/pay-batch", {
    method: "POST",
    body: JSON.stringify({ order_ids: orderIds }),
  });
}

export interface PaidOrdersParams {
  paid_from?: string;
  paid_to?: string;
  page?: number;
  limit?: number;
}

// Riwayat Struk (/admin/finance) — paid orders within a date range. Group by
// payment_group_id client-side to collapse a merged struk into one row.
export function paidOrdersQueryOptions(params: PaidOrdersParams = {}, cookie?: string) {
  const search = new URLSearchParams({ payment_status: "paid" });
  if (params.paid_from) search.set("paid_from", params.paid_from);
  if (params.paid_to) search.set("paid_to", params.paid_to);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  return {
    queryKey: ["orders", "paid", params.paid_from, params.paid_to, params.page, params.limit] as const,
    queryFn: () =>
      apiFetchPaginated<Order[]>(
        `/admin/orders?${search.toString()}`,
        cookie ? { headers: { Cookie: cookie } } : {}
      ),
  };
}

export function paidOrderRangeFromPeriod(range: { start: string; end: string }): {
  paid_from: string;
  paid_to: string;
} {
  const inclusiveEnd = new Date(`${range.end}T00:00:00Z`);
  inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() - 1);
  return { paid_from: range.start, paid_to: inclusiveEnd.toISOString().slice(0, 10) };
}

export function groupOrdersByPaymentGroup(orders: Order[]): Order[][] {
  const groups = new Map<string, Order[]>();
  for (const order of orders) {
    const key = order.payment_group_id ?? order.id;
    const existing = groups.get(key);
    if (existing) existing.push(order);
    else groups.set(key, [order]);
  }
  return [...groups.values()];
}
