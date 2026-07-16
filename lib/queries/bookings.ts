import { apiFetch } from "@/lib/api-client";
import type { Area, AreaPreference, Booking, BookingStatus, CreateBookingResponse } from "@/types/api";

export interface CreateBookingPayload {
  customer_name: string;
  customer_phone: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  area_preference?: AreaPreference;
  special_requests?: string;
}

export function createBooking(payload: CreateBookingPayload) {
  return apiFetch<CreateBookingResponse>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface BookingsFilters {
  date?: string;
  status?: BookingStatus;
  area?: Area;
  search?: string;
}

export function bookingsQueryOptions(filters: BookingsFilters, cookie?: string) {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.status) params.set("status", filters.status);
  if (filters.area) params.set("area", filters.area);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();

  return {
    queryKey: ["bookings", filters.date ?? null, filters.status ?? null, filters.area ?? null, filters.search ?? null] as const,
    queryFn: () =>
      apiFetch<Booking[]>(`/admin/bookings${qs ? `?${qs}` : ""}`, cookie ? { headers: { Cookie: cookie } } : {}),
  };
}

export function updateBookingStatus(id: string, status: BookingStatus) {
  return apiFetch<Booking>(`/admin/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
