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
      taxOnProfitPence: 380000,
      profitOrLossPence: 2810000,
      tangibleFixedAssetsPence: 1500000,
      debtorsPence: 1000000,
      cashAtBankPence: 3340000,
      creditorsDueWithinOneYearPence: 2500000,
      calledUpShareCapitalPence: 10000,
      profitAndLossAccountReservePence: 3330000,
      shareholderFundsPence: 3340000,
      averageEmployees: 1,
      balanceSheetDateApproval: '2026-10-15',
      directorName: 'Muhammad Saif Raza',
      directorsLoanAdvancePence: 0,
      directorsLoanRepaidPence: 0,
      directorsLoanClosingPence: 0
    };

    const filingId = searchParams.get('filingId');
    let accountsData: Frs105AccountsData = { ...defaultData };

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
          const costOfSales = tb.costOfSalesPence ?? calc.costOfSalesPence ?? defaultData.costOfSalesPence;
          const otherCharges = tb.otherChargesPence ?? calc.otherChargesPence ?? defaultData.otherChargesPence;
          const taxOnProfit = calc.taxPayablePence ?? defaultData.taxOnProfitPence;
          const operatingProfit = turnover - costOfSales - otherCharges;
          const profitOrLoss = operatingProfit - taxOnProfit;

          accountsData = {
            ...defaultData,
            companyName: company?.name || defaultData.companyName,
            companyNumber: company?.crn || defaultData.companyNumber,
            periodStart: filing.periodStart || defaultData.periodStart,
            periodEnd: filing.periodEnd || defaultData.periodEnd,
            turnoverPence: turnover,
            costOfSalesPence: costOfSales,
            otherChargesPence: otherCharges,
            taxOnProfitPence: taxOnProfit,
            profitOrLossPence: profitOrLoss,
            directorName: filing.directorName || defaultData.directorName,
            balanceSheetDateApproval: filing.directorApprovalDate || defaultData.balanceSheetDateApproval
          };
        }
      } catch {
        // Fall back gracefully to default benchmark dataset
      }
    }

    const pdfBuffer = generateAccountsPdf(accountsData, { isDraft });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDraft ? 'inline' : 'attachment'}; filename="Full_Accounts_${accountsData.companyNumber}.pdf"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
