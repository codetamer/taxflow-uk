import type { Pence, DirectorLoan } from '../../ct-engine/src/types.ts';

export type RuleSeverity = 'FATAL' | 'WARN';
export type RuleStatus = 'PASS' | 'FAIL';

export interface RuleEvaluation {
  id: string; // e.g. "RULE_01"
  name: string;
  category: string;
  severity: RuleSeverity;
  status: RuleStatus;
  message: string;
  remediation?: string;
  offendingFields?: string[];
}

export type CompanyType = 'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED_INCOME';

export interface EntityData {
  crn: string;
  companyName: string;
  companyType: CompanyType;
  utr?: string;
  isCloseCompany: boolean;
  isCharityOrPlc: boolean;
  chAuthCode?: string;
  gatewayUserId?: string;
  gatewayPassword?: string;
}

export interface PeriodData {
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  daysInYearBasis: 365 | 366;
  priorPeriodEnd?: string;
  paymentDueDate?: string;
  accountsApprovalDate?: string;
  directorDeclarationName?: string;
  isDirectorApproved: boolean;
  currentDate?: string; // for deadline checks
}

export interface LedgerData {
  // Profit and Loss
  turnoverPence: Pence;
  costOfSalesPence: Pence;
  staffCostsPence: Pence;
  depreciationPence: Pence;
  otherChargesPence: Pence;
  clientEntertainingPence: Pence;
  finesPence: Pence;
  bankInterestPence: Pence;
  taxExpensePence: Pence;
  netProfitAfterTaxPence: Pence;
  dividendsPaidPence: Pence;
  openingRetainedEarningsPence: Pence;
  closingRetainedEarningsPence: Pence;

  // Balance Sheet
  fixedAssetsPence: Pence;
  debtorsPence: Pence;
  cashPence: Pence;
  creditorsUnderOneYearPence: Pence;
  creditorsOverOneYearPence: Pence;
  provisionsPence: Pence;
  shareCapitalPence: Pence;
  employeeCount: number;

  // Debits and Credits (for Trial Balance imports)
  totalDebitsPence?: Pence;
  totalCreditsPence?: Pence;
}

export interface TaxComputationData {
  tradingProfitPence: Pence;
  nonTradingIncomePence: Pence;
  exemptDistributionsPence: Pence;
  ttpPence: Pence;
  augmentedProfitsPence: Pence;
  lowerLimitPence: Pence;
  upperLimitPence: Pence;
  ctBeforeReliefPence: Pence;
  marginalReliefPence: Pence;
  ctPayablePence: Pence;
  
  // Capital allowances specifics
  mainPoolWdaRatePct: number;
  carAiaClaimedPence: Pence;
  zeroEmissionFyaClaimedPence: Pence;
  zeroEmissionPurchaseDate?: string;

  // s455 Loans
  directorLoans: DirectorLoan[];
  s455TaxPence: Pence;
}

export interface ShieldInput {
  entity: EntityData;
  period: PeriodData;
  ledger: LedgerData;
  tax: TaxComputationData;
}

export interface ShieldReport {
  passed: boolean; // true if 0 fatal failures
  totalRulesEvaluated: number;
  passedCount: number;
  fatalFailureCount: number;
  warningCount: number;
  evaluations: RuleEvaluation[];
}
