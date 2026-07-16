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

export async function apiFetch<T = void>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: isFormData
      ? options.headers
      : { "Content-Type": "application/json", ...options.headers },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const json: ApiEnvelope<T> = await res.json();

  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message, res.status);
  }

  return json.data;
}
