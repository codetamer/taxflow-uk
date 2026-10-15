import assert from 'node:assert/strict';
import {
  daysInclusive, splitIntoAccountingPeriods, ctPaymentDueDate, computePeriod, s455RatePct,
  mainPoolWdaRatePct, apportionByDays,
} from './ct_engine.ts';
import type { PeriodInput } from './ct_engine.ts';

let n = 0;
const t = (name: string, fn: () => void) => { fn(); n++; console.log('ok  ' + name); };
const GBP = (x: number) => Math.round(x * 100);

const base = (o: Partial<PeriodInput>): PeriodInput => ({
  period: { start: '2025-04-01', end: '2026-03-31' }, daysInYearBasis: 365, associatedCompanies: 0,
  tradingProfitAfterAllowancesPence: 0, nonTradingIncomePence: 0, exemptDistributionsPence: 0,
  tradingLossesBroughtForwardPence: 0, setOffCurrentLossAgainstOtherProfits: true,
  closeCompany: true, directorLoans: [], ...o,
});

// ---- dates and splitting ----
t('inclusive day count is 382 for the PRD example', () =>
  assert.equal(daysInclusive('2025-03-15', '2026-03-31'), 382));
t('extended period splits into 365 + 17 days', () => {
  const p = splitIntoAccountingPeriods('2025-03-15', '2026-03-31');
  assert.deepEqual(p, [{ start: '2025-03-15', end: '2026-03-14' }, { start: '2026-03-15', end: '2026-03-31' }]);
  assert.equal(daysInclusive(p[0].start, p[0].end) + daysInclusive(p[1].start, p[1].end), 382);
});
t('leap-year split: 12 months from 1 Mar 2023 ends 29 Feb 2024', () => {
  const p = splitIntoAccountingPeriods('2023-03-01', '2024-03-31');
  assert.equal(p[0].end, '2024-02-29'); assert.equal(p[1].start, '2024-03-01'); assert.equal(p.length, 2);
});
t('12-month period is not split', () =>
  assert.equal(splitIntoAccountingPeriods('2025-04-01', '2026-03-31').length, 1));
t('18-month period splits at 12 months', () => {
  const p = splitIntoAccountingPeriods('2025-01-01', '2026-06-30');
  assert.deepEqual(p.map(x => x.end), ['2025-12-31', '2026-06-30']);
});
t('payment due dates (unambiguous cases)', () => {
  assert.equal(ctPaymentDueDate('2026-03-31'), '2027-01-01');
  assert.equal(ctPaymentDueDate('2025-12-31'), '2026-10-01');
  assert.equal(ctPaymentDueDate('2025-09-30'), '2026-07-01');
});

// ---- core CT maths ----
t('small profits rate: 30,000 -> 5,700', () =>
  assert.equal(computePeriod(base({ tradingProfitAfterAllowancesPence: GBP(30000) })).corporationTaxPence, GBP(5700)));
t('marginal relief: 100,000 -> 22,750', () => {
  const r = computePeriod(base({ tradingProfitAfterAllowancesPence: GBP(100000) }));
  assert.equal(r.marginalReliefPence, GBP(2250)); assert.equal(r.corporationTaxPence, GBP(22750));
});
t('main rate: 300,000 -> 75,000', () =>
  assert.equal(computePeriod(base({ tradingProfitAfterAllowancesPence: GBP(300000) })).corporationTaxPence, GBP(75000)));
t('one associated company halves limits: 60,000 -> 14,025', () =>
  assert.equal(computePeriod(base({ associatedCompanies: 1, tradingProfitAfterAllowancesPence: GBP(60000) })).corporationTaxPence, GBP(14025)));
t('boundaries: A=L is 19%, A=U is 25%', () => {
  assert.equal(computePeriod(base({ tradingProfitAfterAllowancesPence: GBP(50000) })).corporationTaxPence, GBP(9500));
  assert.equal(computePeriod(base({ tradingProfitAfterAllowancesPence: GBP(250000) })).corporationTaxPence, GBP(62500));
});
t('exempt distributions raise augmented profits: 100k + 50k FII -> 24,000', () => {
  const r = computePeriod(base({ tradingProfitAfterAllowancesPence: GBP(100000), exemptDistributionsPence: GBP(50000) }));
  assert.equal(r.corporationTaxPence, GBP(24000));
});
t('short 17-day period scales the limits (original spec would give 1,900)', () => {
  const r = computePeriod(base({ period: { start: '2026-03-15', end: '2026-03-31' }, tradingProfitAfterAllowancesPence: GBP(10000) }));
  assert.equal(r.days, 17); assert.equal(r.ctBeforeReliefPence, GBP(2500)); assert.equal(r.marginalReliefPence, 2466);
  assert.equal(r.corporationTaxPence, 247534);
});

// ---- losses ----
t('brought-forward losses survive a loss-making year', () => {
  const r = computePeriod(base({ tradingProfitAfterAllowancesPence: -GBP(5000), tradingLossesBroughtForwardPence: GBP(20000) }));
  assert.equal(r.lossesCarriedForwardPence, GBP(25000)); assert.equal(r.corporationTaxPence, 0);
});
t('current loss is set against interest first', () => {
  const r = computePeriod(base({ tradingProfitAfterAllowancesPence: -GBP(5000), nonTradingIncomePence: GBP(2000) }));
  assert.equal(r.lossesCarriedForwardPence, GBP(3000)); assert.equal(r.totalTaxableProfitsPence, 0);
});
t('b/f losses reduce total profits', () => {
  const r = computePeriod(base({ tradingProfitAfterAllowancesPence: GBP(30000), tradingLossesBroughtForwardPence: GBP(10000) }));
  assert.equal(r.corporationTaxPence, GBP(3800)); assert.equal(r.lossesCarriedForwardPence, 0);
});

// ---- s455 ----
t('s455 rate bands follow the loan date', () => {
  const c: [string, number][] = [['2016-04-05', 25], ['2016-04-06', 32.5], ['2022-04-05', 32.5], ['2022-04-06', 33.75],
    ['2026-04-05', 33.75], ['2026-04-06', 35.75]];
  for (const [d, r] of c) assert.equal(s455RatePct(d), r, d);
});
t('s455 is computed loan by loan: 3,375 + 3,575', () => {
  const r = computePeriod(base({ directorLoans: [
    { id: 'A', madeOn: '2026-03-31', outstandingAtDueDatePence: GBP(10000) },
    { id: 'B', madeOn: '2026-04-06', outstandingAtDueDatePence: GBP(10000) }] }));
  assert.equal(r.s455TaxPence, GBP(6950));
});
t('s455 not charged on a non-close company', () => {
  const r = computePeriod(base({ closeCompany: false, directorLoans: [{ id: 'A', madeOn: '2026-05-01', outstandingAtDueDatePence: GBP(1000) }] }));
  assert.equal(r.s455TaxPence, 0); assert.ok(r.warnings.length > 0);
});

// ---- allowances and apportionment ----
t('hybrid WDA rate', () => {
  assert.equal(mainPoolWdaRatePct({ start: '2025-04-01', end: '2026-03-31' }), 18);
  assert.equal(mainPoolWdaRatePct({ start: '2026-04-01', end: '2027-03-31' }), 14);
  assert.ok(Math.abs(mainPoolWdaRatePct({ start: '2026-01-01', end: '2026-12-31' }) - 5470 / 365) < 1e-9);
});
t('apportionment conserves every penny', () => {
  const ps = splitIntoAccountingPeriods('2025-03-15', '2026-03-31');
  const parts = apportionByDays(GBP(38200), ps);
  assert.deepEqual(parts, [GBP(36500), GBP(1700)]);
  assert.equal(apportionByDays(1_000_001, ps).reduce((a, b) => a + b, 0), 1_000_001);
});

// ---- guards ----
t('rejects floats and over-length periods', () => {
  assert.throws(() => computePeriod(base({ tradingProfitAfterAllowancesPence: 10.5 })));
  assert.throws(() => computePeriod(base({ period: { start: '2025-03-15', end: '2026-03-31' } })));
});

console.log(`\n${n} tests passed`);
