import type { DateRange, Pence } from './types.ts';
import { daysInclusive, addDays } from './dates.ts';

/**
 * Statutory change date for Main Pool Writing Down Allowance (WDA):
 * Reduced from 18% to 14% effective 1 April 2026.
 */
export const MAIN_WDA_CHANGE_DATE = '2026-04-01';

/**
 * Computes the exact hybrid main-pool WDA rate for an accounting period straddling 1 April 2026.
 * The rate is day-weighted: (daysBefore * 18 + daysAfter * 14) / totalDays.
 * (CAA 2001 s56).
 */
export function mainPoolWdaRatePct(period: DateRange): number {
  const totalDays = daysInclusive(period.start, period.end);
  if (period.end < MAIN_WDA_CHANGE_DATE) {
    return 18;
  }
  if (period.start >= MAIN_WDA_CHANGE_DATE) {
    return 14;
  }
  const beforeDays = daysInclusive(period.start, addDays(MAIN_WDA_CHANGE_DATE, -1));
  const afterDays = totalDays - beforeDays;
  return (beforeDays * 18 + afterDays * 14) / totalDays;
}

/**
 * Apportions an integer pence monetary amount across split accounting periods by inclusive day count.
 * Guaranteed to conserve every single integer penny with zero rounding drift (remainder pence assigned to last period).
 */
export function apportionByDays(totalPence: Pence, periods: DateRange[]): Pence[] {
  if (periods.length === 0) return [];
  const daysList = periods.map((p) => daysInclusive(p.start, p.end));
  const totalDays = daysList.reduce((acc, d) => acc + d, 0);

  const parts = daysList.map((d) => Math.floor((totalPence * d) / totalDays));
  const allocated = parts.reduce((acc, p) => acc + p, 0);
  const remainder = totalPence - allocated;

  // Remainder pence assigned to the final period
  const lastIndex = parts.length - 1;
  if (lastIndex >= 0 && parts[lastIndex] !== undefined) {
    parts[lastIndex] += remainder;
  }

  return parts;
}
