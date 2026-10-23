import test from 'node:test';
import assert from 'node:assert/strict';
import { getRepositories, getDatabase, verifyPassword, hashPassword } from '@taxflow/db';
import { CompaniesHouseClient } from '@taxflow/companies-house';
import { computePeriod } from '@taxflow/ct-engine';
import { generateFrs105Ixbrl, parseFrs105Ixbrl, generateAccountsPdf, generateCt600Pdf } from '@taxflow/doc-engine';
import { runPreFlightShield } from '@taxflow/shield';
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

  await t.test('Statutory Documents Generation: Free Watermarked Drafts', async () => {
    const ixbrl = generateFrs105Ixbrl(sampleShieldInput, {
      includeProfitAndLoss: true,
      watermarkText: 'DRAFT — NOT FOR SUBMISSION'
    });
    assert.ok(ixbrl.includes('DRAFT — NOT FOR SUBMISSION'));
    assert.ok(ixbrl.includes('15152081'));

    const pdfBuf = await generateAccountsPdf({
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

    const ct600Buf = await generateCt600Pdf({
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

  await t.test('Reviewer Mode Toggle: Dynamic enablement and strict fallback', async () => {
    const { isReviewerMode } = await import('../src/lib/reviewerMode.ts');
    
    // Default: true
    delete process.env.REVIEWER_MODE;
    delete process.env.NEXT_PUBLIC_REVIEWER_MODE;
    assert.equal(isReviewerMode(), true);

    // Explicit disable: false
    process.env.REVIEWER_MODE = 'false';
    assert.equal(isReviewerMode(), false);

    // Explicit re-enable: true
    process.env.REVIEWER_MODE = 'true';
    assert.equal(isReviewerMode(), true);

    // Cleanup
    delete process.env.REVIEWER_MODE;
  });

  await t.test('Serverless Database Resilience: Auto-seeding and alias resolution', async () => {
    const { getDatabase, closeDatabase, getRepositories } = await import('@taxflow/db');
    closeDatabase();
    
    // Simulate serverless execution
    const serverlessDb = getDatabase(':memory:');
    const repos = getRepositories(serverlessDb);
    
    // Check auto-seeded users
    const saif = repos.auth.getUserByEmail('saif@droplogicx.com');
    assert.ok(saif);
    assert.equal(saif.fullName, 'Muhammad Saif Raza');
    assert.equal(saif.role, 'ADMIN');

    const admin = repos.auth.getUserByEmail('admin@taxflow.co.uk');
    assert.ok(admin);
    assert.equal(admin.role, 'ADMIN');

    // Check filing aliasing for drop-logicx
    const filingByAlias = repos.filings.getById('drop-logicx');
    assert.ok(filingByAlias);
    assert.equal(filingByAlias.directorName, 'Muhammad Saif Raza');
    assert.equal(filingByAlias.status, 'SUBMITTED');

    // Check filing by primary ID
    const filingById = repos.filings.getById('fil_f114c04facec439e');
    assert.ok(filingById);
    assert.equal(filingById.directorName, 'Muhammad Saif Raza');

    closeDatabase();
  });

  await t.test('Corporation Tax: Marginal Relief, Main Rate & Associated Companies', () => {
    // 1. Small profits rate (< £50k)
    const smallRes = computePeriod({
      period: { start: '2025-10-01', end: '2026-09-30' },
      daysInYearBasis: 365,
      tradingProfitAfterAllowancesPence: GBP(49000),
      nonTradingIncomePence: 0,
      exemptDistributionsPence: 0,
      tradingLossesBroughtForwardPence: 0,
      setOffCurrentLossAgainstOtherProfits: false,
      associatedCompanies: 0,
      closeCompany: true,
      directorLoans: []
    });
    assert.equal(smallRes.corporationTaxPence, GBP(49000 * 0.19)); // £9,310

    // 2. Marginal relief band (£100k profit, £250k upper limit)
    const marginalRes = computePeriod({
      period: { start: '2025-10-01', end: '2026-09-30' },
      daysInYearBasis: 365,
      tradingProfitAfterAllowancesPence: GBP(100000),
      nonTradingIncomePence: 0,
      exemptDistributionsPence: 0,
      tradingLossesBroughtForwardPence: 0,
      setOffCurrentLossAgainstOtherProfits: false,
      associatedCompanies: 0,
      closeCompany: true,
      directorLoans: []
    });
    // Main rate: 25% of 100k = £25,000. Marginal relief: 3/200 * (250000 - 100000) = £2,250. Net: £22,750
    assert.equal(marginalRes.corporationTaxPence, GBP(22750));
    assert.equal(marginalRes.marginalReliefPence, GBP(2250));

    // 3. Main rate (> £250k)
    const mainRes = computePeriod({
      period: { start: '2025-10-01', end: '2026-09-30' },
      daysInYearBasis: 365,
      tradingProfitAfterAllowancesPence: GBP(280000),
      nonTradingIncomePence: 0,
      exemptDistributionsPence: 0,
      tradingLossesBroughtForwardPence: 0,
      setOffCurrentLossAgainstOtherProfits: false,
      associatedCompanies: 0,
      closeCompany: true,
      directorLoans: []
    });
    // Full 25% on £280,000 = £70,000
    assert.equal(mainRes.corporationTaxPence, GBP(70000));
    assert.equal(mainRes.marginalReliefPence, 0);

    // 4. Associated company halving the limits (£50k -> £25k, £250k -> £125k)
    const assocRes = computePeriod({
      period: { start: '2025-10-01', end: '2026-09-30' },
      daysInYearBasis: 365,
      tradingProfitAfterAllowancesPence: GBP(60000),
      nonTradingIncomePence: 0,
      exemptDistributionsPence: 0,
      tradingLossesBroughtForwardPence: 0,
      setOffCurrentLossAgainstOtherProfits: false,
      associatedCompanies: 1, // 1 associated company => divisor 2
      closeCompany: true,
      directorLoans: []
    });
    // Main rate: 25% of 60k = £15,000. Relief: 3/200 * (125000 - 60000) = £975. Net: £14,025
    assert.equal(assocRes.corporationTaxPence, GBP(14025));
  });

  await t.test('Section 455 Tax: Repayment Relief within Statutory 9-Month Window', () => {
    // 1. Repaid within 9 months of year-end => outstanding at due date is 0 => tax £0.00
    const repaidLoanRes = computePeriod({
      period: { start: '2025-10-01', end: '2026-09-30' },
      daysInYearBasis: 365,
      tradingProfitAfterAllowancesPence: GBP(20000),
      nonTradingIncomePence: 0,
      exemptDistributionsPence: 0,
      tradingLossesBroughtForwardPence: 0,
      setOffCurrentLossAgainstOtherProfits: false,
      associatedCompanies: 0,
      closeCompany: true,
      directorLoans: [
        {
          id: 'loan-1',
          madeOn: '2026-02-15',
          outstandingAtDueDatePence: 0 // fully repaid before due date
        }
      ]
    });
    assert.equal(repaidLoanRes.s455TaxPence, 0);
    assert.equal(repaidLoanRes.corporationTaxPence, GBP(20000 * 0.19));

    // 2. Unrepaid loan taken after 6 April 2026 => charged at 35.75%
    const unrepaidLoanRes = computePeriod({
      period: { start: '2025-10-01', end: '2026-09-30' },
      daysInYearBasis: 365,
      tradingProfitAfterAllowancesPence: GBP(20000),
      nonTradingIncomePence: 0,
      exemptDistributionsPence: 0,
      tradingLossesBroughtForwardPence: 0,
      setOffCurrentLossAgainstOtherProfits: false,
      associatedCompanies: 0,
      closeCompany: true,
      directorLoans: [
        {
          id: 'loan-2',
          madeOn: '2026-04-15', // post-6 April 2026 => 35.75%
          outstandingAtDueDatePence: GBP(5000)
        }
      ]
    });
    assert.equal(unrepaidLoanRes.s455TaxPence, GBP(5000 * 0.3575)); // £1,787.50 = 178750p
    assert.equal(unrepaidLoanRes.corporationTaxPence + unrepaidLoanRes.s455TaxPence, GBP(3800) + GBP(1787.50));
  });

  await t.test('Unified Benchmark Reconciled: £20,000 taxable profit -> £3,800 CT', () => {
    // 4-line deduction bridge:
    // Trading Profit: £31,900 + Disallowables: £3,100 - AIA: £15,000 = £20,000 Taxable Profit
    const tradingProfit = GBP(31900);
    const disallowables = GBP(3100);
    const aia = GBP(15000);
    const taxableProfit = tradingProfit + disallowables - aia;
    assert.equal(taxableProfit, GBP(20000));

    const ctRes = computePeriod({
      period: { start: '2025-10-01', end: '2026-09-30' },
      daysInYearBasis: 365,
      tradingProfitAfterAllowancesPence: taxableProfit,
      nonTradingIncomePence: 0,
      exemptDistributionsPence: 0,
      tradingLossesBroughtForwardPence: 0,
      setOffCurrentLossAgainstOtherProfits: false,
      associatedCompanies: 0,
      closeCompany: true,
      directorLoans: []
    });
    assert.equal(ctRes.totalTaxableProfitsPence, GBP(20000));
    assert.equal(ctRes.corporationTaxPence, GBP(3800)); // exactly £3,800.00
  });

  await t.test('Inbound Companies House iXBRL: Historical Accounts Retrieval & Parsing', async () => {
    const ch = new CompaniesHouseClient();
    const docResult = await ch.getLatestAccountsDocument('15152081');
    assert.equal(docResult.isAvailable, true);
    assert.equal(docResult.reason, 'SUCCESS');
    assert.ok(docResult.rawXhtml);

    // Parse the iXBRL
    const parsed = parseFrs105Ixbrl(docResult.rawXhtml, docResult.periodEnd);
    assert.equal(parsed.periodEnd, '2025-09-30');
    assert.equal(parsed.turnoverPence, GBP(80000));
    assert.equal(parsed.tangibleFixedAssetsPence, GBP(15000));
    assert.equal(parsed.netAssetsPence, GBP(30000));
    assert.equal(parsed.shareholderFundsPence, GBP(30000));
    assert.equal(parsed.isBalanceSheetSymmetric, true);

    // Cache in database
    const company = repos.companies.upsert({
      crn: '15152081',
      name: 'DROPLOGICX LTD',
      registeredAddress: '71-75 Shelton Street, London',
      companyType: 'ltd',
      isCloseCompany: true
    });

    const cached = repos.priorYears.upsert({
      companyId: company.id,
      periodEnd: parsed.periodEnd,
      turnoverPence: parsed.turnoverPence,
      costOfSalesPence: parsed.costOfSalesPence,
      tangibleFixedAssetsPence: parsed.tangibleFixedAssetsPence,
      debtorsPence: parsed.debtorsPence,
      cashAtBankPence: parsed.cashAtBankPence,
      creditorsDueWithinOneYearPence: parsed.creditorsDueWithinOneYearPence,
      calledUpShareCapitalPence: parsed.calledUpShareCapitalPence,
      profitAndLossReservePence: parsed.profitAndLossReservePence
    });

    assert.ok(cached.id);
    assert.equal(cached.periodEnd, '2025-09-30');
    assert.equal(cached.turnoverPence, GBP(80000));

    // Verify retrieval from DB
    const fetched = repos.priorYears.getByPeriod(company.id, '2025-09-30');
    assert.ok(fetched);
    assert.equal(fetched.tangibleFixedAssetsPence, GBP(15000));
  });

  // TEST 12: Draft Persistence & Pre-Flight Shield Sync (IMP-01 & IMP-02)
  await t.test('Draft Persistence & Pre-Flight Shield Live Sync', async () => {
    const repos = getRepositories();
    const company = repos.companies.getByCrn('15152081') || repos.companies.upsert({
      crn: '15152081',
      name: 'DROPLOGICX LTD',
      registeredAddress: '71-75 Shelton Street, London',
      companyType: 'ltd',
      isCloseCompany: true
    });

    const filing = repos.filings.create({
      companyId: company.id,
      periodStart: '2025-10-01',
      periodEnd: '2026-09-30',
      directorName: 'Muhammad Saif Raza',
      status: 'DRAFT',
      trialBalanceJson: JSON.stringify({
        turnover: 230000,
        costOfSales: 40000,
        fixedAssets: 20000,
        directorLoanAdvance: 10000,
        directorLoanDate: '2026-05-01'
      })
    });

    // 1. Verify saved draft contains user edits
    const fetchedFiling = repos.filings.getById(filing.id);
    assert.ok(fetchedFiling);
    assert.ok(fetchedFiling.trialBalanceJson);
    const parsedDraft = JSON.parse(fetchedFiling.trialBalanceJson);
    assert.equal(parsedDraft.turnover, 230000);
    assert.equal(parsedDraft.directorLoanAdvance, 10000);

    // 2. Verify Pre-Flight Shield receives user data and evaluates correctly
    const expectedWda = (182 * 18 + 183 * 14) / 365;
    const userShieldInput = {
      entity: {
        crn: '15152081',
        companyName: 'DROPLOGICX LTD',
        companyType: 'TRADING' as const,
        utr: '1234567890',
        isCloseCompany: true,
        isCharityOrPlc: false,
        chAuthCode: 'ABC123',
        gatewayUserId: '123456789012',
        gatewayPassword: 'SecretPassword123!'
      },
      period: {
        periodStart: '2025-10-01',
        periodEnd: '2026-09-30',
        priorPeriodEnd: '2025-09-30',
        daysInYearBasis: 365,
        paymentDueDate: '2027-07-01',
        accountsApprovalDate: '2026-10-15',
        directorDeclarationName: 'Muhammad Saif Raza',
        isDirectorApproved: true
      },
      ledger: {
        turnoverPence: GBP(parsedDraft.turnover),
        costOfSalesPence: GBP(parsedDraft.costOfSales),
        staffCostsPence: 0,
        depreciationPence: 0,
        otherChargesPence: GBP(50000),
        clientEntertainingPence: 0,
        finesPence: 0,
        bankInterestPence: 0,
        taxExpensePence: GBP(26600),
        netProfitAfterTaxPence: GBP(113400),
        dividendsPaidPence: GBP(20000),
        openingRetainedEarningsPence: GBP(15200),
        closingRetainedEarningsPence: GBP(108600),
        fixedAssetsPence: GBP(parsedDraft.fixedAssets),
        debtorsPence: GBP(15000),
        cashPence: GBP(103700),
        creditorsUnderOneYearPence: GBP(30000),
        creditorsOverOneYearPence: 0,
        provisionsPence: 0,
        shareCapitalPence: GBP(100),
        employeeCount: 1
      },
      tax: {
        tradingProfitPence: GBP(140000),
        nonTradingIncomePence: 0,
        exemptDistributionsPence: 0,
        ttpPence: GBP(140000),
        augmentedProfitsPence: GBP(140000),
        lowerLimitPence: GBP(50000),
        upperLimitPence: GBP(250000),
        ctBeforeReliefPence: GBP(26600),
        marginalReliefPence: 0,
        ctPayablePence: GBP(26600),
        mainPoolWdaRatePct: expectedWda,
        mainPoolBalancePence: 0,
        carAiaClaimedPence: 0,
        zeroEmissionFyaClaimedPence: 0,
        directorLoans: [{
          id: 'loan_user_1',
          directorName: 'Muhammad Saif Raza',
          advanceDate: parsedDraft.directorLoanDate,
          advanceAmountPence: GBP(parsedDraft.directorLoanAdvance),
          repaidAmountPence: 0
        }],
        s455TaxPence: GBP(3575) // 35.75% for loan made in May 2026
      }
    };

    const report = runPreFlightShield(userShieldInput);
    // Verified: RULE_33 passes with statutory WDA rate, RULE_22 passes with prior period continuity
    const rule33 = report.evaluations.find((r) => r.id === 'RULE_33');
    assert.ok(rule33);
    assert.equal(rule33.status, 'PASS');

    const rule22 = report.evaluations.find((r) => r.id === 'RULE_22');
    assert.ok(rule22);
    assert.equal(rule22.status, 'PASS');
  });
});

