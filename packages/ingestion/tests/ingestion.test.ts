/**
 * Comprehensive Unit Tests for @taxflow/ingestion
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseCsv,
  detectDelimiter,
  parsePence,
  normalizeDate,
  sanitizeDescription,
  computeRowHash,
  normalizeBankCsv,
  parseTrialBalanceCsv,
  categorizeTransaction,
  AccountingBucket
} from '../src/index.ts';

// 1. CSV Parser Tests
test('parseCsv handles standard commas, quoted fields, and escaped quotes', () => {
  const csv = `Date,Description,Amount
2026-04-01,"Coffee at Costa, London",-3.50
2026-04-02,"He said ""Hello, World""",100.00
2026-04-03,Normal Payment,-50.25`;

  const parsed = parseCsv(csv);
  assert.equal(parsed.headers.length, 3);
  assert.equal(parsed.rows.length, 3);
  assert.equal(parsed.rows[0][1], 'Coffee at Costa, London');
  assert.equal(parsed.rows[1][1], 'He said "Hello, World"');
  assert.equal(parsed.rows[2][2], '-50.25');
});

test('detectDelimiter correctly identifies semicolon and tab delimiters', () => {
  const semi = `Date;Amount;Desc\n2026-01-01;100;Test\n2026-01-02;200;Test2`;
  assert.equal(detectDelimiter(semi), ';');

  const tab = `Date\tAmount\tDesc\n2026-01-01\t100\tTest`;
  assert.equal(detectDelimiter(tab), '\t');
});

// 2. Amount and Date Parsing
test('parsePence handles £, commas, parentheses, and floating-point edge cases', () => {
  assert.equal(parsePence('£1,234.56'), 123456);
  assert.equal(parsePence('-£50.25'), -5025);
  assert.equal(parsePence('(150.00)'), -15000);
  assert.equal(parsePence('12.50-'), -1250);
  assert.equal(parsePence('£0.01'), 1);
  assert.equal(parsePence(''), 0);
});

test('normalizeDate converts DD/MM/YYYY and YYYY-MM-DD uniformly to ISO YYYY-MM-DD', () => {
  assert.equal(normalizeDate('31/03/2026'), '2026-03-31');
  assert.equal(normalizeDate('01-04-2026'), '2026-04-01');
  assert.equal(normalizeDate('2026-10-15'), '2026-10-15');
  assert.equal(normalizeDate('15/10/26'), '2026-10-15');
});

// 3. Categorization & Disallowable Expense Flagging
test('categorizer flags client entertaining as disallowable', () => {
  const costa = categorizeTransaction('COSTA COFFEE SOUTHWARK', -450);
  assert.equal(costa.bucket, AccountingBucket.CLIENT_ENTERTAINING);
  assert.equal(costa.isDisallowable, true);

  const nandos = categorizeTransaction("Nando's London Bridge", -2800);
  assert.equal(nandos.bucket, AccountingBucket.CLIENT_ENTERTAINING);
  assert.equal(nandos.isDisallowable, true);

  const uberEats = categorizeTransaction('UBER EATS PENDING', -1850);
  assert.equal(uberEats.bucket, AccountingBucket.CLIENT_ENTERTAINING);
  assert.equal(uberEats.isDisallowable, true);
});

test('categorizer flags fines & penalties as disallowable', () => {
  const pcn = categorizeTransaction('TfL Congestion PCN Fine', -8000);
  assert.equal(pcn.bucket, AccountingBucket.FINES_PENALTIES);
  assert.equal(pcn.isDisallowable, true);

  const hmrc = categorizeTransaction('HMRC Late Filing Penalty', -10000);
  assert.equal(hmrc.bucket, AccountingBucket.FINES_PENALTIES);
  assert.equal(hmrc.isDisallowable, true);
});

test('categorizer flags hardware equipment as capital assets (eligible for AIA)', () => {
  const apple = categorizeTransaction('APPLE STORE REGENT ST MACBOOK PRO', -249900);
  assert.equal(apple.bucket, AccountingBucket.TANGIBLE_FIXED_ASSETS);
  assert.equal(apple.isCapitalAsset, true);
});

test('categorizer flags SaaS subscriptions accurately', () => {
  const aws = categorizeTransaction('AWS EMEA Amazon Web Services', -14520);
  assert.equal(aws.bucket, AccountingBucket.SOFTWARE_SUBSCRIPTIONS);
  assert.equal(aws.isDisallowable, false);

  const github = categorizeTransaction('GITHUB INC COPILOT SUB', -1900);
  assert.equal(github.bucket, AccountingBucket.SOFTWARE_SUBSCRIPTIONS);
});

// 4. Bank CSV Normalization across Major UK Banks
test('normalizeBankCsv ingests Monzo export with emoji and signed amounts', () => {
  const monzoCsv = `Date,Time,Type,Name,Emoji,Category,Amount,Currency,Local amount,Local currency,Notes and #tags,Address,Receipt,Description,Category split
2026-04-01,10:00:00,Card,Costa Coffee,☕,Eating out,-4.50,GBP,-4.50,GBP,,,Coffee,COSTA COFFEE 1234,
2026-04-02,14:30:00,Faster payment,Acme Corp Client,,General,5000.00,GBP,5000.00,GBP,,,Invoice 101,PAYMENT FROM ACME,`;

  const result = normalizeBankCsv(monzoCsv);
  assert.equal(result.sourceBank, 'MONZO');
  assert.equal(result.importedTransactions.length, 2);
  assert.equal(result.totalInflowPence, 500000);
  assert.equal(result.totalOutflowPence, 450);
  assert.equal(result.netCashFlowPence, 499550);
  assert.equal(result.disallowableTotalPence, 450); // Costa coffee flagged
});

test('normalizeBankCsv ingests Starling Bank export with Amount (GBP) and Counter Party', () => {
  const starlingCsv = `Date,Counter Party,Reference,Type,Amount (GBP),Balance (GBP),Spending Category,Notes
05/04/2026,Stripe Payments,Payout 4921,Faster Payment,1250.75,10250.75,Income,
06/04/2026,AWS EMEA,Cloud Hosting,Direct Debit,-89.20,10161.55,Technology,`;

  const result = normalizeBankCsv(starlingCsv);
  assert.equal(result.sourceBank, 'STARLING');
  assert.equal(result.importedTransactions.length, 2);
  assert.equal(result.importedTransactions[0].transactionDate, '2026-04-05');
  assert.equal(result.importedTransactions[0].amountPence, 125075);
  assert.equal(result.importedTransactions[1].amountPence, -8920);
});

test('normalizeBankCsv skips Barclays preamble metadata rows and parses split money columns', () => {
  const barclaysCsv = `Barclays Bank UK PLC
Account Number: 12345678 Sort Code: 20-00-00
Statement Period: 01/04/2026 to 30/04/2026
Number,Date,Account,Amount,Subcategory,Memo
1,01/04/2026,12345678,2500.00,Income,Consulting Services Invoice 55
2,02/04/2026,12345678,-150.00,Office,Currys PC World Monitor`;

  const result = normalizeBankCsv(barclaysCsv);
  assert.equal(result.sourceBank, 'BARCLAYS');
  assert.equal(result.importedTransactions.length, 2);
  assert.equal(result.importedTransactions[0].amountPence, 250000);
  assert.equal(result.importedTransactions[1].amountPence, -15000);
  assert.equal(result.capitalAssetTotalPence, 15000); // Currys monitor is capital asset
});

test('normalizeBankCsv ingests Lloyds export with Debit Amount and Credit Amount', () => {
  const lloydsCsv = `Transaction Date,Transaction Type,Sort Code,Account Number,Transaction Description,Debit Amount,Credit Amount,Balance
01/04/2026,BGC,30-00-00,87654321,Client Settlement,,10000.00,15000.00
02/04/2026,DEB,30-00-00,87654321,TfL Penalty Charge,65.00,,14935.00`;

  const result = normalizeBankCsv(lloydsCsv);
  assert.equal(result.sourceBank, 'LLOYDS');
  assert.equal(result.importedTransactions.length, 2);
  assert.equal(result.importedTransactions[0].amountPence, 1000000);
  assert.equal(result.importedTransactions[1].amountPence, -6500);
  assert.equal(result.disallowableTotalPence, 6500); // TfL penalty flagged
});

test('normalizeBankCsv ingests Revolut Business export with fee subtraction and completed date', () => {
  const revolutCsv = `Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
2026-04-10,2026-04-11,International Transfer,1000.00,5.00,GBP,COMPLETED,995.00
2026-04-12,2026-04-12,Monthly Plan Fee,-25.00,0.00,GBP,COMPLETED,970.00`;

  const result = normalizeBankCsv(revolutCsv);
  assert.equal(result.sourceBank, 'REVOLUT');
  assert.equal(result.importedTransactions.length, 2);
  // Uses Completed Date (2026-04-11)
  assert.equal(result.importedTransactions[0].transactionDate, '2026-04-11');
  // 1000.00 - 5.00 fee = 995.00 = 99500 pence
  assert.equal(result.importedTransactions[0].amountPence, 99500);
  assert.equal(result.importedTransactions[1].amountPence, -2500);
});

// 5. Deduplication Testing
test('normalizeBankCsv deduplicates identical transactions using SHA-256 fingerprint', () => {
  const duplicateCsv = `Date,Description,Amount
2026-04-01,Duplicate SaaS Subscription,-15.00
2026-04-01,Duplicate SaaS Subscription,-15.00
2026-04-02,Different Date,-15.00`;

  const result = normalizeBankCsv(duplicateCsv);
  assert.equal(result.importedTransactions.length, 2);
  assert.equal(result.duplicateRows, 1);
});

// 6. Trial Balance CSV Ingestion & FRS 105 Aggregation
test('parseTrialBalanceCsv validates balanced DropLogicX trial balance to the exact penny', () => {
    const tbCsv = `Account Code,Account Name,Debit,Credit
1000,Turnover / Sales,,100000.00
1100,Trade Debtors,10000.00,
2000,Cost of Sales,20000.00,
3000,Administrative Expenses,45000.00,
3100,Client Entertaining (Disallowable),3100.00,
4000,Tangible Fixed Assets,15000.00,
5000,Director Loan Account,5000.00,
6000,Bank Current Account,31139.00,
7000,Dividends Paid,10000.00,
9000,Ordinary Share Capital,,100.00
3999,Retained Earnings Brought Forward,,39139.00`;

  const result = parseTrialBalanceCsv(tbCsv);
  assert.equal(result.isBalanced, true);
  assert.equal(result.variancePence, 0);
  assert.equal(result.totalDebitsPence, 13923900);
  assert.equal(result.totalCreditsPence, 13923900);

  // Check FRS 105 aggregations
  assert.equal(result.frs105Summary.turnoverPence, 10000000); // £100,000
  assert.equal(result.frs105Summary.costOfSalesPence, 2000000); // £20,000
  assert.equal(result.frs105Summary.disallowablesPence, 310000); // £3,100
  // Other charges = 45000 + 3100 = £48,100
  assert.equal(result.frs105Summary.otherChargesPence, 4810000);
  // Net profit before tax = 100,000 - 20,000 - 48,100 = £31,900
  assert.equal(result.frs105Summary.netOperatingProfitBeforeTaxPence, 3190000);
});

test('parseTrialBalanceCsv catches 1 penny imbalance and flags variance', () => {
  const imbalancedTb = `Account Code,Account Name,Debit,Credit
1000,Turnover,,1000.00
2000,Cost of Sales,1000.01,`;

  const result = parseTrialBalanceCsv(imbalancedTb);
  assert.equal(result.isBalanced, false);
  assert.equal(result.variancePence, 1); // 1p variance caught!
});

console.log('All @taxflow/ingestion unit tests passed successfully!');
