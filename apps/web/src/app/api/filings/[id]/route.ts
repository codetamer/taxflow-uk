import { NextRequest, NextResponse } from 'next/server';
import { getRepositories } from '@taxflow/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const filing = repos.filings.getById(id);

    if (!filing) {
      return NextResponse.json(
        { success: false, error: `Filing with ID ${id} not found` },
        { status: 404 }
      );
    }

    const company = repos.companies.getById(filing.companyId);
    const auditLogs = repos.auditLogs.listByFiling(id);

    return NextResponse.json({
      success: true,
      filing: {
        ...filing,
        company,
        auditLogs
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
    const repos = getRepositories();

    const existing = repos.filings.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Filing with ID ${id} not found` },
        { status: 404 }
      );
    }

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

    // Audit log
    const action = body.auditAction || 'FILING_UPDATED';
    repos.auditLogs.append(id, action, body.auditDetails || { updatedFields: Object.keys(updatePayload) });

    return NextResponse.json({
      success: true,
      filing: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update filing' },
      { status: 500 }
    );
  }
}
