import test from 'node:test';
import assert from 'node:assert/strict';
import { getRepositories, getDatabase, verifyPassword, hashPassword } from '@taxflow/db';
import { CompaniesHouseClient } from '@taxflow/companies-house';
import { computePeriod } from '@taxflow/ct-engine';
import { generateFrs105Ixbrl, generateAccountsPdf, generateCt600Pdf } from '@taxflow/doc-engine';
import type { ShieldInput } from '@taxflow/shield';

const GBP = (pounds: number) => Math.round(pounds * 100);

const sampleShieldInput: ShieldInput = {
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
    closingRetainedEarningsPence: GBP(31039),
    fixedAssetsPence: GBP(5000),
    debtorsPence: GBP(10000),
    cashPence: GBP(25000),
    creditorsUnderOneYearPence: GBP(8861),
    creditorsOverOneYearPence: 0,
    provisionsPence: 0,
    shareCapitalPence: GBP(100),
    aiaClaimedPence: GBP(5000),
    mainPoolWdaClaimedPence: 0,
    specialRatePoolWdaClaimedPence: 0,
    directorLoanAdvancesPence: GBP(5000),
    directorLoanRepaymentsPence: GBP(1000),
    directorLoanOutstandingPence: GBP(4000),
    directorLoanWrittenOffPence: 0,
    priorPeriodFixedAssetsPence: 0,
    priorPeriodNetCurrentAssetsPence: GBP(15300),
    priorPeriodCreditorsOverOneYearPence: 0,
    priorPeriodProvisionsPence: 0,
    priorPeriodShareCapitalPence: GBP(100),
    priorPeriodRetainedEarningsPence: GBP(15200),
  },
  directorLoans: [
    {
      loanId: 'DL-001',
      directorName: 'Muhammad Saif Raza',
      advanceDate: '2026-02-15',
      advanceAmountPence: GBP(5000),
      repaidBeforeNineMonthsPence: GBP(1000),
      outstandingPence: GBP(4000),
      isWrittenOff: false,
    },
  ],
};

test('@taxflow/web: Core API & Service Integration Suite', async (t) => {
  const db = getDatabase(':memory:');
  const repos = getRepositories(db);

  await t.test('Auth & Session Security: Scrypt password hashing & session management', () => {
    // 1. Create a director user
    const user = repos.auth.createUser({
      email: 'director@test.co.uk',
      password: 'SecurePassword123!',
      fullName: 'John Test Director',
      role: 'DIRECTOR'
    });
    assert.ok(user.id);
    assert.equal(user.email, 'director@test.co.uk');

    // 2. Verify password with timing safety
    assert.equal(verifyPassword('SecurePassword123!', user.passwordHash), true);
    assert.equal(verifyPassword('WrongPassword', user.passwordHash), false);

    // 3. Create session
    const { token, session } = repos.auth.createSession(user.id, {
      userAgent: 'Mozilla/5.0 Test Suite'
    });
    assert.ok(token);
    assert.equal(session.userId, user.id);

    // 4. Validate session
    const validated = repos.auth.validateSession(token);
    assert.ok(validated);
    assert.equal(validated.user.id, user.id);

    // 5. Invalidate session (logout)
    repos.auth.deleteSession(token);
    assert.equal(repos.auth.validateSession(token), null);
  });

  await t.test('Multi-Company Management: Associate user with companies and query', () => {
    const user = repos.auth.createUser({
      email: 'multi@test.co.uk',
      password: 'Password123!',
      fullName: 'Multi Company Director'
    });

    const c1 = repos.companies.upsert({
      crn: '15152081',
      name: 'DROPLOGICX LTD',
      registeredAddress: '71-75 Shelton Street, London',
      companyType: 'ltd',
      isCloseCompany: true
    });

    const c2 = repos.companies.upsert({
      crn: '12345678',
      name: 'SECOND VENTURE LTD',
      registeredAddress: '100 City Road, London',
      companyType: 'ltd',
      isCloseCompany: true
    });

    repos.auth.associateUserWithCompany(user.id, c1.id, 'OWNER');
    repos.auth.associateUserWithCompany(user.id, c2.id, 'DIRECTOR');

    const list = repos.auth.listUserCompanies(user.id);
    assert.equal(list.length, 2);
    assert.equal(list[0].crn, '15152081');
    assert.equal(list[1].crn, '12345678');
  });

  await t.test('Companies House Search API Integration: Instant registry query', async () => {
    const ch = new CompaniesHouseClient();
    const results = await ch.searchCompanies('DROPLOGICX', 5);
    assert.ok(results.length > 0);
    assert.equal(results[0].company_number, '15152081');
    assert.equal(results[0].company_status, 'active');
  });

  await t.test('Corporation Tax Computation Engine: 2026/27 Small Profits Rate', () => {
    const res = computePeriod({
      period: { start: '2025-10-01', end: '2026-09-30' },
      daysInYearBasis: 365,
      tradingProfitAfterAllowancesPence: 3190000, // £31,900.00
      nonTradingIncomePence: 0,
      exemptDistributionsPence: 0,
      tradingLossesBroughtForwardPence: 0,
      setOffCurrentLossAgainstOtherProfits: false,
      associatedCompanies: 0,
      closeCompany: true,
      directorLoans: []
    });

    // 19% small profits rate on £31,900 = £6,061.00 = 606100 pence
    assert.equal(res.corporationTaxPence, 606100);
    assert.equal(res.totalTaxableProfitsPence, 3190000);
  });

  await t.test('Statutory Documents Generation: Free Watermarked Drafts', () => {
    const ixbrl = generateFrs105Ixbrl(sampleShieldInput, {
      includeProfitAndLoss: true,
      watermarkText: 'DRAFT — NOT FOR SUBMISSION'
    });
    assert.ok(ixbrl.includes('DRAFT — NOT FOR SUBMISSION'));
    assert.ok(ixbrl.includes('15152081'));

    const pdfBuf = generateAccountsPdf({
      companyName: 'DROPLOGICX LTD',
      companyNumber: '15152081',
      registeredOfficeAddress: '71-75 Shelton Street, London, WC2H 9JQ',
      periodStart: '01 Oct 2025',
      periodEnd: '30 Sep 2026',
      turnoverPence: 10000000,
      costOfSalesPence: 4500000,
      otherChargesPence: 2310000,
      taxOnProfitPence: 606100,
      profitOrLossPence: 2583900,
      tangibleFixedAssetsPence: 500000,
      debtorsPence: 1000000,
      cashAtBankPence: 2500000,
      creditorsDueWithinOneYearPence: 886100,
      calledUpShareCapitalPence: 10000,
      profitAndLossAccountReservePence: 3103900,
      shareholderFundsPence: 3113900,
      averageEmployees: 1,
      balanceSheetDateApproval: '15 Oct 2026',
      directorName: 'Muhammad Saif Raza',
      directorsLoanAdvancePence: 500000
    }, { isDraft: true });
    assert.ok(pdfBuf.length > 500);
    assert.equal(pdfBuf.subarray(0, 4).toString(), '%PDF');

    const ct600Buf = generateCt600Pdf({
      companyName: 'DROPLOGICX LTD',
      companyNumber: '15152081',
      utr: '1234567890',
      periodStart: '2025-10-01',
      periodEnd: '2026-09-30',
      paymentDueDate: '2027-07-01',
      turnoverPence: 10000000,
      tradingProfitPence: 3190000,
      bankInterestPence: 0,
      totalTaxableProfitPence: 3190000,
      smallProfitsTaxPence: 606100,
      marginalReliefPence: 0,
      mainRateTaxPence: 0,
      corporationTaxChargeablePence: 606100,
      s455TaxChargePence: 101250,
      totalTaxPayablePence: 707350,
      aiaClaimedPence: 500000,
      mainPoolWdaPence: 0,
      signatoryName: 'Muhammad Saif Raza',
      signatoryStatus: 'Director',
      declarationDate: '2026-10-15',
      isDraft: true
    });
    assert.ok(ct600Buf.length > 500);
    assert.equal(ct600Buf.subarray(0, 4).toString(), '%PDF');
  });
});

