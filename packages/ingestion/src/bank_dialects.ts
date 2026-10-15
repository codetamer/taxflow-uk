/**
 * TaxFlow UK Ingestion Engine - UK Bank Dialect Definitions
 * Recognizes and normalizes the export dialects of major UK retail and business banks.
 */

import type { BankDialect } from './types.ts';

export interface DialectFieldMapping {
  dialect: BankDialect;
  displayName: string;
  identify: (headers: string[]) => boolean;
  dateColumn: string;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY';
  descriptionColumn: string;
  secondaryDescriptionColumn?: string;
  // Either single signed amount or split inflow/outflow
  amountColumn?: string;
  inflowColumn?: string;
  outflowColumn?: string;
  feeColumn?: string;
}

export const BANK_DIALECTS: DialectFieldMapping[] = [
  {
    dialect: 'MONZO',
    displayName: 'Monzo Bank',
    identify: (headers: string[]) => {
      const lower = headers.map((h) => h.toLowerCase());
      return lower.includes('category') && lower.includes('emoji') && lower.includes('amount');
    },
    dateColumn: 'Date',
    dateFormat: 'YYYY-MM-DD',
    descriptionColumn: 'Name',
    secondaryDescriptionColumn: 'Description',
    amountColumn: 'Amount'
  },
  {
    dialect: 'STARLING',
    displayName: 'Starling Bank',
    identify: (headers: string[]) => {
      const lower = headers.map((h) => h.toLowerCase());
      return lower.some((h) => h.includes('counter party')) && lower.some((h) => h.includes('amount'));
    },
    dateColumn: 'Date',
    dateFormat: 'DD/MM/YYYY',
    descriptionColumn: 'Counter Party',
    secondaryDescriptionColumn: 'Reference',
    amountColumn: 'Amount (GBP)'
  },
  {
    dialect: 'REVOLUT',
    displayName: 'Revolut Business',
    identify: (headers: string[]) => {
      const lower = headers.map((h) => h.toLowerCase());
      return (
        (lower.includes('completed date') || lower.includes('started date')) &&
        lower.includes('fee') &&
        lower.includes('amount')
      );
    },
    dateColumn: 'Completed Date',
    dateFormat: 'YYYY-MM-DD',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    feeColumn: 'Fee'
  },
  {
    dialect: 'LLOYDS',
    displayName: 'Lloyds / Halifax',
    identify: (headers: string[]) => {
      const lower = headers.map((h) => h.toLowerCase());
      return (
        lower.includes('transaction date') &&
        (lower.includes('debit amount') || lower.includes('credit amount'))
      );
    },
    dateColumn: 'Transaction Date',
    dateFormat: 'DD/MM/YYYY',
    descriptionColumn: 'Transaction Description',
    inflowColumn: 'Credit Amount',
    outflowColumn: 'Debit Amount'
  },
  {
    dialect: 'NATWEST',
    displayName: 'NatWest / RBS',
    identify: (headers: string[]) => {
      const lower = headers.map((h) => h.toLowerCase());
      return (
        lower.includes('date') &&
        lower.includes('type') &&
        (lower.includes('paid in') || lower.includes('value')) &&
        (lower.includes('paid out') || lower.includes('balance'))
      );
    },
    dateColumn: 'Date',
    dateFormat: 'DD/MM/YYYY',
    descriptionColumn: 'Description',
    amountColumn: 'Value',
    inflowColumn: 'Paid in',
    outflowColumn: 'Paid out'
  },
  {
    dialect: 'BARCLAYS',
    displayName: 'Barclays Bank',
    identify: (headers: string[]) => {
      const lower = headers.map((h) => h.toLowerCase());
      return (
        lower.includes('date') &&
        (lower.includes('memo') || lower.includes('money in') || lower.includes('subcategory'))
      );
    },
    dateColumn: 'Date',
    dateFormat: 'DD/MM/YYYY',
    descriptionColumn: 'Memo',
    secondaryDescriptionColumn: 'Subcategory',
    amountColumn: 'Amount',
    inflowColumn: 'Money In',
    outflowColumn: 'Money Out'
  },
  {
    dialect: 'HSBC',
    displayName: 'HSBC UK',
    identify: (headers: string[]) => {
      const lower = headers.map((h) => h.toLowerCase());
      return (
        lower.includes('date') &&
        lower.includes('payment type') &&
        (lower.includes('details') || lower.includes('paid out'))
      );
    },
    dateColumn: 'Date',
    dateFormat: 'DD/MM/YYYY',
    descriptionColumn: 'Details',
    inflowColumn: 'Paid In',
    outflowColumn: 'Paid Out',
    amountColumn: 'Amount'
  }
];

/**
 * Fallback generic dialect matcher
 */
export function detectDialect(headers: string[]): DialectFieldMapping {
  for (const dialect of BANK_DIALECTS) {
    if (dialect.identify(headers)) {
      return dialect;
    }
  }

  // Generic fallback
  const lower = headers.map((h) => h.toLowerCase());
  const dateCol = headers[lower.findIndex((h) => h.includes('date'))] || headers[0] || 'Date';
  const descCol =
    headers[lower.findIndex((h) => h.includes('desc') || h.includes('narration') || h.includes('detail') || h.includes('memo') || h.includes('name'))] ||
    headers[1] ||
    'Description';

  const amountIdx = lower.findIndex((h) => h.includes('amount') || h.includes('net') || h.includes('total'));
  const inflowIdx = lower.findIndex((h) => h.includes('credit') || h.includes('in') || h.includes('deposit'));
  const outflowIdx = lower.findIndex((h) => h.includes('debit') || h.includes('out') || h.includes('withdrawal'));

  return {
    dialect: 'GENERIC',
    displayName: 'Standard / Generic CSV',
    identify: () => true,
    dateColumn: dateCol,
    dateFormat: 'DD/MM/YYYY', // default assumption, normalizer tests and auto-detects
    descriptionColumn: descCol,
    amountColumn: amountIdx >= 0 ? headers[amountIdx] : undefined,
    inflowColumn: inflowIdx >= 0 ? headers[inflowIdx] : undefined,
    outflowColumn: outflowIdx >= 0 ? headers[outflowIdx] : undefined
  };
}
