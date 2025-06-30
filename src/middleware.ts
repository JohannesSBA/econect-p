// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// NOTE: this must match your NEXTAUTH_SECRET in your environment
const secret = process.env.NEXTAUTH_SECRET

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1) Skip Next.js internals, static assets, API routes, favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // 2) Redirect root → /en
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', req.url))
  }

  // 3) Extract locale (en, am, om)
  const localeMatch = pathname.match(/^\/(en|am|om)(\/|$)/)
  if (!localeMatch) {
    // not a localized route, let it pass
    return NextResponse.next()
  }
  const lang = localeMatch[1]
  // First segment after `/{lang}/`
  const afterLocale = pathname.slice(lang.length + 2).split('/')[0]

  // 4) Only protect these pages—i.e. ones in your `(protected)` folder
  const protectedRoutes = ['dashboard', 'profile', 'settings']

  if (protectedRoutes.includes(afterLocale)) {
    // 5) Try to read & verify the NextAuth JWT
    const token = await getToken({ req, secret })
    if (!token) {
      // if no valid token, redirect to login
      return NextResponse.redirect(new URL(`/${lang}/auth/login`, req.url))
    }
  }

  // otherwise, continue
  return NextResponse.next()
}

export const config = {
  // run this middleware on all routes (including `/`), 
  // it will early-return for assets & API
  matcher: ['/', '/:path*'],
}
