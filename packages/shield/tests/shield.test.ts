import assert from 'node:assert/strict';
import { runPreFlightShield, translateGatewayError } from '../src/index.ts';
import type { ShieldInput } from '../src/index.ts';

let passedTests = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passedTests++;
  console.log(`ok  ${name}`);
};

const GBP = (pounds: number) => Math.round(pounds * 100);

/**
 * Valid DropLogicX Ltd benchmark dataset with 100% mathematical parity:
 * - Trading Profit: £29,900 + Non-Trading Interest: £2,000 = Total Taxable Profit: £31,900
 * - Corporation Tax @ 19%: £6,061.00 (CT600 Box 440)
 * - P&L Net Profit After Tax: £31,900 - £6,061 = £25,839
 * - Dividends Declared & Paid: £10,000
 * - Retained Earnings Roll-Forward: £15,200 (Opening) + £25,839 - £10,000 = £31,039 (Closing)
 * - Balance Sheet: Fixed Assets (£5,000) + Current Assets (£35,000) - Creditors (£8,861) = £31,139 Net Assets
 * - Total Shareholders' Funds: Share Capital (£100) + Closing Reserves (£31,039) = £31,139 (Exact £0.00 balance!)
 */
const createValidInput = (): ShieldInput => ({
  entity: {
    crn: '15152081',
    companyName: 'DROPLOGICX LTD',
    companyType: 'TRADING',
    utr: '1234567890',
    isCloseCompany: true,
    isCharityOrPlc: false,
    chAuthCode: 'ABC123',
    gatewayUserId: '123456789012',
    gatewayPassword: 'SecretPassword123!',
  },
  period: {
    periodStart: '2025-10-01',
    periodEnd: '2026-09-30',
    daysInYearBasis: 365,
    priorPeriodEnd: '2025-09-30',
    paymentDueDate: '2027-07-01',
    accountsApprovalDate: '2026-10-15',
    directorDeclarationName: 'Muhammad Saif Raza',
    isDirectorApproved: true,
  },
  ledger: {
    turnoverPence: GBP(100000),
    costOfSalesPence: GBP(45000),
    staffCostsPence: GBP(15000),
    depreciationPence: GBP(2000),
    otherChargesPence: GBP(8100),
    clientEntertainingPence: GBP(800),
    finesPence: 0,
    bankInterestPence: GBP(2000),
    taxExpensePence: GBP(6061),
    netProfitAfterTaxPence: GBP(25839),
    dividendsPaidPence: GBP(10000),
    openingRetainedEarningsPence: GBP(15200),
    closingRetainedEarningsPence: GBP(31039), // 15,200 + 25,839 - 10,000 = 31,039
    fixedAssetsPence: GBP(5000),
    debtorsPence: GBP(10000),
    cashPence: GBP(25000),
    creditorsUnderOneYearPence: GBP(8861),
    creditorsOverOneYearPence: 0,
    provisionsPence: 0,
    shareCapitalPence: GBP(100), // £100 share capital
    employeeCount: 5,
  },
  tax: {
    tradingProfitPence: GBP(29900),
    nonTradingIncomePence: GBP(2000),
    exemptDistributionsPence: 0,
    ttpPence: GBP(31900),
    augmentedProfitsPence: GBP(31900),
    lowerLimitPence: GBP(50000),
    upperLimitPence: GBP(250000),
    ctBeforeReliefPence: GBP(6061),
    marginalReliefPence: 0,
    ctPayablePence: GBP(6061), // £31,900 * 19% = £6,061.00 exactly
    mainPoolWdaRatePct: (182 * 18 + 183 * 14) / 365, // hybrid rate for 1 Oct 2025 to 30 Sep 2026
    carAiaClaimedPence: 0,
    zeroEmissionFyaClaimedPence: 0,
    directorLoans: [],
    s455TaxPence: 0,
  },
});

// TEST 1: Benchmark Dataset Passes Shield Cleanly
test('DropLogicX Ltd benchmark dataset passes 40-Point Pre-Flight Shield with 0 fatal errors', () => {
  const report = runPreFlightShield(createValidInput());
  assert.equal(report.passed, true);
  assert.equal(report.fatalFailureCount, 0);
  assert.ok(report.totalRulesEvaluated >= 40);
});

// TEST 2: Double-Entry Imbalance Trap (RULE_01)
test('Shield catches 1 penny balance sheet imbalance and blocks submission', () => {
  const input = createValidInput();
  input.ledger.cashPence += 1; // 1p corruption

  const report = runPreFlightShield(input);
  assert.equal(report.passed, false);
  assert.ok(report.fatalFailureCount > 0);

  const rule01 = report.evaluations.find((r) => r.id === 'RULE_01');
  assert.ok(rule01);
  assert.equal(rule01.status, 'FAIL');
  assert.ok(rule01.message.includes('Balance Sheet equation does not balance'));
});

// TEST 3: Illegal Dividend Trap (RULE_07)
test('Shield catches illegal dividend exceeding distributable reserves and blocks submission', () => {
  const input = createValidInput();
  // Distributable reserves = 15,200 (opening) + 25,839 (profit) = 41,039
  input.ledger.dividendsPaidPence = GBP(45000); // Exceeds reserves
  input.ledger.closingRetainedEarningsPence = GBP(15200) + GBP(25839) - GBP(45000);

  const report = runPreFlightShield(input);
  assert.equal(report.passed, false);

  const rule07 = report.evaluations.find((r) => r.id === 'RULE_07');
  assert.ok(rule07);
  assert.equal(rule07.status, 'FAIL');
  assert.ok(rule07.message.includes('Illegal Dividend Alert'));
});

// TEST 4: Dormant Company Activity Conflict (RULE_19 - TinyTax Flaw Fix)
test('Shield catches dormant company reporting financial activity and blocks submission', () => {
  const input = createValidInput();
  input.entity.companyType = 'DORMANT'; // Flagged dormant, but turnover is £100,000

  const report = runPreFlightShield(input);
  assert.equal(report.passed, false);

  const rule19 = report.evaluations.find((r) => r.id === 'RULE_19');
  assert.ok(rule19);
  assert.equal(rule19.status, 'FAIL');
  assert.ok(rule19.message.includes('Dormant Company Inconsistency'));
});

// TEST 5: Over-Length Period (RULE_21)
test('Shield rejects accounting periods exceeding 12 months (382 days)', () => {
  const input = createValidInput();
  input.period.periodStart = '2025-03-15';
  input.period.periodEnd = '2026-03-31'; // 382 days

  const report = runPreFlightShield(input);
  assert.equal(report.passed, false);

  const rule21 = report.evaluations.find((r) => r.id === 'RULE_21');
  assert.ok(rule21);
  assert.equal(rule21.status, 'FAIL');
  assert.ok(rule21.message.includes('exceeding the statutory 12-month limit'));
});

// TEST 6: Undated Director Loan (RULE_26 - TinyTax Flaw Fix)
test('Shield catches un-dated director loan advances and blocks submission', () => {
  const input = createValidInput();
  input.tax.directorLoans = [
    { id: 'Loan-1', madeOn: '', outstandingAtDueDatePence: GBP(5000) }, // Missing date!
  ];

  const report = runPreFlightShield(input);
  assert.equal(report.passed, false);

  const rule26 = report.evaluations.find((r) => r.id === 'RULE_26');
  assert.ok(rule26);
  assert.equal(rule26.status, 'FAIL');
  assert.ok(rule26.message.includes('Missing Loan Date'));
});

// TEST 7: Motor Car AIA Exclusion Guard (RULE_31)
test('Shield rejects prohibited Annual Investment Allowance (AIA) claimed on motor cars', () => {
  const input = createValidInput();
  input.tax.carAiaClaimedPence = GBP(15000); // Cars cannot claim AIA

  const report = runPreFlightShield(input);
  assert.equal(report.passed, false);

  const rule31 = report.evaluations.find((r) => r.id === 'RULE_31');
  assert.ok(rule31);
  assert.equal(rule31.status, 'FAIL');
  assert.ok(rule31.message.includes('Prohibited Allowance Claimed'));
});

// TEST 8: Stale WDA Rate Trap (RULE_33 - TinyTax Flaw Fix)
test('Shield catches stale 18% WDA rate on straddling period and requires hybrid rate', () => {
  const input = createValidInput();
  input.tax.mainPoolWdaRatePct = 18; // TinyTax uses stale 18% instead of hybrid rate!

  const report = runPreFlightShield(input);
  assert.equal(report.passed, false);

  const rule33 = report.evaluations.find((r) => r.id === 'RULE_33');
  assert.ok(rule33);
  assert.equal(rule33.status, 'FAIL');
  assert.ok(rule33.message.includes('Stale WDA Rate Detected'));
});

// TEST 9: Missing Director Approval (RULE_40)
test('Shield blocks submission if director legal declaration is not checked', () => {
  const input = createValidInput();
  input.period.isDirectorApproved = false;

  const report = runPreFlightShield(input);
  assert.equal(report.passed, false);

  const rule40 = report.evaluations.find((r) => r.id === 'RULE_40');
  assert.ok(rule40);
  assert.equal(rule40.status, 'FAIL');
  assert.ok(rule40.message.includes('Director Legal Declaration Incomplete'));
});

// TEST 10: Error Code Translator
test('Gateway Error Translator provides actionable plain-English remediation', () => {
  const t1046 = translateGatewayError('HMRC', '1046');
  assert.equal(t1046.gateway, 'HMRC');
  assert.ok(t1046.userTitle.includes('Government Gateway Login'));
  assert.ok(t1046.actionableRemediation.length >= 2);

  const t3001 = translateGatewayError('HMRC', '3001');
  assert.ok(t3001.userTitle.includes('Schema Validation'));

  const tCh9999 = translateGatewayError('COMPANIES_HOUSE', '9999');
  assert.ok(tCh9999.userTitle.includes('Authentication Code'));
});

console.log(`\nAll ${passedTests} @taxflow/shield tests passed successfully!`);
