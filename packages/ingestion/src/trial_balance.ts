/**
 * TaxFlow UK Ingestion Engine - Trial Balance Parser & FRS 105 Aggregator
 * Strictly validates that Total Debits == Total Credits to the exact penny,
 * maps nominal ledger codes to FRS 105 micro-entity buckets, and flags variances.
 */

import { parseCsv } from './csv_parser.ts';
import { parsePence } from './bank_normalizer.ts';
import { AccountingBucket } from './types.ts';
import type {
  TrialBalanceLine,
  TrialBalanceParseResult
} from './types.ts';

/**
 * Maps standard UK nominal account codes or account names to FRS 105 buckets
 */
export function mapNominalAccount(
  accountCode: string,
  accountName: string
): { bucket: AccountingBucket; isDisallowable: boolean } {
  const code = accountCode.trim();
  const name = accountName.toLowerCase();

  // 1. By Account Name Matching (Specific takes precedence)
  if (name.includes('entertaining') || name.includes('hospitality')) {
    return { bucket: AccountingBucket.CLIENT_ENTERTAINING, isDisallowable: true };
  }
  if (name.includes('fine') || name.includes('penalty')) {
    return { bucket: AccountingBucket.FINES_PENALTIES, isDisallowable: true };
  }
  if (name.includes('debtor') || name.includes('receivable')) {
    return { bucket: AccountingBucket.DEBTORS, isDisallowable: false };
  }
  if (name.includes('creditor') || name.includes('payable') || name.includes('accrual')) {
    return { bucket: AccountingBucket.CREDITORS, isDisallowable: false };
  }
  if (name.includes('retained earnings') || name.includes('brought forward') || name.includes('reserve')) {
    return { bucket: AccountingBucket.RETAINED_EARNINGS, isDisallowable: false };
  }
  if (name.includes('share capital') || name.includes('ordinary shares')) {
    return { bucket: AccountingBucket.CALLED_UP_SHARE_CAPITAL, isDisallowable: false };
  }
  if (name.includes('dividend')) {
    return { bucket: AccountingBucket.DIVIDENDS_PAID, isDisallowable: false };
  }
  if (name.includes('fixed asset') || name.includes('equipment') || name.includes('hardware')) {
    return { bucket: AccountingBucket.TANGIBLE_FIXED_ASSETS, isDisallowable: false };
  }
  if (name.includes('director') && (name.includes('loan') || name.includes('drawings') || name.includes('current account'))) {
    return { bucket: AccountingBucket.DIRECTOR_LOAN_ACCOUNT, isDisallowable: false };
  }
  if (name.includes('bank') || name.includes('cash')) {
    return { bucket: AccountingBucket.CASH_AT_BANK, isDisallowable: false };
  }
  if (name.includes('cost of sales') || name.includes('direct cost') || name.includes('materials')) {
    return { bucket: AccountingBucket.COST_OF_SALES, isDisallowable: false };
  }
  if (name.includes('turnover') || name.includes('revenue') || name.includes('sales')) {
    return { bucket: AccountingBucket.TURNOVER, isDisallowable: false };
  }

  // 2. By Nominal Code Ranges (Standard UK Chart of Accounts convention)
  const numCode = parseInt(code, 10);
  if (!isNaN(numCode)) {
    if (numCode >= 1000 && numCode < 2000) {
      return { bucket: AccountingBucket.TURNOVER, isDisallowable: false };
    }
    if (numCode >= 2000 && numCode < 3000) {
      return { bucket: AccountingBucket.COST_OF_SALES, isDisallowable: false };
    }
    if (numCode === 3100) {
      return { bucket: AccountingBucket.CLIENT_ENTERTAINING, isDisallowable: true };
    }
    if (numCode === 3110) {
      return { bucket: AccountingBucket.FINES_PENALTIES, isDisallowable: true };
    }
    if (numCode >= 3000 && numCode < 4000) {
      return { bucket: AccountingBucket.ADMINISTRATIVE_EXPENSES, isDisallowable: false };
    }
    if (numCode >= 4000 && numCode < 5000) {
      return { bucket: AccountingBucket.TANGIBLE_FIXED_ASSETS, isDisallowable: false };
    }
    if (numCode >= 5000 && numCode < 5100) {
      return { bucket: AccountingBucket.DIRECTOR_LOAN_ACCOUNT, isDisallowable: false };
    }
    if (numCode >= 5100 && numCode < 6000) {
      return { bucket: AccountingBucket.DEBTORS, isDisallowable: false };
    }
    if (numCode >= 6000 && numCode < 6500) {
      return { bucket: AccountingBucket.CASH_AT_BANK, isDisallowable: false };
    }
    if (numCode >= 6500 && numCode < 7000) {
      return { bucket: AccountingBucket.CREDITORS, isDisallowable: false };
    }
    if (numCode >= 7000 && numCode < 8000) {
      return { bucket: AccountingBucket.DIVIDENDS_PAID, isDisallowable: false };
    }
    if (numCode >= 8000 && numCode < 9000) {
      return { bucket: AccountingBucket.INTEREST_INCOME, isDisallowable: false };
    }
    if (numCode >= 9000 && numCode < 9100) {
      return { bucket: AccountingBucket.CALLED_UP_SHARE_CAPITAL, isDisallowable: false };
    }
    if (numCode >= 9100 && numCode < 10000) {
      return { bucket: AccountingBucket.RETAINED_EARNINGS, isDisallowable: false };
    }
  }

  return { bucket: AccountingBucket.ADMINISTRATIVE_EXPENSES, isDisallowable: false };
}

export function parseTrialBalanceCsv(csvContent: string): TrialBalanceParseResult {
  const parsed = parseCsv(csvContent);
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    return {
      lines: [],
      totalDebitsPence: 0,
      totalCreditsPence: 0,
      variancePence: 0,
      isBalanced: true,
      frs105Summary: {
        turnoverPence: 0,
        costOfSalesPence: 0,
        otherChargesPence: 0,
        disallowablesPence: 0,
        netOperatingProfitBeforeTaxPence: 0,
        tangibleFixedAssetsPence: 0,
        cashAtBankPence: 0,
        directorLoanPence: 0,
        dividendsPaidPence: 0,
        shareCapitalPence: 0
      }
    };
  }

  const headerLower = parsed.headers.map((h) => h.toLowerCase());
  const codeIdx = headerLower.findIndex((h) => h.includes('code') || h.includes('nominal'));
  let nameIdx = headerLower.findIndex((h) => h.includes('name') || h.includes('description') || h.includes('title'));
  if (nameIdx === -1) {
    nameIdx = headerLower.findIndex((h, idx) => idx !== codeIdx && h.includes('account'));
  }
  const debitIdx = headerLower.findIndex((h) => h.includes('debit'));
  const creditIdx = headerLower.findIndex((h) => h.includes('credit'));

  const lines: TrialBalanceLine[] = [];
  let totalDebits = 0;
  let totalCredits = 0;

  let turnover = 0;
  let costOfSales = 0;
  let otherCharges = 0;
  let disallowables = 0;
  let tangibleFixedAssets = 0;
  let cashAtBank = 0;
  let directorLoan = 0;
  let dividendsPaid = 0;
  let shareCapital = 0;

  for (const row of parsed.rows) {
    if (row.length === 0 || row.every((c) => c.trim().length === 0)) continue;

    const accountCode = codeIdx >= 0 ? row[codeIdx] : '';
    const accountName = nameIdx >= 0 ? row[nameIdx] : (codeIdx === -1 ? row[0] : '');
    const debitPence = debitIdx >= 0 ? Math.abs(parsePence(row[debitIdx])) : 0;
    const creditPence = creditIdx >= 0 ? Math.abs(parsePence(row[creditIdx])) : 0;

    totalDebits += debitPence;
    totalCredits += creditPence;

    const mapping = mapNominalAccount(accountCode, accountName);

    // Aggregate into FRS 105 buckets
    switch (mapping.bucket) {
      case AccountingBucket.TURNOVER:
        turnover += creditPence - debitPence;
        break;
      case AccountingBucket.COST_OF_SALES:
        costOfSales += debitPence - creditPence;
        break;
      case AccountingBucket.CLIENT_ENTERTAINING:
      case AccountingBucket.FINES_PENALTIES:
        disallowables += debitPence - creditPence;
        otherCharges += debitPence - creditPence;
        break;
      case AccountingBucket.ADMINISTRATIVE_EXPENSES:
      case AccountingBucket.STAFF_COSTS:
      case AccountingBucket.RENT_RATES_UTILITIES:
      case AccountingBucket.SOFTWARE_SUBSCRIPTIONS:
      case AccountingBucket.PROFESSIONAL_FEES:
      case AccountingBucket.MARKETING_ADVERTISING:
      case AccountingBucket.BANK_CHARGES:
        otherCharges += debitPence - creditPence;
        break;
      case AccountingBucket.TANGIBLE_FIXED_ASSETS:
        tangibleFixedAssets += debitPence - creditPence;
        break;
      case AccountingBucket.CASH_AT_BANK:
        cashAtBank += debitPence - creditPence;
        break;
      case AccountingBucket.DIRECTOR_LOAN_ACCOUNT:
        directorLoan += debitPence - creditPence; // Positive means overdrawn (director owes company)
        break;
      case AccountingBucket.DIVIDENDS_PAID:
        dividendsPaid += debitPence - creditPence;
        break;
      case AccountingBucket.CALLED_UP_SHARE_CAPITAL:
        shareCapital += creditPence - debitPence;
        break;
      case AccountingBucket.DEBTORS:
      case AccountingBucket.CREDITORS:
      case AccountingBucket.RETAINED_EARNINGS:
        // Balance sheet items handled separately in balance sheet reconciliation
        break;
      default:
        otherCharges += debitPence - creditPence;
        break;
    }

    lines.push({
      accountCode,
      accountName,
      debitPence,
      creditPence,
      mappedBucket: mapping.bucket,
      isDisallowable: mapping.isDisallowable
    });
  }

  const variancePence = totalDebits - totalCredits;
  const isBalanced = variancePence === 0;
  const netOperatingProfitBeforeTaxPence = turnover - costOfSales - otherCharges;

  return {
    lines,
    totalDebitsPence: totalDebits,
    totalCreditsPence: totalCredits,
    variancePence,
    isBalanced,
    frs105Summary: {
      turnoverPence: turnover,
      costOfSalesPence: costOfSales,
      otherChargesPence: otherCharges,
      disallowablesPence: disallowables,
      netOperatingProfitBeforeTaxPence,
      tangibleFixedAssetsPence: tangibleFixedAssets,
      cashAtBankPence: cashAtBank,
      directorLoanPence: directorLoan,
      dividendsPaidPence: dividendsPaid,
      shareCapitalPence: shareCapital
    }
  };
}
