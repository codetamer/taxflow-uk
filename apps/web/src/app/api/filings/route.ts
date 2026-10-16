import { NextRequest, NextResponse } from 'next/server';
import { getRepositories } from '@taxflow/db';
import { MOCK_REVIEW_FILING } from '@/lib/mockFiling';
import { isReviewerMode } from '@/lib/reviewerMode';

export async function GET() {
  try {
    const repos = getRepositories();
    const filings = repos.filings.listAll();
    const companies = repos.companies.list();

    if (filings.length === 0) {
      if (isReviewerMode()) {
        return NextResponse.json({
          success: true,
          filings: [MOCK_REVIEW_FILING]
        });
      }
      return NextResponse.json({
        success: true,
        filings: []
      });
    }

    const companyMap = new Map(companies.map((c) => [c.id, c]));
    const enriched = filings.map((f) => ({
      ...f,
      company: companyMap.get(f.companyId) || (isReviewerMode() ? MOCK_REVIEW_FILING.company : null)
    }));

    return NextResponse.json({
      success: true,
      filings: enriched
    });
  } catch (err: any) {
    if (isReviewerMode()) {
      return NextResponse.json({
        success: true,
        filings: [MOCK_REVIEW_FILING]
      });
    }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list filings' },
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

    try {
      const repos = getRepositories();
      const companyRecord = repos.companies.upsert({
        crn: company.crn,
        name: company.name,
        utr: company.utr,
        registeredAddress: company.registeredAddress || 'Registered Office in England & Wales',
        companyType: company.companyType || 'ltd',
        isCloseCompany: company.isCloseCompany !== false
      });

      const filing = repos.filings.create({
        companyId: companyRecord.id,
        periodStart: period?.startDate || '2025-05-01',
        periodEnd: period?.endDate || '2026-04-30',
        directorName: directorName || company.directorName || 'Director',
        status: 'DRAFT',
        trialBalanceJson: body.trialBalance ? JSON.stringify(body.trialBalance) : undefined,
        taxAdjustmentsJson: body.taxAdjustments ? JSON.stringify(body.taxAdjustments) : undefined
      });

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
    } catch (dbErr: any) {
      if (isReviewerMode()) {
        const mockId = `fil_${Date.now()}`;
        return NextResponse.json({
          success: true,
          filing: {
            id: mockId,
            companyId: `co_${company.crn}`,
            periodStart: period?.startDate || '2025-10-01',
            periodEnd: period?.endDate || '2026-09-30',
            directorName: directorName || 'Muhammad Saif Raza',
            status: 'DRAFT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          company: {
            id: `co_${company.crn}`,
            crn: company.crn,
            name: company.name,
            registeredAddress: company.registeredAddress || 'Registered Office in England & Wales',
            companyType: 'ltd',
            isCloseCompany: true
          }
        });
      }
      throw dbErr;
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create filing' },
      { status: 500 }
    );
  }
}
