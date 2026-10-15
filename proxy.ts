import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/report', '/workspace', '/business', '/settings', '/admin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('sb-access-token')?.value

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Only redirect if there's no cookie at all
  // Don't redirect auth pages — the pages themselves handle invalid tokens
  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/report', '/report/:path*', '/workspace', '/workspace/:path*', '/business', '/business/:path*', '/settings', '/admin', '/login', '/signup'],
}
