import type { PeriodInput, PeriodResult, RateTable, Pence, S455Line } from './types.ts';
import { daysInclusive } from './dates.ts';
import { RATES_FY2023_ONWARDS, s455RatePct } from './rates.ts';

const roundToPence = (value: number): Pence => Math.round(value);

/**
 * Computes Corporation Tax and s455 liabilities for a single accounting period.
 * All monetary amounts are integer pence.
 */
export function computePeriod(
  input: PeriodInput,
  rates: RateTable = RATES_FY2023_ONWARDS
): PeriodResult {
  const warnings: string[] = [];

  // Enforce integer pence on all monetary inputs
  for (const val of [
    input.tradingProfitAfterAllowancesPence,
    input.nonTradingIncomePence,
    input.exemptDistributionsPence,
    input.tradingLossesBroughtForwardPence,
  ]) {
    if (!Number.isSafeInteger(val)) {
      throw new Error(`Monetary value must be a safe integer representing pence: received ${val}`);
    }
  }

  if (input.associatedCompanies < 0 || !Number.isInteger(input.associatedCompanies)) {
    throw new Error(`Invalid associated companies count (N): ${input.associatedCompanies}`);
  }

  const days = daysInclusive(input.period.start, input.period.end);
  if (days > 366) {
    throw new Error(`Accounting period exceeds statutory 12-month limit (${days} days). Split the period first.`);
  }

  // 1. Loss Relief & Total Taxable Profits (TTP)
  let tradingProfit = input.tradingProfitAfterAllowancesPence;
  let lossCarriedForward = input.tradingLossesBroughtForwardPence;
  let otherIncome = input.nonTradingIncomePence;

  if (tradingProfit < 0) {
    const currentLoss = -tradingProfit;
    if (input.setOffCurrentLossAgainstOtherProfits && otherIncome > 0) {
      const utilisedAgainstOther = Math.min(currentLoss, otherIncome);
      otherIncome -= utilisedAgainstOther;
      lossCarriedForward += currentLoss - utilisedAgainstOther;
    } else {
      lossCarriedForward += currentLoss;
    }
    tradingProfit = 0;
  }

  let totalTaxableProfits = tradingProfit + otherIncome;

  // Offset brought-forward trading losses against total taxable profits
  const usedBroughtForward = Math.min(input.tradingLossesBroughtForwardPence, totalTaxableProfits);
  totalTaxableProfits -= usedBroughtForward;
  lossCarriedForward -= usedBroughtForward;

  if (lossCarriedForward > 5_000_000_00) {
    warnings.push('Trading losses exceed the £5M deductions allowance: corporate restriction not modelled, route to specialist review.');
  }

  const augmentedProfits = totalTaxableProfits + input.exemptDistributionsPence;

  // 2. Thresholds: Scaled for period length, then divided by (N + 1)
  const periodScale = Math.min(1, days / input.daysInYearBasis);
  const associatedDivisor = input.associatedCompanies + 1;
  const lowerLimit = (rates.smallProfitsLimitPence * periodScale) / associatedDivisor;
  const upperLimit = (rates.upperLimitPence * periodScale) / associatedDivisor;

  // 3. Tax Calculation with Statutory Marginal Relief
  let ctBeforeRelief = 0;
  let marginalRelief = 0;
  let corporationTax = 0;

  if (totalTaxableProfits > 0) {
    if (augmentedProfits <= lowerLimit) {
      // Small Profits Rate (19%)
      corporationTax = roundToPence((totalTaxableProfits * rates.smallRateNum) / rates.smallRateDen);
      ctBeforeRelief = corporationTax;
    } else if (augmentedProfits >= upperLimit) {
      // Main Rate (25%)
      corporationTax = roundToPence((totalTaxableProfits * rates.mainRateNum) / rates.mainRateDen);
      ctBeforeRelief = corporationTax;
    } else {
      // Marginal Relief Band
      ctBeforeRelief = roundToPence((totalTaxableProfits * rates.mainRateNum) / rates.mainRateDen);
      marginalRelief = roundToPence(
        (rates.marginalFractionNum * (upperLimit - augmentedProfits) * totalTaxableProfits) /
          (rates.marginalFractionDen * augmentedProfits)
      );
      corporationTax = ctBeforeRelief - marginalRelief;
    }
  }

  // 4. Section 455 Tax on Loans to Participators (Loan-by-Loan Dating)
  const s455Lines: S455Line[] = [];
  let s455Tax = 0;

  if (input.directorLoans.length > 0 && !input.closeCompany) {
    warnings.push('s455 tax applies to close companies only: no charge computed for non-close company.');
  } else {
    for (const loan of input.directorLoans) {
      if (!Number.isSafeInteger(loan.outstandingAtDueDatePence) || loan.outstandingAtDueDatePence < 0) {
        throw new Error(`Director loan balance must be a non-negative integer in pence: loan ${loan.id}`);
      }
      const rate = s455RatePct(loan.madeOn);
      const tax = roundToPence((loan.outstandingAtDueDatePence * rate) / 100);
      s455Lines.push({
        loanId: loan.id,
        ratePct: rate,
        taxPence: tax,
      });
      s455Tax += tax;
    }
  }

  return {
    days,
    lowerLimitPence: lowerLimit,
    upperLimitPence: upperLimit,
    totalTaxableProfitsPence: totalTaxableProfits,
    augmentedProfitsPence: augmentedProfits,
    ctBeforeReliefPence: ctBeforeRelief,
    marginalReliefPence: marginalRelief,
    corporationTaxPence: corporationTax,
    s455TaxPence: s455Tax,
    s455Lines,
    lossesCarriedForwardPence: lossCarriedForward,
    warnings,
  };
}
