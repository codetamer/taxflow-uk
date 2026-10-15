import { NextRequest, NextResponse } from 'next/server';
import { generateAccountsPdf } from '@taxflow/doc-engine';
import type { Frs105AccountsData } from '@taxflow/doc-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isDraft = searchParams.get('draft') !== 'false';

    const defaultData: Frs105AccountsData = {
      companyName: 'DROPLOGICX LTD',
      companyNumber: '15152081',
      periodStart: '2025-10-01',
      periodEnd: '2026-09-30',
      turnoverPence: 10000000,
      costOfSalesPence: 2000000,
      otherChargesPence: 4810000,
      taxOnProfitPence: 606100,
      profitOrLossPence: 2583900,
      tangibleFixedAssetsPence: 1500000,
      debtorsPence: 1000000,
      cashAtBankPence: 3113900,
      creditorsDueWithinOneYearPence: 2500000,
      calledUpShareCapitalPence: 10000,
      profitAndLossAccountReservePence: 3103900,
      shareholderFundsPence: 3113900,
      averageEmployees: 3,
      balanceSheetDateApproval: '2026-10-15',
      directorName: 'Muhammad Saif Raza',
      directorsLoanAdvancePence: 500000
    };

    const pdfBuffer = generateAccountsPdf(defaultData, { isDraft });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDraft ? 'inline' : 'attachment'}; filename="Full_Accounts_${defaultData.companyNumber}.pdf"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
