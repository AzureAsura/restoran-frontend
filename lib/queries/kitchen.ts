import { apiFetch } from "@/lib/api-client";
import type { KitchenQueueItem, OrderItemStatus } from "@/types/api";

export function kitchenQueueQueryOptions(cookie?: string) {
  return {
    queryKey: ["kitchen-queue"] as const,
    queryFn: () =>
      apiFetch<KitchenQueueItem[]>("/admin/kitchen-queue", cookie ? { headers: { Cookie: cookie } } : {}),
  };
}

export function updateOrderItemStatus(id: string, status: OrderItemStatus) {
  return apiFetch<void>(`/admin/order-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
