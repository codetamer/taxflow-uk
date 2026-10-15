// TaxFlow UK - reference corporation tax engine (executable specification).
// All money is integer pence. Dates are ISO yyyy-mm-dd, inclusive at both ends.
// Rates and thresholds are DATA (see RATE_TABLES), never constants buried in logic.

export type Pence = number;
export interface DateRange { start: string; end: string }

// ---------- date helpers (UTC, no local-time surprises) ----------
const MS_DAY = 86_400_000;
const parse = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const fmt = (dt: Date): string => dt.toISOString().slice(0, 10);
const addDays = (iso: string, n: number): string => fmt(new Date(parse(iso).getTime() + n * MS_DAY));

/** Inclusive day count: 2025-03-15 .. 2026-03-31 is 382, not 381. */
export function daysInclusive(start: string, end: string): number {
  return Math.round((parse(end).getTime() - parse(start).getTime()) / MS_DAY) + 1;
}

/** Corresponding-date month addition; clamps to month end when the day does not exist. */
export function addMonths(iso: string, months: number): string {
  const d = parse(iso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const day = d.getUTCDate();
  const lastOfTarget = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return fmt(new Date(Date.UTC(y, m, Math.min(day, lastOfTarget))));
}

// ---------- accounting period splitting ----------
/** A period of account longer than 12 months becomes a 12-month CT period plus the remainder. */
export function splitIntoAccountingPeriods(start: string, end: string): DateRange[] {
  const out: DateRange[] = [];
  let cursor = start;
  while (cursor <= end) {
    const twelveMonthEnd = addDays(addMonths(cursor, 12), -1);
    const apEnd = twelveMonthEnd < end ? twelveMonthEnd : end;
    out.push({ start: cursor, end: apEnd });
    cursor = addDays(apEnd, 1);
  }
  return out;
}

/** Statutory payment date: 9 months and 1 day after period end (verify month-end convention, PRD VR-07). */
export const ctPaymentDueDate = (apEnd: string): string => addDays(addMonths(apEnd, 9), 1);

// ---------- versioned rate data ----------
export interface RateTable {
  smallProfitsLimitPence: Pence; // full-year, before associated-company division
  upperLimitPence: Pence;
  smallRateNum: number; smallRateDen: number; // 19/100
  mainRateNum: number; mainRateDen: number;   // 25/100
  marginalFractionNum: number; marginalFractionDen: number; // 3/200
}
export const RATES_FY2023_ONWARDS: RateTable = {
  smallProfitsLimitPence: 50_000_00, upperLimitPence: 250_000_00,
  smallRateNum: 19, smallRateDen: 100, mainRateNum: 25, mainRateDen: 100,
  marginalFractionNum: 3, marginalFractionDen: 200,
};

/** s455 rate follows the dividend upper rate for the tax year in which the LOAN WAS MADE. */
export const S455_RATE_BANDS: { from: string; ratePct: number }[] = [
  { from: '0000-01-01', ratePct: 25 },
  { from: '2016-04-06', ratePct: 32.5 },
  { from: '2022-04-06', ratePct: 33.75 },
  { from: '2026-04-06', ratePct: 35.75 },
];
export function s455RatePct(loanMadeOn: string): number {
  let rate = S455_RATE_BANDS[0].ratePct;
  for (const b of S455_RATE_BANDS) if (loanMadeOn >= b.from) rate = b.ratePct;
  return rate;
}

// ---------- capital allowance parameters that depend on the period ----------
export const MAIN_WDA_CHANGE_DATE = '2026-04-01'; // 18% -> 14% for corporation tax
/** Hybrid main-pool WDA for a period straddling the change date, weighted by days (verify, PRD VR-08). */
export function mainPoolWdaRatePct(p: DateRange): number {
  const total = daysInclusive(p.start, p.end);
  if (p.end < MAIN_WDA_CHANGE_DATE) return 18;
  if (p.start >= MAIN_WDA_CHANGE_DATE) return 14;
  const before = daysInclusive(p.start, addDays(MAIN_WDA_CHANGE_DATE, -1));
  return (before * 18 + (total - before) * 14) / total;
}

// ---------- corporation tax ----------
export interface DirectorLoan { id: string; madeOn: string; outstandingAtDueDatePence: Pence }

export interface PeriodInput {
  period: DateRange;
  daysInYearBasis: 365 | 366;            // limit scaling convention, PRD VR-05
  associatedCompanies: number;           // N, statutory count, not "other companies you own"
  tradingProfitAfterAllowancesPence: Pence; // may be negative (a loss)
  nonTradingIncomePence: Pence;          // e.g. bank interest; must be EXCLUDED from the trading figure
  exemptDistributionsPence: Pence;       // non-group dividends, for augmented profits only
  tradingLossesBroughtForwardPence: Pence; // post-1 April 2017 losses only in v1
  setOffCurrentLossAgainstOtherProfits: boolean;
  closeCompany: boolean;
  directorLoans: DirectorLoan[];
}

export interface PeriodResult {
  days: number;
  lowerLimitPence: number; upperLimitPence: number;
  totalTaxableProfitsPence: Pence;
  augmentedProfitsPence: Pence;
  ctBeforeReliefPence: Pence; marginalReliefPence: Pence; corporationTaxPence: Pence;
  s455TaxPence: Pence; s455Lines: { loanId: string; ratePct: number; taxPence: Pence }[];
  lossesCarriedForwardPence: Pence;
  warnings: string[];
}

const roundP = (x: number): Pence => Math.round(x);

export function computePeriod(i: PeriodInput, rates: RateTable = RATES_FY2023_ONWARDS): PeriodResult {
  const warnings: string[] = [];
  for (const v of [i.tradingProfitAfterAllowancesPence, i.nonTradingIncomePence, i.exemptDistributionsPence,
    i.tradingLossesBroughtForwardPence]) {
    if (!Number.isSafeInteger(v)) throw new Error('Money must be integer pence');
  }
  if (i.associatedCompanies < 0 || !Number.isInteger(i.associatedCompanies)) throw new Error('Invalid N');

  const days = daysInclusive(i.period.start, i.period.end);
  if (days > 366) throw new Error('Accounting period exceeds 12 months: split it first');

  // 1. Losses. Brought-forward losses are never discarded.
  let trading = i.tradingProfitAfterAllowancesPence;
  let lossCF = i.tradingLossesBroughtForwardPence;
  let other = i.nonTradingIncomePence;
  if (trading < 0) {
    const currentLoss = -trading;
    if (i.setOffCurrentLossAgainstOtherProfits && other > 0) {
      const used = Math.min(currentLoss, other);
      other -= used;
      lossCF += currentLoss - used;
    } else {
      lossCF += currentLoss;
    }
    trading = 0;
  }
  let ttp = trading + other;
  // Only brought-forward losses are set against this period's profits; the current-period
  // unrelieved loss is carried forward as well and is never consumed in the same period.
  const usedBroughtForward = Math.min(i.tradingLossesBroughtForwardPence, ttp);
  ttp -= usedBroughtForward;
  lossCF -= usedBroughtForward;
  if (lossCF > 5_000_000_00) warnings.push('Losses exceed the deductions allowance: restriction not modelled, route to manual review');

  const augmented = ttp + i.exemptDistributionsPence;

  // 2. Thresholds: scaled for period length, then divided by (N + 1).
  const scale = Math.min(1, days / i.daysInYearBasis);
  const divisor = i.associatedCompanies + 1;
  const L = (rates.smallProfitsLimitPence * scale) / divisor;
  const U = (rates.upperLimitPence * scale) / divisor;

  // 3. Tax with marginal relief. Computed in exact floats then rounded once.
  let ctBefore = 0, mr = 0, ct = 0;
  if (ttp > 0) {
    if (augmented <= L) {
      ct = roundP((ttp * rates.smallRateNum) / rates.smallRateDen);
      ctBefore = ct;
    } else if (augmented >= U) {
      ct = roundP((ttp * rates.mainRateNum) / rates.mainRateDen);
      ctBefore = ct;
    } else {
      ctBefore = roundP((ttp * rates.mainRateNum) / rates.mainRateDen);
      mr = roundP((rates.marginalFractionNum * (U - augmented) * ttp) / (rates.marginalFractionDen * augmented));
      ct = ctBefore - mr;
    }
  }

  // 4. s455, loan by loan, at the rate for the date each loan was made.
  const s455Lines = [];
  let s455 = 0;
  if (i.directorLoans.length && !i.closeCompany) {
    warnings.push('s455 applies to close companies only: no charge computed');
  } else {
    for (const l of i.directorLoans) {
      const rate = s455RatePct(l.madeOn);
      const tax = roundP((l.outstandingAtDueDatePence * rate) / 100);
      s455Lines.push({ loanId: l.id, ratePct: rate, taxPence: tax });
      s455 += tax;
    }
  }

  return {
    days, lowerLimitPence: L, upperLimitPence: U, totalTaxableProfitsPence: ttp,
    augmentedProfitsPence: augmented, ctBeforeReliefPence: ctBefore, marginalReliefPence: mr,
    corporationTaxPence: ct, s455TaxPence: s455, s455Lines, lossesCarriedForwardPence: lossCF, warnings,
  };
}

// ---------- extended period apportionment ----------
/** Time-apportion a profit figure across the split periods (accounting profit BEFORE tax adjustments). */
export function apportionByDays(totalPence: Pence, periods: DateRange[]): Pence[] {
  const days = periods.map(p => daysInclusive(p.start, p.end));
  const total = days.reduce((a, b) => a + b, 0);
  const parts = days.map(d => Math.floor((totalPence * d) / total));
  parts[parts.length - 1] += totalPence - parts.reduce((a, b) => a + b, 0); // remainder pence to last period
  return parts;
}
