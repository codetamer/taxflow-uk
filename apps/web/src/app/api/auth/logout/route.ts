import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRepositories } from '@taxflow/db';
import { SESSION_COOKIE_NAME, clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const repos = getRepositories();
      repos.auth.deleteSession(token);
    }

    const res = NextResponse.json({ success: true });
    clearSessionCookie(res);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Logout failed' },
      { status: 500 }
    );
  }
}

