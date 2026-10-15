/**
 * TaxFlow UK Ingestion Engine - Universal Bank CSV Normalizer
 * Ingests raw CSV exports from Monzo, Starling, Barclays, NatWest, Lloyds, HSBC, Revolut,
 * normalizes dates, converts all amounts to exact integer pence, sanitizes descriptions,
 * categorizes rows, and performs cryptographic deduplication.
 */

import { createHash } from 'node:crypto';
import { parseCsv } from './csv_parser.ts';
import type { ParsedCsv } from './csv_parser.ts';
import { detectDialect } from './bank_dialects.ts';
import type { DialectFieldMapping } from './bank_dialects.ts';
import { categorizeTransaction } from './categorizer.ts';
import type {
  BankDialect,
  NormalizedTransaction,
  NormalizationResult
} from './types.ts';

/**
 * Strips currency symbols, thousands separators, and converts decimal string to integer pence.
 */
export function parsePence(valueStr: string | undefined): number {
  if (!valueStr || typeof valueStr !== 'string') return 0;

  let cleaned = valueStr.trim();
  if (cleaned.length === 0) return 0;

  // Handle accounting parentheses negative e.g. (150.00)
  let isNegative = false;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    isNegative = true;
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  } else if (cleaned.endsWith('-')) {
    isNegative = true;
    cleaned = cleaned.substring(0, cleaned.length - 1).trim();
  } else if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.substring(1).trim();
  }

  // Strip currency symbols, spaces, commas
  cleaned = cleaned.replace(/[£$€,\s]/g, '');

  if (cleaned.length === 0) return 0;

  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;

  const pence = Math.round(num * 100);
  return isNegative ? -pence : pence;
}

/**
 * Normalizes variable bank date formats into standard ISO YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // Pattern: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Pattern: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const ukMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (ukMatch) {
    const day = ukMatch[1].padStart(2, '0');
    const month = ukMatch[2].padStart(2, '0');
    let year = ukMatch[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

/**
 * Sanitizes descriptions by stripping masked card numbers, excessive whitespace, and reference codes.
 */
export function sanitizeDescription(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/(?:\*{3,}|\.{3,})\s*\d{4}/g, '') // Masked card digits
    .replace(/\b(?:CARD\s*\d{4}|AUTH\s*\d+)\b/gi, '')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Creates SHA-256 fingerprint for deduplication
 */
export function computeRowHash(date: string, amountPence: number, description: string): string {
  return createHash('sha256')
    .update(`${date}|${amountPence}|${description.toLowerCase()}`)
    .digest('hex');
}

/**
 * Finds the starting line index of the table header by scanning for recognized header names.
 */
export function findHeaderRowIndex(rawLines: string[]): number {
  for (let i = 0; i < Math.min(rawLines.length, 15); i++) {
    const line = rawLines[i].toLowerCase();
    if (
      (line.includes('date') && line.includes('amount')) ||
      (line.includes('date') && line.includes('balance')) ||
      (line.includes('date') && line.includes('paid out')) ||
      (line.includes('date') && line.includes('debit')) ||
      (line.includes('date') && line.includes('counter party'))
    ) {
      return i;
    }
  }
  return 0;
}

export function normalizeBankCsv(
  csvContent: string,
  options?: { companyId?: string; existingHashes?: Set<string> }
): NormalizationResult {
  const rawLines = csvContent.split(/\r?\n/);
  const headerIdx = findHeaderRowIndex(rawLines);
  const cleanCsvContent = rawLines.slice(headerIdx).join('\n');

  const parsed: ParsedCsv = parseCsv(cleanCsvContent);
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    return {
      sourceBank: 'GENERIC',
      totalRowsProcessed: 0,
      importedTransactions: [],
      skippedRows: 0,
      duplicateRows: 0,
      totalInflowPence: 0,
      totalOutflowPence: 0,
      netCashFlowPence: 0,
      disallowableTotalPence: 0,
      capitalAssetTotalPence: 0
    };
  }

  const dialectMapping = detectDialect(parsed.headers);
  const existingHashes = options?.existingHashes || new Set<string>();
  const seenInBatch = new Set<string>();

  const imported: NormalizedTransaction[] = [];
  let duplicateCount = 0;
  let skippedCount = 0;
  let totalInflow = 0;
  let totalOutflow = 0;
  let disallowableTotal = 0;
  let capitalAssetTotal = 0;

  // Header index lookup (case-insensitive)
  const headerLower = parsed.headers.map((h) => h.toLowerCase());
  const getColIndex = (name?: string) => {
    if (!name) return -1;
    return headerLower.findIndex((h) => h.includes(name.toLowerCase()));
  };

  const dateIdx = getColIndex(dialectMapping.dateColumn);
  const descIdx = getColIndex(dialectMapping.descriptionColumn);
  const secondaryDescIdx = getColIndex(dialectMapping.secondaryDescriptionColumn);
  const amountIdx = getColIndex(dialectMapping.amountColumn);
  const inflowIdx = getColIndex(dialectMapping.inflowColumn);
  const outflowIdx = getColIndex(dialectMapping.outflowColumn);
  const feeIdx = getColIndex(dialectMapping.feeColumn);

  for (let rowIndex = 0; rowIndex < parsed.rows.length; rowIndex++) {
    const row = parsed.rows[rowIndex];
    if (row.length === 0 || row.every((c) => c.trim().length === 0)) {
      skippedCount++;
      continue;
    }

    const rawDate = dateIdx >= 0 ? row[dateIdx] : row[0];
    const normalizedDate = normalizeDate(rawDate);
    if (!normalizedDate) {
      skippedCount++;
      continue;
    }

    // Combine primary and secondary descriptions
    const primaryDesc = descIdx >= 0 ? row[descIdx] : '';
    const secondaryDesc = secondaryDescIdx >= 0 ? row[secondaryDescIdx] : '';
    const rawDescription = [primaryDesc, secondaryDesc].filter(Boolean).join(' - ') || 'Transaction';
    const cleanDesc = sanitizeDescription(rawDescription);

    // Calculate signed pence
    let amountPence = 0;
    if (amountIdx >= 0 && row[amountIdx] && row[amountIdx].trim().length > 0) {
      amountPence = parsePence(row[amountIdx]);
    } else if (inflowIdx >= 0 || outflowIdx >= 0) {
      const inPence = inflowIdx >= 0 ? Math.abs(parsePence(row[inflowIdx])) : 0;
      const outPence = outflowIdx >= 0 ? Math.abs(parsePence(row[outflowIdx])) : 0;
      amountPence = inPence - outPence;
    }

    // Handle bank fee if applicable (e.g. Revolut)
    if (feeIdx >= 0 && row[feeIdx]) {
      const feePence = Math.abs(parsePence(row[feeIdx]));
      if (feePence > 0) {
        amountPence -= feePence;
      }
    }

    if (amountPence === 0 && (!row[inflowIdx] && !row[outflowIdx] && !row[amountIdx])) {
      skippedCount++;
      continue;
    }

    // Deduplication check
    const rowHash = computeRowHash(normalizedDate, amountPence, cleanDesc);
    if (existingHashes.has(rowHash) || seenInBatch.has(rowHash)) {
      duplicateCount++;
      continue;
    }
    seenInBatch.add(rowHash);

    // Categorization
    const catResult = categorizeTransaction(cleanDesc, amountPence);

    if (amountPence > 0) {
      totalInflow += amountPence;
    } else {
      totalOutflow += Math.abs(amountPence);
    }

    if (catResult.isDisallowable) {
      disallowableTotal += Math.abs(amountPence);
    }
    if (catResult.isCapitalAsset) {
      capitalAssetTotal += Math.abs(amountPence);
    }

    imported.push({
      id: `tx_${rowHash.substring(0, 16)}`,
      companyId: options?.companyId,
      sourceBank: dialectMapping.dialect,
      transactionDate: normalizedDate,
      rawDescription,
      cleanDescription: cleanDesc,
      amountPence,
      categoryBucket: catResult.bucket,
      isDisallowable: catResult.isDisallowable,
      isCapitalAsset: catResult.isCapitalAsset,
      rawRowHash: rowHash
    });
  }

  return {
    sourceBank: dialectMapping.dialect,
    totalRowsProcessed: parsed.rows.length,
    importedTransactions: imported,
    skippedRows: skippedCount,
    duplicateRows: duplicateCount,
    totalInflowPence: totalInflow,
    totalOutflowPence: totalOutflow,
    netCashFlowPence: totalInflow - totalOutflow,
    disallowableTotalPence: disallowableTotal,
    capitalAssetTotalPence: capitalAssetTotal
  };
}
