import type { RateTable } from './types.ts';

/**
 * Corporation Tax rate table for FY2023 onward.
 * Small profits limit: £50,000 (50_000_00 pence)
 * Upper limit: £250,000 (250_000_00 pence)
 * Small profits rate: 19%
 * Main rate: 25%
 * Marginal fraction: 3/200 (CTA 2010 s18F)
 */
export const RATES_FY2023_ONWARDS: RateTable = {
  smallProfitsLimitPence: 50_000_00,
  upperLimitPence: 250_000_00,
  smallRateNum: 19,
  smallRateDen: 100,
  mainRateNum: 25,
  mainRateDen: 100,
  marginalFractionNum: 3,
  marginalFractionDen: 200,
};

/**
 * Statutory s455 rate bands.
 * The s455 rate follows the dividend upper rate for the UK tax year in which the LOAN WAS MADE.
 * (CTA 2010 s455).
 */
export const S455_RATE_BANDS: readonly { readonly from: string; readonly ratePct: number }[] = [
  { from: '0000-01-01', ratePct: 25 },
  { from: '2016-04-06', ratePct: 32.5 },
  { from: '2022-04-06', ratePct: 33.75 },
  { from: '2026-04-06', ratePct: 35.75 },
] as const;

/**
 * Returns the exact statutory s455 tax percentage for an individual loan advance based on its creation date.
 */
export function s455RatePct(loanMadeOn: string): number {
  let rate = S455_RATE_BANDS[0]?.ratePct ?? 25;
  for (const band of S455_RATE_BANDS) {
    if (loanMadeOn >= band.from) {
      rate = band.ratePct;
    }
  }
  return rate;
}
