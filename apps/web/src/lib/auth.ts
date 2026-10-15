import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getRepositories } from '@taxflow/db';
import type { UserRecord, SessionRecord, CompanyRecord, CompanyRole } from '@taxflow/db';

export const SESSION_COOKIE_NAME = 'taxflow_session';

export interface AuthenticatedContext {
  user: UserRecord;
  session: SessionRecord;
  companies: Array<CompanyRecord & { userRole: CompanyRole }>;
}

/**
 * Retrieves the current authenticated user and their companies from the HTTP-only session cookie.
 */
export async function getCurrentUser(): Promise<AuthenticatedContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const repos = getRepositories();
    const result = repos.auth.validateSession(token);
    if (!result) return null;

    const companies = repos.auth.listUserCompanies(result.user.id);

    return {
      user: result.user,
      session: result.session,
      companies
    };
  } catch {
    return null;
  }
}

/**
 * Configures the HTTP-only session cookie on a NextResponse.
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  const isSecure = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true';
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

/**
 * Clears the session cookie on logout.
 */
export function clearSessionCookie(response: NextResponse): void {
  const isSecure = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true';
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

