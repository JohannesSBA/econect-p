// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const secret = process.env.NEXTAUTH_SECRET

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip _next, static, api, favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Root → /en
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', req.url))
  }

  // Must be under /{lang}/...
  const localeMatch = pathname.match(/^\/(en|am|om)(\/|$)/)
  if (!localeMatch) return NextResponse.next()

  const lang = localeMatch[1]
  // segments = ['', lang, ...rest]
  const segments = pathname.split('/')
  const isAuthBase = segments[2] === 'auth'
  const authPage   = segments[3] // e.g. 'login' or 'register'
  const firstAfterLocale = segments[2] // e.g. 'dashboard', 'profile', 'auth', etc.

  // get the NextAuth JWT (or null)
  const token = await getToken({ req, secret })

  // 1) If visiting /{lang}/auth/login or /{lang}/auth/register
  //    and you ARE logged in → send to dashboard
  if (isAuthBase && (authPage === 'login' || authPage === 'register')) {
    if (token) {
      return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
    }
    return NextResponse.next()
  }

  // 2) Protect only these routes
  const protectedRoutes = ['dashboard', 'profile', 'settings']
  if (protectedRoutes.includes(firstAfterLocale)) {
    // if NOT logged in → send to login
    if (!token) {
      return NextResponse.redirect(new URL(`/${lang}/auth/login`, req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/:path*'],
}
