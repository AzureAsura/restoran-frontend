import type { Session } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class AuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new AuthError(json.code, json.message);
  }

  return json as T;
}

export function signIn(email: string, password: string) {
  return authFetch<{ user: Session["user"] }>("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signOut() {
  return authFetch<{ success: boolean }>("/api/auth/sign-out", {
    method: "POST",
  });
}

export function getSession(cookie?: string) {
  return authFetch<Session | null>("/api/auth/get-session", {
    headers: cookie ? { cookie } : undefined,
  });
}
