import { headers } from "next/headers";
import type { Session } from "@/types/api";

// proxy.ts (middleware) already fetches the session to gate /admin/* routes —
// this reads that result back out of the request header it forwarded, so
// server components can seed the ['session'] query cache without calling
// get-session a second time.
export async function getForwardedSession(): Promise<Session | null> {
  const raw = (await headers()).get("x-session-data");
  return raw ? (JSON.parse(raw) as Session) : null;
}
