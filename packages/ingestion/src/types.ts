/**
 * TaxFlow UK Ingestion Engine - Types and Data Contracts
 * Strictly typed in integer pence, adhering to FRS 105 Chart of Accounts buckets.
 */

export const AccountingBucket = {
  // Profit & Loss
  TURNOVER: 'TURNOVER',                               // 1000: Sales / Revenue
  COST_OF_SALES: 'COST_OF_SALES',                     // 2000: Direct materials/subcontractors
  STAFF_COSTS: 'STAFF_COSTS',                         // 2100: Director / Employee salaries & PAYE
  ADMINISTRATIVE_EXPENSES: 'ADMINISTRATIVE_EXPENSES', // 3000: General office & operating costs
  RENT_RATES_UTILITIES: 'RENT_RATES_UTILITIES',       // 3010: Premises, heating, electricity
  SOFTWARE_SUBSCRIPTIONS: 'SOFTWARE_SUBSCRIPTIONS',   // 3020: SaaS, Cloud, Tools
  PROFESSIONAL_FEES: 'PROFESSIONAL_FEES',             // 3030: Legal, accountancy, compliance
  MARKETING_ADVERTISING: 'MARKETING_ADVERTISING',     // 3040: Ads, SEO, hosting
  BANK_CHARGES: 'BANK_CHARGES',                       // 3050: Transaction fees, interest paid
  CLIENT_ENTERTAINING: 'CLIENT_ENTERTAINING',         // 3100: Disallowable for CT
  FINES_PENALTIES: 'FINES_PENALTIES',                 // 3110: Disallowable for CT
  INTEREST_INCOME: 'INTEREST_INCOME',                 // 8000: Bank interest received

  // Balance Sheet
  TANGIBLE_FIXED_ASSETS: 'TANGIBLE_FIXED_ASSETS',     // 4000: Computers, equipment (Capital Allowances)
  DIRECTOR_LOAN_ACCOUNT: 'DIRECTOR_LOAN_ACCOUNT',     // 5000: Drawings or funds introduced (s455 risk)
  DEBTORS: 'DEBTORS',                                 // 5100: Trade debtors, prepayments
  CASH_AT_BANK: 'CASH_AT_BANK',                       // 6000: Bank balance
  CREDITORS: 'CREDITORS',                             // 6500: Trade creditors, accruals, tax payable
  DIVIDENDS_PAID: 'DIVIDENDS_PAID',                   // 7000: Post-tax distributions to shareholders
  CALLED_UP_SHARE_CAPITAL: 'CALLED_UP_SHARE_CAPITAL', // 9000: Equity share capital
  RETAINED_EARNINGS: 'RETAINED_EARNINGS',             // 9100: Retained earnings brought forward

  // Unmapped
  UNCATEGORIZED: 'UNCATEGORIZED'                      // 9999: Requires director review
} as const;

export type AccountingBucket = (typeof AccountingBucket)[keyof typeof AccountingBucket];

export type BankDialect =
  | 'MONZO'
  | 'STARLING'
  | 'BARCLAYS'
  | 'NATWEST'
  | 'LLOYDS'
  | 'HSBC'
  | 'REVOLUT'
  | 'GENERIC';

export interface NormalizedTransaction {
  id: string;                      // Deterministic or UUID
  companyId?: string;
  sourceBank: BankDialect;
  transactionDate: string;         // ISO YYYY-MM-DD
  rawDescription: string;
  cleanDescription: string;
  amountPence: number;             // Signed integer pence (+ = Inflow/Credit, - = Outflow/Debit)
  categoryBucket: AccountingBucket;
  isDisallowable: boolean;         // true for Client Entertaining, Fines & Penalties
  isCapitalAsset: boolean;         // true for Tangible Fixed Assets (eligible for AIA)
  rawRowHash: string;              // SHA-256 deduplication fingerprint
}

export interface NormalizationResult {
  sourceBank: BankDialect;
  totalRowsProcessed: number;
  importedTransactions: NormalizedTransaction[];
  skippedRows: number;
  duplicateRows: number;
  totalInflowPence: number;
  totalOutflowPence: number;
  netCashFlowPence: number;
  disallowableTotalPence: number;
  capitalAssetTotalPence: number;
}

export interface BankDialectDefinition {
  dialect: BankDialect;
  name: string;
  headerIdentifiers: string[]; // Key substrings that identify this bank export
  preambleFilter?: (line: string) => boolean; // Identify metadata lines to discard
  dateColumn: string;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'DD-MM-YYYY';
  descriptionColumn: string;
  // Amount handling
  singleAmountColumn?: string;
  inflowColumn?: string;
  outflowColumn?: string;
  feeColumn?: string; // e.g. Revolut
}

export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  debitPence: number;
  creditPence: number;
  mappedBucket: AccountingBucket;
  isDisallowable: boolean;
}

export interface TrialBalanceParseResult {
  lines: TrialBalanceLine[];
  totalDebitsPence: number;
  totalCreditsPence: number;
  variancePence: number;
  isBalanced: boolean;
  frs105Summary: {
    turnoverPence: number;
    costOfSalesPence: number;
    otherChargesPence: number;
    disallowablesPence: number;
    netOperatingProfitBeforeTaxPence: number;
    tangibleFixedAssetsPence: number;
    cashAtBankPence: number;
    directorLoanPence: number;
    dividendsPaidPence: number;
    shareCapitalPence: number;
  };
}
