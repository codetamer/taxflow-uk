import { NextRequest, NextResponse } from 'next/server';
import {
  computePeriod,
  daysInclusive,
  ctPaymentDueDate
} from '@taxflow/ct-engine';
import type { PeriodInput } from '@taxflow/ct-engine';
import { runPreFlightShield } from '@taxflow/shield';
import type { ShieldInput } from '@taxflow/shield';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Default to DropLogicX benchmark figures if partial input
    const periodStart = body.periodStart || '2025-10-01';
    const periodEnd = body.periodEnd || '2026-09-30';
    const turnoverPence = body.turnoverPence ?? 10000000;
    const costOfSalesPence = body.costOfSalesPence ?? 2000000;
    const otherChargesPence = body.otherChargesPence ?? 4810000;
    const disallowablesPence = body.disallowablesPence ?? 310000;
    const tangibleFixedAssetsPence = body.tangibleFixedAssetsPence ?? 1500000;
    const bankInterestPence = body.bankInterestPence ?? 0;
    const directorLoans = body.directorLoans || [];
    const dividendsPaidPence = body.dividendsPaidPence ?? 1000000;
    const openingRetainedEarningsPence = body.openingRetainedEarningsPence ?? 1520000;

    // Trading profit before tax adjustments
    const grossProfitPence = turnoverPence - costOfSalesPence;
    const operatingProfitPence = grossProfitPence - otherChargesPence;

    // Trading profit for CT = Operating Profit + Disallowables - Capital Allowances
    const aiaPence = tangibleFixedAssetsPence;
    const tradingProfitForCtPence = Math.max(0, operatingProfitPence + disallowablesPence - aiaPence);

    const periodDays = daysInclusive(periodStart, periodEnd);
    const paymentDueDate = ctPaymentDueDate(periodEnd);

    const ctInput: PeriodInput = {
      period: { start: periodStart, end: periodEnd },
      daysInYearBasis: periodDays > 365 ? 366 : 365,
      associatedCompanies: 0,
      tradingProfitAfterAllowancesPence: tradingProfitForCtPence,
      nonTradingIncomePence: bankInterestPence,
      exemptDistributionsPence: 0,
      tradingLossesBroughtForwardPence: 0,
      setOffCurrentLossAgainstOtherProfits: true,
      closeCompany: true,
      directorLoans: (directorLoans || []).map((l: any, idx: number) => ({
        id: l.id || `loan_${idx}`,
        madeOn: l.advanceDate || l.madeOn || periodStart,
        outstandingAtDueDatePence: l.outstandingPence || l.outstandingAtDueDatePence || 0
      }))
    };

    const ctResult = computePeriod(ctInput);
    const totalS455TaxPence = ctResult.s455TaxPence;

    const netProfitAfterTaxPence = operatingProfitPence - ctResult.corporationTaxPence;
    const closingRetainedEarningsPence = openingRetainedEarningsPence + netProfitAfterTaxPence - dividendsPaidPence;

    // Build Shield Input
    const shieldInput: ShieldInput = {
      entity: {
        crn: body.crn || '15152081',
        companyName: body.companyName || 'DROPLOGICX LTD',
        companyType: 'TRADING',
        utr: body.utr || '1234567890',
        isCloseCompany: true,
        isCharityOrPlc: false,
        chAuthCode: body.chAuthCode || 'ABC123',
        gatewayUserId: body.gatewayUserId || '123456789012',
        gatewayPassword: body.gatewayPassword || 'SecretPassword123!'
      },
      period: {
        periodStart,
        periodEnd,
        daysInYearBasis: periodDays > 365 ? 366 : 365,
        paymentDueDate,
        accountsApprovalDate: body.accountsApprovalDate || '2026-10-15',
        directorDeclarationName: body.directorName || 'Muhammad Saif Raza',
        isDirectorApproved: body.isDirectorApproved ?? true
      },
      ledger: {
        turnoverPence,
        costOfSalesPence,
        staffCostsPence: body.staffCostsPence ?? 0,
        depreciationPence: body.depreciationPence ?? 0,
        otherChargesPence,
        clientEntertainingPence: disallowablesPence,
        finesPence: 0,
        bankInterestPence,
        taxExpensePence: ctResult.corporationTaxPence,
        netProfitAfterTaxPence,
        dividendsPaidPence,
        openingRetainedEarningsPence,
        closingRetainedEarningsPence,
        fixedAssetsPence: tangibleFixedAssetsPence,
        debtorsPence: body.debtorsPence ?? 1000000,
        cashPence: body.cashPence ?? 3113900,
        creditorsUnderOneYearPence: body.creditorsUnderOneYearPence ?? (ctResult.corporationTaxPence + totalS455TaxPence),
        creditorsOverOneYearPence: 0,
        provisionsPence: 0,
        shareCapitalPence: body.shareCapitalPence ?? 10000,
        employeeCount: body.employeeCount ?? 1
      },
      tax: {
        tradingProfitPence: tradingProfitForCtPence,
        nonTradingIncomePence: bankInterestPence,
        exemptDistributionsPence: 0,
        ttpPence: ctResult.totalTaxableProfitsPence,
        augmentedProfitsPence: ctResult.augmentedProfitsPence,
        lowerLimitPence: ctResult.lowerLimitPence,
        upperLimitPence: ctResult.upperLimitPence,
        ctBeforeReliefPence: ctResult.ctBeforeReliefPence,
        marginalReliefPence: ctResult.marginalReliefPence,
        ctPayablePence: ctResult.corporationTaxPence,
        mainPoolWdaRatePct: 14.0,
        carAiaClaimedPence: 0,
        zeroEmissionFyaClaimedPence: 0,
        directorLoans,
        s455TaxPence: totalS455TaxPence
      }
    };

    const shieldReport = runPreFlightShield(shieldInput);

    return NextResponse.json({
      success: true,
      computation: {
        periodDays,
        paymentDueDate,
        grossProfitPence,
        operatingProfitPence,
        tradingProfitForCtPence,
        totalTaxableProfitsPence: ctResult.totalTaxableProfitsPence,
        smallProfitsTaxPence: ctResult.corporationTaxPence,
        marginalReliefPence: ctResult.marginalReliefPence,
        s455TaxPence: totalS455TaxPence,
        totalTaxPayablePence: ctResult.corporationTaxPence + totalS455TaxPence,
        netProfitAfterTaxPence,
        closingRetainedEarningsPence
      },
      shield: shieldReport
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Calculation failed' },
      { status: 500 }
    );
  }
}
