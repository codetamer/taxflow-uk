import { NextRequest, NextResponse } from 'next/server';
import { CompaniesHouseClient } from '@taxflow/companies-house';
import { getRepositories } from '@taxflow/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ crn: string }> }
) {
  try {
    const { crn } = await context.params;

    if (!crn || crn.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Company registration number (CRN) is required' },
        { status: 400 }
      );
    }

    const client = new CompaniesHouseClient();
    const details = await client.getNormalizedCompanyDetails(crn.trim());

    if (!details) {
      return NextResponse.json(
        { success: false, error: `Company with CRN ${crn} not found at Companies House` },
        { status: 404 }
      );
    }

    // Persist/cache company record in SQLite
    const repos = getRepositories();
    const companyRecord = repos.companies.upsert({
      crn: details.crn,
      name: details.name,
      registeredAddress: details.registeredAddress,
      companyType: details.companyType,
      isCloseCompany: details.isCloseCompany
    });

    return NextResponse.json({
      success: true,
      company: details,
      companyRecord
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch company profile' },
      { status: 500 }
    );
  }
}
