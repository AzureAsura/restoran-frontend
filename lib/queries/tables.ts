import { apiFetch } from "@/lib/api-client";
import type { CreateTableInput, Table, UpdateTableInput } from "@/types/api";

export function tablesQueryOptions(cookie?: string) {
  return {
    queryKey: ["tables"] as const,
    queryFn: () =>
      apiFetch<Table[]>("/admin/tables", cookie ? { headers: { Cookie: cookie } } : {}),
  };
}

export function createTable(input: CreateTableInput) {
  return apiFetch<Table>("/admin/tables", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTable(id: string, input: UpdateTableInput) {
  return apiFetch<Table>(`/admin/tables/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTable(id: string) {
  return apiFetch<void>(`/admin/tables/${id}`, { method: "DELETE" });
}

// Completes every active (paid) order at this table and frees it — the only
// way a table goes back to "available". Server-side guarded: 409 if any
// active order there isn't paid yet.
export function closeTable(id: string) {
  return apiFetch<void>(`/admin/tables/${id}/close`, { method: "POST" });
}
