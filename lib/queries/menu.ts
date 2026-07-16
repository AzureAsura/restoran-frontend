import { apiFetch } from "@/lib/api-client";
import type { MenuCategory, MenuCategoryGroup, MenuItem, MenuItemStatus } from "@/types/api";

export function menuQueryOptions() {
  return {
    queryKey: ["menu"] as const,
    queryFn: () => apiFetch<MenuCategoryGroup[]>("/menu"),
  };
}

export function adminMenuQueryOptions(cookie?: string) {
  return {
    queryKey: ["admin-menu"] as const,
    queryFn: () => apiFetch<MenuItem[]>("/admin/menu", cookie ? { headers: { Cookie: cookie } } : {}),
  };
}

export function menuCategoriesQueryOptions(cookie?: string) {
  return {
    queryKey: ["menu-categories"] as const,
    queryFn: () =>
      apiFetch<MenuCategory[]>("/admin/menu-categories", cookie ? { headers: { Cookie: cookie } } : {}),
  };
}

export interface MenuItemFormInput {
  category_id: string;
  name: string;
  price: number; // cents — konversi dolar->cents dilakukan di caller
  description?: string;
  tags: string; // comma-separated, boleh string kosong
  status: MenuItemStatus;
  image?: File | null;
}

function toMenuItemFormData(input: MenuItemFormInput) {
  const formData = new FormData();
  formData.set("category_id", input.category_id);
  formData.set("name", input.name);
  formData.set("price", String(input.price));
  formData.set("tags", input.tags);
  formData.set("status", input.status);
  if (input.description !== undefined) formData.set("description", input.description);
  if (input.image) formData.set("image", input.image);
  return formData;
}

export function createMenuItem(input: MenuItemFormInput) {
  return apiFetch<MenuItem>("/admin/menu", {
    method: "POST",
    body: toMenuItemFormData(input),
  });
}

export function updateMenuItem(id: string, input: MenuItemFormInput) {
  return apiFetch<MenuItem>(`/admin/menu/${id}`, {
    method: "PATCH",
    body: toMenuItemFormData(input),
  });
}

export function deleteMenuItem(id: string) {
  return apiFetch<void>(`/admin/menu/${id}`, { method: "DELETE" });
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name?: string;
  is_active?: boolean;
}

export function createCategory(input: CreateCategoryInput) {
  return apiFetch<MenuCategory>("/admin/menu-categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(id: string, input: UpdateCategoryInput) {
  return apiFetch<MenuCategory>(`/admin/menu-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCategory(id: string) {
  return apiFetch<void>(`/admin/menu-categories/${id}`, { method: "DELETE" });
}
