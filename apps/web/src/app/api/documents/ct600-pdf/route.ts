import { NextRequest, NextResponse } from 'next/server';
import { generateCt600Pdf } from '@taxflow/doc-engine';
import type { Ct600PdfData } from '@taxflow/doc-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isDraft = searchParams.get('draft') !== 'false';

    const defaultData: Ct600PdfData = {
      companyName: 'DROPLOGICX LTD',
      companyNumber: '15152081',
      utr: '1234567890',
      periodStart: '2025-10-01',
      periodEnd: '2026-09-30',
      paymentDueDate: '2027-07-01',
      turnoverPence: 10000000,
      tradingProfitPence: 2990000,
      bankInterestPence: 200000,
      totalTaxableProfitPence: 3190000,
      smallProfitsTaxPence: 606100,
      marginalReliefPence: 0,
      mainRateTaxPence: 0,
      corporationTaxChargeablePence: 606100,
      s455TaxChargePence: 178750,
      totalTaxPayablePence: 784850,
      aiaClaimedPence: 1500000,
      mainPoolWdaPence: 0,
      signatoryName: 'Muhammad Saif Raza',
      signatoryStatus: 'Director',
      declarationDate: '2026-10-15',
      directorLoans: [
        {
          directorName: 'Muhammad Saif Raza',
          advanceDate: '2026-05-01',
          advancePence: 500000,
          repaidPence: 0,
          outstandingPence: 500000,
          s455Rate: 0.3575,
          s455TaxPence: 178750
        }
      ]
    };

    const pdfBuffer = generateCt600Pdf(defaultData, { isDraft });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDraft ? 'inline' : 'attachment'}; filename="HMRC_CT600_${defaultData.utr}.pdf"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
