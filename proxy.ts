import { NextRequest, NextResponse } from "next/server";
import { getAdminRouteRoles } from "@/lib/admin-routes";
import { ROLE_LANDING_PAGE } from "@/lib/role-landing";
import type { Session } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/admin/login";

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
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const allowedRoles = getAdminRouteRoles(pathname);
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return NextResponse.redirect(new URL(ROLE_LANDING_PAGE[session.user.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
