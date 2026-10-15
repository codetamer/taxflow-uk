import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('taxflow_session')?.value;

  // Protected route prefixes
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/filings') ||
    pathname.startsWith('/admin');

  // Allow static assets and api endpoints through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

  // If visiting protected route without active session cookie, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/filings/:path*', '/admin', '/admin/:path*']
};
