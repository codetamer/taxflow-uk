import { NextResponse } from 'next/server';
import { getRepositories, verifyPassword } from '@taxflow/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const repos = getRepositories();
    let user = repos.auth.getUserByEmail(email);

    // Auto-seed DropLogicX demo user if requested
    if (!user && email.toLowerCase() === 'saif@droplogicx.com' && password === 'Password123!') {
      user = repos.auth.createUser({
        email: 'saif@droplogicx.com',
        password: 'Password123!',
        fullName: 'Muhammad Saif Raza',
        role: 'USER'
      });
      // Link to DropLogicX Ltd
      const co = repos.companies.upsert({
        crn: '15152081',
        name: 'DROPLOGICX LTD',
        utr: '1234567890',
        registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ'
      });
      repos.auth.associateUserWithCompany(user.id, co.id, 'OWNER');
    }

    // Auto-seed Admin demo user if requested
    if (!user && email.toLowerCase() === 'admin@taxflow.co.uk' && password === 'AdminPass2026!') {
      user = repos.auth.createUser({
        email: 'admin@taxflow.co.uk',
        password: 'AdminPass2026!',
        fullName: 'TaxFlow Administrator',
        role: 'ADMIN'
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address or password.' },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address or password.' },
        { status: 401 }
      );
    }

    const { token } = repos.auth.createSession(user.id, {
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: req.headers.get('x-forwarded-for') || undefined
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });

    setSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal login error' },
      { status: 500 }
    );
  }
}

