import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 * In Reviewer Mode, authentication gating is disabled so that reviewers,
 * stakeholders, and external inspectors can access all dashboards, wizards,
 * audit engines, and document studios directly without login barriers.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/filings/:path*', '/admin', '/admin/:path*']
};
