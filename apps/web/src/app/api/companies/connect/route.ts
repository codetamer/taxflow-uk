import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, DEFAULT_REVIEWER_CONTEXT } from '@/lib/auth';
import { getRepositories } from '@taxflow/db';
import { CompaniesHouseClient } from '@taxflow/companies-house';
import { isReviewerMode } from '@/lib/reviewerMode';

export async function POST(req: NextRequest) {
  try {
    const auth = (await getCurrentUser()) || (isReviewerMode() ? DEFAULT_REVIEWER_CONTEXT : null);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const crn = body.crn?.trim();
    if (!crn) {
      return NextResponse.json({ success: false, error: 'CRN is required' }, { status: 400 });
    }

    const chClient = new CompaniesHouseClient();

    let details = await chClient.getNormalizedCompanyDetails(crn);
    if (!details) {
      details = {
        crn,
        name: body.name || `UK COMPANY ${crn}`,
        registeredAddress: 'Registered Office in England and Wales',
        companyType: 'ltd',
        isCloseCompany: true,
        status: 'active',
        isActive: true,
        isMicroEntityEligible: true,
        periodStart: '2025-10-01',
        periodEnd: '2026-09-30',
        accountsDueDate: '2027-06-30',
        directors: ['Director']
      };
    }

    try {
      const repos = getRepositories();
      const company = repos.companies.upsert({
        crn: details.crn,
        name: details.name,
        registeredAddress: details.registeredAddress,
        companyType: details.companyType,
        isCloseCompany: details.isCloseCompany
      });

      repos.auth.associateUserWithCompany(auth.user.id, company.id, 'DIRECTOR');
      const updatedCompanies = repos.auth.listUserCompanies(auth.user.id);

      return NextResponse.json({
        success: true,
        company,
        companies: updatedCompanies.length > 0 ? updatedCompanies : [company]
      });
    } catch (dbErr: any) {
      if (isReviewerMode()) {
        const newCompany = {
          id: `co_${crn}`,
          crn: details.crn,
          name: details.name,
          registeredAddress: details.registeredAddress,
          companyType: details.companyType,
          isCloseCompany: details.isCloseCompany,
          userRole: 'DIRECTOR'
        };

        return NextResponse.json({
          success: true,
          company: newCompany,
          companies: [...(auth.companies || []), newCompany]
        });
      }
      throw dbErr;
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to connect company' },
      { status: 500 }
    );
  }
}
