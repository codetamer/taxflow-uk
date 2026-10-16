import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isReviewerMode } from './lib/reviewerMode';

export function middleware(request: NextRequest) {
  // If Reviewer Mode is active (default), bypass authentication gating
  if (isReviewerMode()) {
    return NextResponse.next();
  }

  // Strict Mode: enforce session authentication
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('taxflow_session')?.value;

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/filings') ||
    pathname.startsWith('/admin');

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

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
