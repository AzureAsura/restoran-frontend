// Server (SSR/SSG) has no origin to resolve a relative path against, so it
// must hit the backend directly; the browser goes through the same-origin
// proxy (see next.config.ts rewrites) so the auth cookie is set first-party.
const API_URL = typeof window === "undefined" ? process.env.BACKEND_URL : process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

async function rawApiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const isFormData = options.body instanceof FormData;

  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: isFormData
      ? options.headers
      : { "Content-Type": "application/json", ...options.headers },
  });
}

export async function apiFetch<T = void>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await rawApiFetch(path, options);

  if (res.status === 204) {
    return undefined as T;
  }

  const json: ApiEnvelope<T> = await res.json();

  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message, res.status);
  }

  return json.data;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

type ApiEnvelopePaginated<T> =
  | { success: true; data: T; pagination: PaginationMeta }
  | { success: false; error: { code: string; message: string } };

// List endpoints that return `pagination` as a sibling of `data` (see
// GET /admin/orders) — apiFetch() above only ever surfaces `data`, so this
// variant exists specifically for endpoints with pagination metadata.
export async function apiFetchPaginated<T = void>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; pagination: PaginationMeta }> {
  const res = await rawApiFetch(path, options);
  const json: ApiEnvelopePaginated<T> = await res.json();

  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message, res.status);
  }

  return { data: json.data, pagination: json.pagination };
}
