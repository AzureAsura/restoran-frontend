import { apiFetch } from "@/lib/api-client";
import type { Order, OrderBill, PaymentStatus } from "@/types/api";

export interface CreateOrderItemPayload {
  menu_item_id: string;
  qty: number;
  notes?: string;
}

export interface CreateOrderPayload {
  table_id: string;
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
