import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'vizpilot_session';

const PROTECTED_PREFIXES = [
  '/upload',
  '/analysis',
  '/recommendation',
  '/visualize',
  '/dashboard',
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(sessionCookie && sessionCookie.trim().length > 0);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Unauthenticated user trying to access a protected route -> redirect to login with next param
  if (isProtected && !isAuthenticated) {
    const originalDestination = `${pathname}${search}`;
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', originalDestination);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/upload',
    '/upload/:path*',
    '/analysis',
    '/analysis/:path*',
    '/recommendation',
    '/recommendation/:path*',
    '/visualize',
    '/visualize/:path*',
    '/dashboard',
    '/dashboard/:path*',
  ],
};
