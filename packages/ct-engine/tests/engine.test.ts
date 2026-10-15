import assert from 'node:assert/strict';
import {
  daysInclusive,
  splitIntoAccountingPeriods,
  ctPaymentDueDate,
  computePeriod,
  s455RatePct,
  mainPoolWdaRatePct,
  apportionByDays,
} from '../src/index.ts';
import type { PeriodInput } from '../src/index.ts';

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`ok  ${name}`);
};

const GBP = (pounds: number) => Math.round(pounds * 100);

const createBaseInput = (overrides: Partial<PeriodInput> = {}): PeriodInput => ({
  period: { start: '2025-04-01', end: '2026-03-31' },
  daysInYearBasis: 365,
  associatedCompanies: 0,
  tradingProfitAfterAllowancesPence: 0,
  nonTradingIncomePence: 0,
  exemptDistributionsPence: 0,
  tradingLossesBroughtForwardPence: 0,
  setOffCurrentLossAgainstOtherProfits: true,
  closeCompany: true,
  directorLoans: [],
  ...overrides,
});

// 1. Dates & Accounting Period Splitting
test('inclusive day count is 382 for the PRD example', () => {
  assert.equal(daysInclusive('2025-03-15', '2026-03-31'), 382);
});

test('extended period splits into 365 + 17 days', () => {
  const periods = splitIntoAccountingPeriods('2025-03-15', '2026-03-31');
  assert.deepEqual(periods, [
    { start: '2025-03-15', end: '2026-03-14' },
    { start: '2026-03-15', end: '2026-03-31' },
  ]);
  assert.equal(
    daysInclusive(periods[0]!.start, periods[0]!.end) +
      daysInclusive(periods[1]!.start, periods[1]!.end),
    382
  );
});

test('leap-year split: 12 months from 1 Mar 2023 ends 29 Feb 2024', () => {
  const periods = splitIntoAccountingPeriods('2023-03-01', '2024-03-31');
  assert.equal(periods[0]!.end, '2024-02-29');
  assert.equal(periods[1]!.start, '2024-03-01');
  assert.equal(periods.length, 2);
});

test('12-month period is not split', () => {
  assert.equal(splitIntoAccountingPeriods('2025-04-01', '2026-03-31').length, 1);
});

test('18-month period splits at 12 months', () => {
  const periods = splitIntoAccountingPeriods('2025-01-01', '2026-06-30');
  assert.deepEqual(
    periods.map((x) => x.end),
    ['2025-12-31', '2026-06-30']
  );
});

test('payment due dates (9 months and 1 day after period end)', () => {
  assert.equal(ctPaymentDueDate('2026-03-31'), '2027-01-01');
  assert.equal(ctPaymentDueDate('2025-12-31'), '2026-10-01');
  assert.equal(ctPaymentDueDate('2025-09-30'), '2026-07-01');
});

// 2. Core Corporation Tax Calculations
test('small profits rate: £30,000 -> £5,700 tax (19%)', () => {
  const res = computePeriod(createBaseInput({ tradingProfitAfterAllowancesPence: GBP(30000) }));
  assert.equal(res.corporationTaxPence, GBP(5700));
});

test('marginal relief: £100,000 -> £22,750 tax (£2,250 relief)', () => {
  const res = computePeriod(createBaseInput({ tradingProfitAfterAllowancesPence: GBP(100000) }));
  assert.equal(res.marginalReliefPence, GBP(2250));
  assert.equal(res.corporationTaxPence, GBP(22750));
});

test('main rate: £300,000 -> £75,000 tax (25%)', () => {
  const res = computePeriod(createBaseInput({ tradingProfitAfterAllowancesPence: GBP(300000) }));
  assert.equal(res.corporationTaxPence, GBP(75000));
});

test('one associated company halves limits: £60,000 -> £14,025 tax', () => {
  const res = computePeriod(
    createBaseInput({ associatedCompanies: 1, tradingProfitAfterAllowancesPence: GBP(60000) })
  );
  assert.equal(res.corporationTaxPence, GBP(14025));
});

test('exact threshold boundaries: A=L (£50k) is 19%, A=U (£250k) is 25%', () => {
  assert.equal(
    computePeriod(createBaseInput({ tradingProfitAfterAllowancesPence: GBP(50000) })).corporationTaxPence,
    GBP(9500)
  );
  assert.equal(
    computePeriod(createBaseInput({ tradingProfitAfterAllowancesPence: GBP(250000) })).corporationTaxPence,
    GBP(62500)
  );
});

test('exempt distributions raise augmented profits: 100k profit + 50k FII -> £24,000 tax', () => {
  const res = computePeriod(
    createBaseInput({
      tradingProfitAfterAllowancesPence: GBP(100000),
      exemptDistributionsPence: GBP(50000),
    })
  );
  assert.equal(res.corporationTaxPence, GBP(24000));
});

test('short 17-day period scales the limits proportionately', () => {
  const res = computePeriod(
    createBaseInput({
      period: { start: '2026-03-15', end: '2026-03-31' },
      tradingProfitAfterAllowancesPence: GBP(10000),
    })
  );
  assert.equal(res.days, 17);
  assert.equal(res.ctBeforeReliefPence, GBP(2500));
  assert.equal(res.marginalReliefPence, 2466);
  assert.equal(res.corporationTaxPence, 247534);
});

// 3. Loss Relief Rules
test('brought-forward losses survive a loss-making year without being dropped', () => {
  const res = computePeriod(
    createBaseInput({
      tradingProfitAfterAllowancesPence: -GBP(5000),
      tradingLossesBroughtForwardPence: GBP(20000),
    })
  );
  assert.equal(res.lossesCarriedForwardPence, GBP(25000));
  assert.equal(res.corporationTaxPence, 0);
});

test('current loss is set against non-trading interest first', () => {
  const res = computePeriod(
    createBaseInput({
      tradingProfitAfterAllowancesPence: -GBP(5000),
      nonTradingIncomePence: GBP(2000),
    })
  );
  assert.equal(res.lossesCarriedForwardPence, GBP(3000));
  assert.equal(res.totalTaxableProfitsPence, 0);
});

test('brought-forward losses reduce total taxable profits', () => {
  const res = computePeriod(
    createBaseInput({
      tradingProfitAfterAllowancesPence: GBP(30000),
      tradingLossesBroughtForwardPence: GBP(10000),
    })
  );
  assert.equal(res.corporationTaxPence, GBP(3800));
  assert.equal(res.lossesCarriedForwardPence, 0);
});

// 4. Section 455 Loans to Participators
test('s455 rate bands follow the loan creation date', () => {
  const cases: [string, number][] = [
    ['2016-04-05', 25],
    ['2016-04-06', 32.5],
    ['2022-04-05', 32.5],
    ['2022-04-06', 33.75],
    ['2026-04-05', 33.75],
    ['2026-04-06', 35.75],
  ];
  for (const [dateStr, expectedRate] of cases) {
    assert.equal(s455RatePct(dateStr), expectedRate, `Date ${dateStr} failed`);
  }
});

test('s455 is computed loan-by-loan: 3,375 (33.75%) + 3,575 (35.75%) = £6,950', () => {
  const res = computePeriod(
    createBaseInput({
      directorLoans: [
        { id: 'Loan-1', madeOn: '2026-03-31', outstandingAtDueDatePence: GBP(10000) },
        { id: 'Loan-2', madeOn: '2026-04-06', outstandingAtDueDatePence: GBP(10000) },
      ],
    })
  );
  assert.equal(res.s455TaxPence, GBP(6950));
  assert.equal(res.s455Lines.length, 2);
  assert.equal(res.s455Lines[0]!.taxPence, GBP(3375));
  assert.equal(res.s455Lines[1]!.taxPence, GBP(3575));
});

test('s455 is NOT charged on a non-close company', () => {
  const res = computePeriod(
    createBaseInput({
      closeCompany: false,
      directorLoans: [{ id: 'Loan-1', madeOn: '2026-05-01', outstandingAtDueDatePence: GBP(1000) }],
    })
  );
  assert.equal(res.s455TaxPence, 0);
  assert.ok(res.warnings.length > 0);
});

// 5. Capital Allowances & Apportionment
test('main pool hybrid WDA rate calculates exact day-weighted percentage', () => {
  assert.equal(mainPoolWdaRatePct({ start: '2025-04-01', end: '2026-03-31' }), 18);
  assert.equal(mainPoolWdaRatePct({ start: '2026-04-01', end: '2027-03-31' }), 14);
  const hybridExpected = (90 * 18 + 275 * 14) / 365;
  assert.ok(
    Math.abs(mainPoolWdaRatePct({ start: '2026-01-01', end: '2026-12-31' }) - hybridExpected) < 1e-9
  );
});

test('apportionment conserves every single integer penny', () => {
  const periods = splitIntoAccountingPeriods('2025-03-15', '2026-03-31');
  const parts = apportionByDays(GBP(38200), periods);
  assert.deepEqual(parts, [GBP(36500), GBP(1700)]);
  assert.equal(
    apportionByDays(1_000_001, periods).reduce((a, b) => a + b, 0),
    1_000_001
  );
});

// 6. Type Guards & Input Validation
test('rejects floating-point monetary inputs and over-length periods', () => {
  assert.throws(() => computePeriod(createBaseInput({ tradingProfitAfterAllowancesPence: 10.5 })));
  assert.throws(() =>
    computePeriod(createBaseInput({ period: { start: '2025-03-15', end: '2026-03-31' } }))
  );
});

console.log(`\nAll ${passed} @taxflow/ct-engine tests passed successfully!`);
