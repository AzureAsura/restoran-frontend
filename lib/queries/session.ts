import { getSession } from "@/lib/auth-client";

export function sessionQueryOptions(cookie?: string) {
  return {
    queryKey: ["session"] as const,
    queryFn: () => getSession(cookie),
  };
}
