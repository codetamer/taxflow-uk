import { NextResponse } from 'next/server';
import { getCurrentUser, DEFAULT_REVIEWER_CONTEXT } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await getCurrentUser();
    const activeAuth = auth || DEFAULT_REVIEWER_CONTEXT;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: activeAuth.user.id,
        email: activeAuth.user.email,
        fullName: activeAuth.user.fullName,
        role: activeAuth.user.role
      },
      companies: activeAuth.companies
    });
  } catch {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: DEFAULT_REVIEWER_CONTEXT.user.id,
        email: DEFAULT_REVIEWER_CONTEXT.user.email,
        fullName: DEFAULT_REVIEWER_CONTEXT.user.fullName,
        role: DEFAULT_REVIEWER_CONTEXT.user.role
      },
      companies: DEFAULT_REVIEWER_CONTEXT.companies
    });
  }
}
