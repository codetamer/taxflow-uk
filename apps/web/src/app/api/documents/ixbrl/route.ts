import { NextRequest, NextResponse } from 'next/server';
import { generateFrs105Ixbrl } from '@taxflow/doc-engine';
import type { ShieldInput } from '@taxflow/shield';

const toPence = (penceVal: any, poundsVal: any, fallback: number = 0): number => {
  if (penceVal !== undefined && penceVal !== null && !isNaN(Number(penceVal))) {
    return Math.round(Number(penceVal));
  }
  if (poundsVal !== undefined && poundsVal !== null && !isNaN(Number(poundsVal))) {
    return Math.round(Number(poundsVal) * 100);
  }
  return fallback;
};

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
        employeeCount: 1
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

          const archetype = tb.companyType || company?.companyType || 'TRADING';
          const isDormant = archetype === 'DORMANT';
          const isProperty = archetype === 'PROPERTY';

          const shareCapital = toPence(tb.shareCapitalPence, tb.shareCapital, defaultInput.ledger.shareCapitalPence);

          if (isDormant) {
            shieldInput = {
              ...defaultInput,
              entity: {
                ...defaultInput.entity,
                companyName: company?.name || tb.companyName || defaultInput.entity.companyName,
                crn: company?.crn || tb.crn || defaultInput.entity.crn,
                companyType: 'DORMANT',
                utr: company?.utr || tb.utr || defaultInput.entity.utr
              },
              period: {
                ...defaultInput.period,
                periodStart: filing.periodStart || tb.periodStart || defaultInput.period.periodStart,
                periodEnd: filing.periodEnd || tb.periodEnd || defaultInput.period.periodEnd,
                directorDeclarationName: filing.directorName || tb.directorName || defaultInput.period.directorDeclarationName,
                accountsApprovalDate: filing.directorApprovalDate || defaultInput.period.accountsApprovalDate
              },
              ledger: {
                ...defaultInput.ledger,
                turnoverPence: 0,
                costOfSalesPence: 0,
                otherChargesPence: 0,
                taxExpensePence: 0,
                netProfitAfterTaxPence: 0,
                fixedAssetsPence: 0,
                debtorsPence: 0,
                cashPence: shareCapital,
                creditorsUnderOneYearPence: 0,
                shareCapitalPence: shareCapital,
                closingRetainedEarningsPence: 0,
                employeeCount: 0
              }
            };
          } else {
            const turnover = isProperty
              ? toPence(tb.propertyRentalIncomePence, tb.propertyRentalIncome, 3600000)
              : toPence(tb.turnoverPence ?? calc.turnoverPence, tb.turnover, defaultInput.ledger.turnoverPence);
            const costOfSales = isProperty
              ? 0
              : toPence(tb.costOfSalesPence ?? calc.costOfSalesPence, tb.costOfSales, defaultInput.ledger.costOfSalesPence);
            const otherCharges = isProperty
              ? toPence(tb.propertyAllowableExpensesPence, tb.propertyAllowableExpenses, 600000) + toPence(tb.propertyMortgageInterestPence, tb.propertyMortgageInterest, 1200000)
              : toPence(tb.otherChargesPence ?? calc.otherChargesPence, tb.otherCharges, defaultInput.ledger.otherChargesPence);
            const taxOnProfit = calc.taxPayablePence ?? defaultInput.ledger.taxExpensePence;
            const profitOrLoss = turnover - costOfSales - otherCharges - taxOnProfit;

            const fixedAssets = toPence(tb.fixedAssetsPence, tb.fixedAssets, defaultInput.ledger.fixedAssetsPence);
            const debtors = toPence(tb.debtorsPence, tb.debtors, defaultInput.ledger.debtorsPence);
            const cash = toPence(tb.cashPence ?? tb.cashAtBankPence, tb.cashAtBank, defaultInput.ledger.cashPence);
            const creditors = toPence(tb.creditorsUnderOneYearPence, tb.creditorsUnderOneYear, defaultInput.ledger.creditorsUnderOneYearPence);

            shieldInput = {
              ...defaultInput,
              entity: {
                ...defaultInput.entity,
                companyName: company?.name || tb.companyName || defaultInput.entity.companyName,
                crn: company?.crn || tb.crn || defaultInput.entity.crn,
                companyType: isProperty ? 'PROPERTY' : archetype === 'MIXED' ? 'MIXED_INCOME' : 'TRADING',
                utr: company?.utr || tb.utr || defaultInput.entity.utr
              },
              period: {
                ...defaultInput.period,
                periodStart: filing.periodStart || tb.periodStart || defaultInput.period.periodStart,
                periodEnd: filing.periodEnd || tb.periodEnd || defaultInput.period.periodEnd,
                directorDeclarationName: filing.directorName || tb.directorName || defaultInput.period.directorDeclarationName,
                accountsApprovalDate: filing.directorApprovalDate || defaultInput.period.accountsApprovalDate
              },
              ledger: {
                ...defaultInput.ledger,
                turnoverPence: turnover,
                costOfSalesPence: costOfSales,
                otherChargesPence: otherCharges,
                taxExpensePence: taxOnProfit,
                netProfitAfterTaxPence: profitOrLoss,
                fixedAssetsPence: fixedAssets,
                debtorsPence: debtors,
                cashPence: cash,
                creditorsUnderOneYearPence: creditors,
                shareCapitalPence: shareCapital,
                employeeCount: tb.averageEmployees || 1
              }
            };
          }
        }
      } catch {
        // Fall back gracefully to default benchmark dataset
      }
    }

    const ixbrl = generateFrs105Ixbrl(shieldInput, {
      includeProfitAndLoss: shieldInput.entity.companyType !== 'DORMANT',
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
