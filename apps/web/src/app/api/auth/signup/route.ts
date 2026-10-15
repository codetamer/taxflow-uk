import { NextResponse } from 'next/server';
import { getRepositories } from '@taxflow/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, crn } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Full director name is required.' }, { status: 400 });
    }

    const repos = getRepositories();
    const existing = repos.auth.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Role assignment: special admin domain or default user
    const role = email.toLowerCase().trim() === 'admin@taxflow.co.uk' ? 'ADMIN' : 'USER';

    const user = repos.auth.createUser({
      email,
      password,
      fullName,
      role
    });

    // If initial CRN was passed, associate with user
    if (crn && typeof crn === 'string') {
      const cleanCrn = crn.trim().toUpperCase();
      let company = repos.companies.getByCrn(cleanCrn);
      if (!company) {
        // Create baseline company record
        company = repos.companies.upsert({
          crn: cleanCrn,
          name: `${cleanCrn} LTD`,
          registeredAddress: 'Registered Office Address, United Kingdom'
        });
      }
      repos.auth.associateUserWithCompany(user.id, company.id, 'OWNER');
    }

    // Create session
    const { token, session } = repos.auth.createSession(user.id, {
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
      { success: false, error: err.message || 'Internal registration error' },
      { status: 500 }
    );
  }
}

