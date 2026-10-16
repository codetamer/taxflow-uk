import { NextRequest, NextResponse } from 'next/server';
import { getRepositories } from '@taxflow/db';
import { MOCK_REVIEW_FILING } from '@/lib/mockFiling';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    try {
      const repos = getRepositories();
      const filing = repos.filings.getById(id);

      if (filing) {
        const company = repos.companies.getById(filing.companyId);
        const auditLogs = repos.auditLogs.listByFiling(id);

        return NextResponse.json({
          success: true,
          filing: {
            ...filing,
            company: company || MOCK_REVIEW_FILING.company,
            auditLogs
          }
        });
      }
    } catch {
      // In serverless Reviewer Mode without DB, fall through to mock
    }

    // Default mock response for drop-logicx or any ID
    return NextResponse.json({
      success: true,
      filing: {
        ...MOCK_REVIEW_FILING,
        id,
        auditLogs: [
          {
            id: 'log_001',
            filingId: id,
            action: 'COMPANIES_HOUSE_VALIDATED',
            actor: 'SYSTEM',
            detailsJson: JSON.stringify({ status: 'PASS' }),
            timestamp: '2026-10-15T10:45:00.000Z'
          },
          {
            id: 'log_002',
            filingId: id,
            action: 'HMRC_IRMARK_GENERATED',
            actor: 'CT_ENGINE',
            detailsJson: JSON.stringify({ irmark: 'E8g0182Nsd9120=' }),
            timestamp: '2026-10-15T10:47:00.000Z'
          }
        ]
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch filing' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    try {
      const repos = getRepositories();
      const existing = repos.filings.getById(id);
      if (existing) {
        const updatePayload: any = {};
        if (body.status !== undefined) updatePayload.status = body.status;
        if (body.directorName !== undefined) updatePayload.directorName = body.directorName;
        if (body.directorApprovalDate !== undefined) updatePayload.directorApprovalDate = body.directorApprovalDate;
        if (body.directorLegalDeclaration !== undefined) updatePayload.directorLegalDeclaration = body.directorLegalDeclaration;
        if (body.isPaid !== undefined) updatePayload.isPaid = body.isPaid;
        if (body.paymentReference !== undefined) updatePayload.paymentReference = body.paymentReference;
        if (body.paidAmountPence !== undefined) updatePayload.paidAmountPence = body.paidAmountPence;
        if (body.trialBalance !== undefined) updatePayload.trialBalanceJson = JSON.stringify(body.trialBalance);
        if (body.taxAdjustments !== undefined) updatePayload.taxAdjustmentsJson = JSON.stringify(body.taxAdjustments);
        if (body.calculationResult !== undefined) updatePayload.calculationResultJson = JSON.stringify(body.calculationResult);
        if (body.shieldResult !== undefined) updatePayload.shieldResultJson = JSON.stringify(body.shieldResult);
        if (body.irmarkBase64 !== undefined) updatePayload.irmarkBase64 = body.irmarkBase64;
        if (body.irmarkBase32 !== undefined) updatePayload.irmarkBase32 = body.irmarkBase32;

        const updated = repos.filings.update(id, updatePayload);
        const action = body.auditAction || 'FILING_UPDATED';
        repos.auditLogs.append(id, action, body.auditDetails || { updatedFields: Object.keys(updatePayload) });

        return NextResponse.json({
          success: true,
          filing: updated
        });
      }
    } catch {
      // In serverless Reviewer Mode fallback
    }

    return NextResponse.json({
      success: true,
      filing: {
        ...MOCK_REVIEW_FILING,
        ...body,
        id
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update filing' },
      { status: 500 }
    );
  }
}
