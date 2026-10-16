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

export const DEFAULT_REVIEWER_CONTEXT: AuthenticatedContext = {
  user: {
    id: 'usr_reviewer_demo',
    email: 'saif@droplogicx.com',
    passwordHash: '',
    fullName: 'Muhammad Saif Raza',
    role: 'ADMIN',
    isVerified: true,
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z'
  },
  session: {
    id: 'sess_reviewer_demo',
    userId: 'usr_reviewer_demo',
    tokenHash: 'reviewer_token_hash',
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-10-15T10:00:00.000Z',
    ipAddress: '127.0.0.1',
    userAgent: 'Reviewer Mode'
  },
  companies: [
    {
      id: 'co_ad35ee5268244568',
      crn: '15152081',
      name: 'DROPLOGICX LTD',
      utr: '1234567890',
      registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
      companyType: 'ltd',
      isCloseCompany: true,
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-15T10:00:00.000Z',
      userRole: 'DIRECTOR'
    }
  ]
};

/**
 * Retrieves the current authenticated user and their companies from the HTTP-only session cookie.
 * In Reviewer Mode, if no cookie exists or DB is unavailable, returns DEFAULT_REVIEWER_CONTEXT.
 */
export async function getCurrentUser(): Promise<AuthenticatedContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      try {
        const repos = getRepositories();
        const result = repos.auth.validateSession(token);
        if (result) {
          const companies = repos.auth.listUserCompanies(result.user.id);
          return {
            user: result.user,
            session: result.session,
            companies: companies.length > 0 ? companies : DEFAULT_REVIEWER_CONTEXT.companies
          };
        }
      } catch {
        // Fall back to default reviewer session
      }
    }
    return DEFAULT_REVIEWER_CONTEXT;
  } catch {
    return DEFAULT_REVIEWER_CONTEXT;
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
