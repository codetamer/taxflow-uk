import type { DateRange } from './types.ts';

const MS_DAY = 86_400_000;

/** Parse ISO YYYY-MM-DD into a UTC Date object (no local timezone offsets). */
export const parseUtcDate = (iso: string): Date => {
  const parts = iso.split('-').map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(Date.UTC(y, m - 1, d));
};

/** Format Date object as ISO YYYY-MM-DD. */
export const formatIsoDate = (dt: Date): string => dt.toISOString().slice(0, 10);

/** Add n calendar days to an ISO date. */
export const addDays = (iso: string, n: number): string =>
  formatIsoDate(new Date(parseUtcDate(iso).getTime() + n * MS_DAY));

/** Inclusive calendar day count between start and end (both ends inclusive). */
export function daysInclusive(start: string, end: string): number {
  return Math.round((parseUtcDate(end).getTime() - parseUtcDate(start).getTime()) / MS_DAY) + 1;
}

/**
 * Corresponding-date month addition; clamps to month-end when the day does not exist.
 * E.g., 31 May + 9 months -> 28 Feb (or 29 Feb in leap year).
 */
export function addMonths(iso: string, months: number): string {
  const d = parseUtcDate(iso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const day = d.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return formatIsoDate(new Date(Date.UTC(y, m, Math.min(day, lastDayOfTargetMonth))));
}

/**
 * Splits a company's period of accounts into statutory Corporation Tax accounting periods.
 * Under CTA 2009 s9, a CT accounting period cannot exceed 12 months.
 * An extended period (e.g. 15 Mar 2025 .. 31 Mar 2026) is split into a 12-month period plus the remainder.
 */
export function splitIntoAccountingPeriods(start: string, end: string): DateRange[] {
  const periods: DateRange[] = [];
  let cursor = start;
  while (cursor <= end) {
    const twelveMonthEnd = addDays(addMonths(cursor, 12), -1);
    const apEnd = twelveMonthEnd < end ? twelveMonthEnd : end;
    periods.push({ start: cursor, end: apEnd });
    cursor = addDays(apEnd, 1);
  }
  return periods;
}

/**
 * Statutory Corporation Tax payment due date: exactly 9 months and 1 day after the accounting period end.
 * (TMA 1970 s59D).
 */
export const ctPaymentDueDate = (apEnd: string): string => addDays(addMonths(apEnd, 9), 1);
