/**
 * TaxFlow UK - Corporation Tax Engine Types
 * All money amounts represent integer pence.
 */

export type Pence = number;

export interface DateRange {
  start: string; // ISO YYYY-MM-DD
  end: string;   // ISO YYYY-MM-DD
}

export interface RateTable {
  smallProfitsLimitPence: Pence;  // e.g. £50,000.00 = 50_000_00
  upperLimitPence: Pence;         // e.g. £250,000.00 = 250_000_00
  smallRateNum: number;           // 19
  smallRateDen: number;           // 100
  mainRateNum: number;            // 25
  mainRateDen: number;            // 100
  marginalFractionNum: number;    // 3
  marginalFractionDen: number;    // 200
}

export interface DirectorLoan {
  id: string;
  madeOn: string;                 // ISO YYYY-MM-DD
  outstandingAtDueDatePence: Pence;
}

export interface PeriodInput {
  period: DateRange;
  daysInYearBasis: 365 | 366;
  associatedCompanies: number;
  tradingProfitAfterAllowancesPence: Pence; // negative indicates trading loss
  nonTradingIncomePence: Pence;            // e.g. bank interest; must be excluded from trading profit
  exemptDistributionsPence: Pence;         // franked investment income for augmented profits
  tradingLossesBroughtForwardPence: Pence; // post-1 April 2017 losses
  setOffCurrentLossAgainstOtherProfits: boolean;
  closeCompany: boolean;
  directorLoans: DirectorLoan[];
}

export interface S455Line {
  loanId: string;
  ratePct: number;
  taxPence: Pence;
}

export interface PeriodResult {
  days: number;
  lowerLimitPence: number;
  upperLimitPence: number;
  totalTaxableProfitsPence: Pence;
  augmentedProfitsPence: Pence;
  ctBeforeReliefPence: Pence;
  marginalReliefPence: Pence;
  corporationTaxPence: Pence;
  s455TaxPence: Pence;
  s455Lines: S455Line[];
  lossesCarriedForwardPence: Pence;
  warnings: string[];
}

