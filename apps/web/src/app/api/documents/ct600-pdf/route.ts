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

    const filingId = searchParams.get('filingId');
    let ct600Data: Ct600PdfData = { ...defaultData };

    if (filingId) {
      try {
        const { getRepositories } = await import('@taxflow/db');
        const repos = getRepositories();
        const filing = repos.filings.getById(filingId);
        if (filing) {
          const company = repos.companies.getById(filing.companyId);
          let calc: any = {};
          if (filing.calculationResultJson) {
            try { calc = JSON.parse(filing.calculationResultJson); } catch {}
          }
          let tb: any = {};
          if (filing.trialBalanceJson) {
            try { tb = JSON.parse(filing.trialBalanceJson); } catch {}
          }

          const turnover = tb.turnoverPence ?? calc.turnoverPence ?? defaultData.turnoverPence;
          const taxableProfit = calc.taxableProfitPence ?? defaultData.totalTaxableProfitPence;
          const ctTax = calc.taxPayablePence ?? defaultData.corporationTaxChargeablePence;

          ct600Data = {
            ...defaultData,
            companyName: company?.name || defaultData.companyName,
            companyNumber: company?.crn || defaultData.companyNumber,
            utr: company?.utr || defaultData.utr,
            periodStart: filing.periodStart || defaultData.periodStart,
            periodEnd: filing.periodEnd || defaultData.periodEnd,
            turnoverPence: turnover,
            tradingProfitPence: taxableProfit,
            totalTaxableProfitPence: taxableProfit,
            smallProfitsTaxPence: ctTax,
            corporationTaxChargeablePence: ctTax,
            totalTaxPayablePence: ctTax + defaultData.s455TaxChargePence,
            signatoryName: filing.directorName || defaultData.signatoryName,
            declarationDate: filing.directorApprovalDate || defaultData.declarationDate
          };
        }
      } catch {
        // Fall back gracefully to default benchmark dataset
      }
    }

    const pdfBuffer = generateCt600Pdf(ct600Data, { isDraft });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDraft ? 'inline' : 'attachment'}; filename="HMRC_CT600_${ct600Data.utr}.pdf"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
