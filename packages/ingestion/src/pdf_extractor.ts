/**
 * TaxFlow UK Ingestion Engine - Enterprise PDF Extractor
 * Extracts and parses bank statements, trial balances, and financial summaries from PDFs
 * with multi-bank dialect detection, date normalization, and exact integer pence arithmetic.
 */

import { extractText } from 'unpdf';
import { createHash } from 'node:crypto';
import { parsePence, normalizeDate, sanitizeDescription } from './bank_normalizer.ts';
import { categorizeTransaction } from './categorizer.ts';
import { mapNominalAccount } from './trial_balance.ts';
import {
  AccountingBucket,
  type BankDialect,
  type NormalizedTransaction,
  type NormalizationResult,
  type TrialBalanceLine,
  type TrialBalanceParseResult
} from './types.ts';

/**
 * Universal PDF Ingestion Result
 */
export type PdfIngestionResult =
  | {
      type: 'bank_statement';
      detectedBank: BankDialect;
      pageCount: number;
      result: NormalizationResult;
    }
  | {
      type: 'trial_balance';
      pageCount: number;
      result: TrialBalanceParseResult;
    };

/**
 * Extracts raw text lines from a PDF Buffer or Uint8Array
 */
export async function extractPdfLines(pdfBuffer: Buffer | Uint8Array): Promise<{ lines: string[]; totalPages: number }> {
  const uint8 = pdfBuffer instanceof Uint8Array && pdfBuffer.constructor.name === 'Uint8Array'
    ? pdfBuffer
    : new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
  const { text, totalPages } = await extractText(uint8);
  const fullText = Array.isArray(text) ? text.join('\n') : text;

  const lines = fullText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return { lines, totalPages };
}

/**
 * Detects whether the extracted PDF lines represent a Trial Balance or a Bank Statement
 */
export function detectPdfDocumentType(lines: string[]): 'trial_balance' | 'bank_statement' {
  const sample = lines.slice(0, 40).join(' ').toLowerCase();

  const isTb =
    (sample.includes('trial balance') || sample.includes('nominal ledger') || sample.includes('chart of accounts')) &&
    sample.includes('debit') &&
    sample.includes('credit');

  if (isTb) return 'trial_balance';

  // Count lines that look like nominal ledger vs bank transactions
  let tbScore = 0;
  let bankScore = 0;

  for (const line of lines.slice(0, 30)) {
    const l = line.toLowerCase();
    if (l.includes('trial balance') || l.includes('debit') || l.includes('credit') || l.includes('net profit')) {
      tbScore += 2;
    }
    if (
      l.includes('bank') ||
      l.includes('account statement') ||
      l.includes('transaction') ||
      l.includes('sort code') ||
      l.includes('balance brought forward')
    ) {
      bankScore += 2;
    }
  }

  return tbScore > bankScore ? 'trial_balance' : 'bank_statement';
}

/**
 * Detects the bank dialect from text content
 */
export function detectBankFromText(text: string): BankDialect {
  const lower = text.toLowerCase();
  if (lower.includes('monzo')) return 'MONZO';
  if (lower.includes('starling')) return 'STARLING';
  if (lower.includes('revolut')) return 'REVOLUT';
  if (lower.includes('barclays')) return 'BARCLAYS';
  if (lower.includes('lloyds')) return 'LLOYDS';
  if (lower.includes('natwest')) return 'NATWEST';
  if (lower.includes('hsbc')) return 'HSBC';

  return 'GENERIC';
}

/**
 * Parses Bank Statement PDF lines into NormalizationResult
 */
export function parseBankStatementLines(lines: string[], detectedBank: BankDialect): NormalizationResult {
  const importedTransactions: NormalizedTransaction[] = [];
  const seenFingerprints = new Set<string>();
  let duplicateRows = 0;
  let skippedRows = 0;

  // Date regex patterns
  const dateRegex =
    /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i;

  // Money pattern: e.g. -£150.00, £1,234.56, -45.00, 100.00 CR, (50.00), (£50.00)
  const moneyRegex =
    /(?:[-+]?\s*[£$€]?\s*[-+]?\d{1,3}(?:,\d{3})*(?:\.\d{2})(?:\s*(?:CR|DR))?|\(\s*[£$€]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})\s*\)|[£$€]?\s*\(\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})\s*\))/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains a valid transaction date
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) {
      skippedRows++;
      continue;
    }

    const rawDate = dateMatch[0];
    const normalizedDate = normalizeDate(rawDate);
    if (!normalizedDate || normalizedDate.length < 8) {
      skippedRows++;
      continue;
    }

    // Find all monetary figures on this line
    const moneyMatches = line.match(moneyRegex);
    if (!moneyMatches || moneyMatches.length === 0) {
      skippedRows++;
      continue;
    }

    const validAmounts: number[] = [];
    for (const m of moneyMatches) {
      const pence = parsePence(m);
      if (pence !== 0) {
        validAmounts.push(pence);
      }
    }

    if (validAmounts.length === 0) {
      skippedRows++;
      continue;
    }

    let amountPence = 0;
    const lowerLine = line.toLowerCase();

    if (validAmounts.length === 1) {
      amountPence = validAmounts[0];
      if (lowerLine.includes('cr') || lowerLine.includes('credit') || lowerLine.includes('deposit') || lowerLine.includes('received')) {
        amountPence = Math.abs(amountPence);
      } else if (lowerLine.includes('dr') || lowerLine.includes('debit') || lowerLine.includes('paid out') || lowerLine.includes('charge')) {
        amountPence = -Math.abs(amountPence);
      }
    } else if (validAmounts.length === 2) {
      amountPence = validAmounts[0];
      if (lowerLine.includes('cr') || lowerLine.includes('credit')) {
        amountPence = Math.abs(amountPence);
      } else if (lowerLine.includes('dr') || lowerLine.includes('debit') || lowerLine.includes('fee')) {
        amountPence = -Math.abs(amountPence);
      }
    } else {
      const paidOut = validAmounts[0];
      const paidIn = validAmounts[1];
      if (paidIn > 0) {
        amountPence = paidIn;
      } else if (paidOut > 0) {
        amountPence = -paidOut;
      } else {
        amountPence = validAmounts[0];
      }
    }

    // Extract description
    let desc = line;
    desc = desc.replace(rawDate, '');
    for (const m of moneyMatches) {
      desc = desc.replace(m, '');
    }
    desc = sanitizeDescription(desc);

    if (desc.length < 2 && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (!nextLine.match(dateRegex)) {
        desc = sanitizeDescription(nextLine);
      }
    }

    if (desc.length === 0) {
      desc = 'Bank Transaction';
    }

    // Categorize
    const categoryResult = categorizeTransaction(desc, amountPence);

    // Fingerprint for deduplication
    const rawFingerprintString = `${normalizedDate}|${amountPence}|${desc.toUpperCase()}`;
    const rawRowHash = createHash('sha256').update(rawFingerprintString).digest('hex');

    if (seenFingerprints.has(rawRowHash)) {
      duplicateRows++;
      continue;
    }
    seenFingerprints.add(rawRowHash);

    const isDisallowable = categoryResult.isDisallowable ?? false;
    const isCapitalAsset = categoryResult.isCapitalAsset ?? false;

    importedTransactions.push({
      id: rawRowHash.substring(0, 16),
      sourceBank: detectedBank,
      transactionDate: normalizedDate,
      rawDescription: line,
      cleanDescription: desc,
      amountPence,
      categoryBucket: categoryResult.bucket,
      isDisallowable,
      isCapitalAsset,
      rawRowHash
    });
  }

  // Summary aggregation
  let totalInflowPence = 0;
  let totalOutflowPence = 0;
  let disallowableTotalPence = 0;
  let capitalAssetTotalPence = 0;

  for (const t of importedTransactions) {
    if (t.amountPence > 0) {
      totalInflowPence += t.amountPence;
    } else {
      totalOutflowPence += Math.abs(t.amountPence);
    }

    if (t.isDisallowable) {
      disallowableTotalPence += Math.abs(t.amountPence);
    }
    if (t.isCapitalAsset) {
      capitalAssetTotalPence += Math.abs(t.amountPence);
    }
  }

  return {
    sourceBank: detectedBank,
    totalRowsProcessed: lines.length,
    importedTransactions,
    skippedRows,
    duplicateRows,
    totalInflowPence,
    totalOutflowPence,
    netCashFlowPence: totalInflowPence - totalOutflowPence,
    disallowableTotalPence,
    capitalAssetTotalPence
  };
}

/**
 * Parses Trial Balance PDF lines into TrialBalanceParseResult
 */
export function parseTrialBalancePdfLines(lines: string[]): TrialBalanceParseResult {
  const resultLines: TrialBalanceLine[] = [];
  const moneyMatcher =
    /(?:[-+]?\s*[£$€]?\s*[-+]?\d{1,3}(?:,\d{3})*(?:\.\d{2})(?:\s*(?:CR|DR))?|\(\s*[£$€]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})\s*\)|[£$€]?\s*\(\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})\s*\))/gi;

  let totalDebitsPence = 0;
  let totalCreditsPence = 0;

  for (const line of lines) {
    const l = line.trim();
    if (
      l.toLowerCase().includes('total') ||
      l.toLowerCase().includes('page') ||
      l.toLowerCase().includes('report date') ||
      l.toLowerCase().includes('account name')
    ) {
      continue;
    }

    const matches = l.match(moneyMatcher);
    if (!matches || matches.length < 1) continue;

    let debitPence = 0;
    let creditPence = 0;

    if (matches.length >= 2) {
      debitPence = parsePence(matches[matches.length - 2]);
      creditPence = parsePence(matches[matches.length - 1]);
    } else {
      const val = parsePence(matches[0]);
      if (l.toLowerCase().includes('cr') || l.toLowerCase().includes('credit')) {
        creditPence = Math.abs(val);
      } else {
        debitPence = Math.abs(val);
      }
    }

    let remainder = l;
    for (const m of matches) {
      remainder = remainder.replace(m, '');
    }
    remainder = remainder.trim();

    const codeMatch = remainder.match(/^(\d{3,5})\s+(.*)$/);
    let accountCode = '';
    let accountName = remainder;

    if (codeMatch) {
      accountCode = codeMatch[1];
      accountName = codeMatch[2].trim();
    }

    if (accountName.length < 2) continue;

    const { bucket, isDisallowable } = mapNominalAccount(accountCode, accountName);

    const tbLine: TrialBalanceLine = {
      accountCode,
      accountName,
      debitPence,
      creditPence,
      mappedBucket: bucket,
      isDisallowable
    };

    resultLines.push(tbLine);
    totalDebitsPence += debitPence;
    totalCreditsPence += creditPence;
  }

  const variancePence = totalDebitsPence - totalCreditsPence;
  const isBalanced = variancePence === 0;

  let turnover = 0;
  let costOfSales = 0;
  let otherCharges = 0;
  let disallowables = 0;
  let tangibleFixedAssets = 0;
  let cashAtBank = 0;
  let directorLoan = 0;
  let dividendsPaid = 0;
  let shareCapital = 0;

  for (const r of resultLines) {
    const net = r.debitPence - r.creditPence;
    if (r.isDisallowable) {
      disallowables += r.debitPence;
    }

    switch (r.mappedBucket) {
      case AccountingBucket.TURNOVER:
        turnover += r.creditPence - r.debitPence;
        break;
      case AccountingBucket.COST_OF_SALES:
        costOfSales += net;
        break;
      case AccountingBucket.TANGIBLE_FIXED_ASSETS:
        tangibleFixedAssets += net;
        break;
      case AccountingBucket.CASH_AT_BANK:
        cashAtBank += net;
        break;
      case AccountingBucket.DIRECTOR_LOAN_ACCOUNT:
        directorLoan += net;
        break;
      case AccountingBucket.DIVIDENDS_PAID:
        dividendsPaid += net;
        break;
      case AccountingBucket.CALLED_UP_SHARE_CAPITAL:
        shareCapital += r.creditPence - r.debitPence;
        break;
      case AccountingBucket.DEBTORS:
      case AccountingBucket.CREDITORS:
      case AccountingBucket.RETAINED_EARNINGS:
        break;
      default:
        otherCharges += net;
        break;
    }
  }

  const netOperatingProfitBeforeTaxPence = turnover - costOfSales - otherCharges;

  return {
    lines: resultLines,
    totalDebitsPence,
    totalCreditsPence,
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

/**
 * Universal Entrypoint: Parses any financial PDF document into structured ingestion data
 */
export async function ingestFinancialPdf(
  pdfBuffer: Buffer | Uint8Array,
  forcedMode?: 'bank' | 'trial_balance'
): Promise<PdfIngestionResult> {
  const { lines, totalPages } = await extractPdfLines(pdfBuffer);
  const fullText = lines.join(' ');
  const mode = forcedMode || (detectPdfDocumentType(lines) === 'trial_balance' ? 'trial_balance' : 'bank');

  if (mode === 'trial_balance') {
    const result = parseTrialBalancePdfLines(lines);
    return {
      type: 'trial_balance',
      pageCount: totalPages,
      result
    };
  }

  const detectedBank = detectBankFromText(fullText);
  const result = parseBankStatementLines(lines, detectedBank);

  return {
    type: 'bank_statement',
    detectedBank,
    pageCount: totalPages,
    result
  };
}
