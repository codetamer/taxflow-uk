import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        fullName: auth.user.fullName,
        role: auth.user.role
      },
      companies: auth.companies
    });
  } catch (err: any) {
    return NextResponse.json(
      { authenticated: false, error: err.message || 'Auth check error' },
      { status: 500 }
    );
  }
}
