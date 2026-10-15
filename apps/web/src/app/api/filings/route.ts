import { NextRequest, NextResponse } from 'next/server';
import { getRepositories } from '@taxflow/db';

export async function GET() {
  try {
    const repos = getRepositories();
    const filings = repos.filings.listAll();
    const companies = repos.companies.list();

    const companyMap = new Map(companies.map((c) => [c.id, c]));

    const enriched = filings.map((f) => ({
      ...f,
      company: companyMap.get(f.companyId) || null
    }));

    return NextResponse.json({
      success: true,
      filings: enriched
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list filings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, period, directorName } = body;

    if (!company?.crn || !company?.name) {
      return NextResponse.json(
        { success: false, error: 'Company CRN and Name are required' },
        { status: 400 }
      );
    }

    const repos = getRepositories();

    // 1. Upsert Company
    const companyRecord = repos.companies.upsert({
      crn: company.crn,
      name: company.name,
      utr: company.utr,
      registeredAddress: company.registeredAddress || 'Registered Office in England & Wales',
      companyType: company.companyType || 'ltd',
      isCloseCompany: company.isCloseCompany !== false
    });

    // 2. Create Filing
    const filing = repos.filings.create({
      companyId: companyRecord.id,
      periodStart: period?.startDate || '2025-05-01',
      periodEnd: period?.endDate || '2026-04-30',
      directorName: directorName || company.directorName || 'Director',
      status: 'DRAFT',
      trialBalanceJson: body.trialBalance ? JSON.stringify(body.trialBalance) : undefined,
      taxAdjustmentsJson: body.taxAdjustments ? JSON.stringify(body.taxAdjustments) : undefined
    });

    // 3. Log Audit Entry
    repos.auditLogs.append(filing.id, 'FILING_CREATED', {
      crn: company.crn,
      periodStart: filing.periodStart,
      periodEnd: filing.periodEnd
    });

    return NextResponse.json({
      success: true,
      filing,
      company: companyRecord
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create filing' },
      { status: 500 }
    );
  }
}
