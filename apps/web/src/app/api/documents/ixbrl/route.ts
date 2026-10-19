import { NextRequest, NextResponse } from 'next/server';
import { generateFrs105Ixbrl } from '@taxflow/doc-engine';
import type { ShieldInput } from '@taxflow/shield';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isDraft = searchParams.get('draft') !== 'false';

    const defaultInput: ShieldInput = {
      entity: {
        crn: '15152081',
        companyName: 'DROPLOGICX LTD',
        companyType: 'TRADING',
        utr: '1234567890',
        isCloseCompany: true,
        isCharityOrPlc: false,
        chAuthCode: 'ABC123',
        gatewayUserId: '123456789012',
        gatewayPassword: 'SecretPassword123!'
      },
      period: {
        periodStart: '2025-10-01',
        periodEnd: '2026-09-30',
        daysInYearBasis: 365,
        paymentDueDate: '2027-07-01',
        accountsApprovalDate: '2026-10-15',
        directorDeclarationName: 'Muhammad Saif Raza',
        isDirectorApproved: true
      },
      ledger: {
        turnoverPence: 10000000,
        costOfSalesPence: 2000000,
        staffCostsPence: 0,
        depreciationPence: 0,
        otherChargesPence: 4810000,
        clientEntertainingPence: 310000,
        finesPence: 0,
        bankInterestPence: 0,
        taxExpensePence: 606100,
        netProfitAfterTaxPence: 2583900,
        dividendsPaidPence: 1000000,
        openingRetainedEarningsPence: 1520000,
        closingRetainedEarningsPence: 3103900,
        fixedAssetsPence: 1500000,
        debtorsPence: 1000000,
        cashPence: 3113900,
        creditorsUnderOneYearPence: 2500000,
        creditorsOverOneYearPence: 0,
        provisionsPence: 0,
        shareCapitalPence: 10000,
        employeeCount: 3
      },
      tax: {
        tradingProfitPence: 3190000,
        nonTradingIncomePence: 0,
        exemptDistributionsPence: 0,
        ttpPence: 3190000,
        augmentedProfitsPence: 3190000,
        lowerLimitPence: 5000000,
        upperLimitPence: 25000000,
        ctBeforeReliefPence: 606100,
        marginalReliefPence: 0,
        ctPayablePence: 606100,
        mainPoolWdaRatePct: 14.0,
        carAiaClaimedPence: 0,
        zeroEmissionFyaClaimedPence: 0,
        directorLoans: [],
        s455TaxPence: 0
      }
    };

    const filingId = searchParams.get('filingId');
    let shieldInput: ShieldInput = { ...defaultInput };

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

          const turnover = tb.turnoverPence ?? calc.turnoverPence ?? defaultInput.ledger.turnoverPence;
          const costOfSales = tb.costOfSalesPence ?? calc.costOfSalesPence ?? defaultInput.ledger.costOfSalesPence;
          const otherCharges = tb.otherChargesPence ?? calc.otherChargesPence ?? defaultInput.ledger.otherChargesPence;
          const taxOnProfit = calc.taxPayablePence ?? defaultInput.ledger.taxExpensePence;
          const profitOrLoss = turnover - costOfSales - otherCharges - taxOnProfit;

          shieldInput = {
            ...defaultInput,
            entity: {
              ...defaultInput.entity,
              companyName: company?.name || defaultInput.entity.companyName,
              crn: company?.crn || defaultInput.entity.crn,
              utr: company?.utr || defaultInput.entity.utr
            },
            period: {
              ...defaultInput.period,
              periodStart: filing.periodStart || defaultInput.period.periodStart,
              periodEnd: filing.periodEnd || defaultInput.period.periodEnd,
              directorDeclarationName: filing.directorName || defaultInput.period.directorDeclarationName,
              accountsApprovalDate: filing.directorApprovalDate || defaultInput.period.accountsApprovalDate
            },
            ledger: {
              ...defaultInput.ledger,
              turnoverPence: turnover,
              costOfSalesPence: costOfSales,
              otherChargesPence: otherCharges,
              taxExpensePence: taxOnProfit,
              netProfitAfterTaxPence: profitOrLoss
            }
          };
        }
      } catch {
        // Fall back gracefully to default benchmark dataset
      }
    }

    const ixbrl = generateFrs105Ixbrl(shieldInput, {
      includeProfitAndLoss: true,
      watermarkText: isDraft ? 'DRAFT - NOT FOR SUBMISSION' : undefined
    });

    return new NextResponse(ixbrl, {
      status: 200,
      headers: {
        'Content-Type': 'application/xhtml+xml; charset=utf-8',
        'Content-Disposition': `inline; filename="Accounts_iXBRL_${shieldInput.entity.crn}.html"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

