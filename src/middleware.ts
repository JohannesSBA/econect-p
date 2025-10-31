// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

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
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/en", req.url));
  }

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
  const protectedRoutes = ["dashboard", "profile", "settings"];
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
    const role = (token as unknown as { role: string })?.role as
      | string
      | undefined;
    const allowed =
      role === "EMPLOYER" || role === "ADMIN" || role === "RECRUITER";
    if (!allowed) {
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
    const apiRole = (apiToken as unknown as { role: string })?.role as
      | string
      | undefined;

    // Employer-only APIs
    if (pathname.startsWith("/api/employer/")) {
      if (!apiToken) return new NextResponse("Unauthorized", { status: 401 });
      const allowed =
        apiRole === "EMPLOYER" ||
        apiRole === "ADMIN" ||
        apiRole === "RECRUITER";
      if (!allowed) return new NextResponse("Forbidden", { status: 403 });
      return NextResponse.next();
    }

    // Admin-only APIs
    if (pathname.startsWith("/api/admin/")) {
      if (!apiToken) return new NextResponse("Unauthorized", { status: 401 });
      if (apiRole !== "ADMIN")
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
      if (apiRole !== "JOB_SEEKER")
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
