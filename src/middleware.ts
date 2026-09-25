// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { isAdminRole, isEmployerRole, isJobSeekerRole, roleFromToken } from "@/lib/authz";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip _next, static, favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Root → /en

  // Must be under /{lang}/...
  const localeMatch = pathname.match(/^\/(en|am|om)(\/|$)/);
  if (!localeMatch) return NextResponse.next();

  const lang = localeMatch[1];
  // segments = ['', lang, ...rest]
  const segments = pathname.split("/");
  const isAuthBase = segments[2] === "auth";
  const authPage = segments[3]; // e.g. 'login' or 'register'
  const firstAfterLocale = segments[2]; // e.g. 'dashboard', 'profile', 'auth', etc.

  // get the NextAuth JWT (or null)
  const token = await getToken({ req, secret });

  // 1) If visiting /{lang}/auth/login or /{lang}/auth/register
  //    and you ARE logged in → send to dashboard
  if (isAuthBase && (authPage === "login" || authPage === "register")) {
    if (token) {
      return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url));
    }
    return NextResponse.next();
  }

  // 2) Protect only these routes
  const protectedRoutes = ["dashboard", "profile", "settings", "admin"];
  if (protectedRoutes.includes(firstAfterLocale)) {
    // if NOT logged in → send to login
    if (!token) {
      return NextResponse.redirect(new URL(`/${lang}/auth/login`, req.url));
    }
  }

  // 3) Employer-only area (pages)
  if (firstAfterLocale === "employer") {
    if (!token) {
      return NextResponse.redirect(new URL(`/${lang}/auth/login`, req.url));
    }
    const role = roleFromToken(token);
    if (!isEmployerRole(role)) {
      // Redirect to dashboard if logged-in but not allowed
      return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url));
    }
  }

  // 4) API RBAC enforcement
  if (pathname.startsWith("/api")) {
    // Allow auth and webhooks without role checks
    if (
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/webhooks")
    ) {
      return NextResponse.next();
    }

    // Get token once for API checks
    const apiToken = token || (await getToken({ req, secret }));
    const apiRole = roleFromToken(apiToken);

    // Employer-only APIs
    if (pathname.startsWith("/api/employer/")) {
      if (!apiToken) return new NextResponse("Unauthorized", { status: 401 });
      if (!isEmployerRole(apiRole))
        return new NextResponse("Forbidden", { status: 403 });
      return NextResponse.next();
    }

    // Admin-only APIs
    if (pathname.startsWith("/api/admin/")) {
      if (!apiToken) return new NextResponse("Unauthorized", { status: 401 });
      if (!isAdminRole(apiRole))
        return new NextResponse("Forbidden", { status: 403 });
      return NextResponse.next();
    }

    // Seeker-only APIs (apply, bookmark)
    const seekerOnly =
      pathname.startsWith("/api/jobs/apply") ||
      (pathname.startsWith("/api/job/") && pathname.endsWith("/apply")) ||
      pathname.startsWith("/api/jobs/bookmark");
    if (seekerOnly) {
      if (!apiToken) return new NextResponse("Unauthorized", { status: 401 });
      if (!isJobSeekerRole(apiRole))
        return new NextResponse("Forbidden", { status: 403 });
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/:path*"],
};
