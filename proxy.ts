import { NextRequest, NextResponse } from "next/server";
import { getAdminRouteRoles } from "@/lib/admin-routes";
import { ROLE_LANDING_PAGE } from "@/lib/role-landing";
import type { Session } from "@/types/api";

const API_URL = process.env.BACKEND_URL;

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/admin/login";

  // Strip any client-supplied x-session-data up front, on every pass-through
  // path — only this middleware may set it, and only after verifying the
  // session below. Without this, a forged header on a path that falls
  // through to plain NextResponse.next() (e.g. the login page while logged
  // out) would reach server components unmodified.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-session-data");
  const forward = () => NextResponse.next({ request: { headers: requestHeaders } });

  let session: Session | null = null;
  try {
    const res = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    session = await res.json();
  } catch {
    session = null;
  }

  // Already logged in — don't let them back onto the login page, send them
  // to their own landing page instead.
  if (isLoginPage) {
    if (session) {
      return NextResponse.redirect(new URL(ROLE_LANDING_PAGE[session.user.role], request.url));
    }
    return forward();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const allowedRoles = getAdminRouteRoles(pathname);
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return NextResponse.redirect(new URL(ROLE_LANDING_PAGE[session.user.role], request.url));
  }

  // Session was already fetched above to gate this route — forward it to the
  // server component tree via a request header so layout.tsx/page.tsx can
  // seed the ['session'] query cache instead of calling get-session again.
  // Server-side only: this header never reaches the browser.
  requestHeaders.set("x-session-data", JSON.stringify(session));
  return forward();
}

export const config = {
  matcher: ["/admin/:path*"],
};
