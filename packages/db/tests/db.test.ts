import test from 'node:test';
import assert from 'node:assert/strict';
import { getDatabase, getRepositories } from '../src/index.ts';

test('@taxflow/db: full repository lifecycle in memory', async (t) => {
  const db = getDatabase(':memory:');
  const repos = getRepositories(db);

  await t.test('creates and retrieves company by CRN', () => {
    const created = repos.companies.upsert({
      crn: '15152081',
      name: 'DropLogicX Ltd',
      utr: '9876543210',
      registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
      companyType: 'ltd',
      isCloseCompany: true
    });

    assert.ok(created.id.startsWith('co_'));
    assert.equal(created.crn, '15152081');
    assert.equal(created.name, 'DropLogicX Ltd');
    assert.equal(created.isCloseCompany, true);

    const fetched = repos.companies.getByCrn('15152081');
    assert.ok(fetched);
    assert.equal(fetched.id, created.id);
    assert.equal(fetched.utr, '9876543210');

    // Case insensitive CRN check
    const fetchedLower = repos.companies.getByCrn('15152081');
    assert.equal(fetchedLower?.name, 'DropLogicX Ltd');
  });

  await t.test('upserts company gracefully without duplicating CRN', () => {
    const updated = repos.companies.upsert({
      crn: '15152081',
      name: 'DropLogicX AI Ltd',
      registeredAddress: 'New Address, London, EC1A 1BB'
    });

    assert.equal(updated.name, 'DropLogicX AI Ltd');
    assert.equal(updated.registeredAddress, 'New Address, London, EC1A 1BB');
    assert.equal(updated.utr, '9876543210'); // Retained existing UTR

    const all = repos.companies.list();
    assert.equal(all.length, 1);
  });

  let filingId = '';

  await t.test('creates filing with draft status', () => {
    const company = repos.companies.getByCrn('15152081')!;
    const filing = repos.filings.create({
      companyId: company.id,
      periodStart: '2025-05-01',
      periodEnd: '2026-04-30',
      directorName: 'Jane Doe',
      status: 'DRAFT',
      trialBalanceJson: JSON.stringify({ turnover: 4500000 })
    });

    assert.ok(filing.id.startsWith('fil_'));
    filingId = filing.id;
    assert.equal(filing.status, 'DRAFT');
    assert.equal(filing.directorName, 'Jane Doe');
    assert.equal(filing.isPaid, false);
    assert.equal(filing.paidAmountPence, 0);
  });

  await t.test('updates filing status, payment, and IRmark', () => {
    const updated = repos.filings.update(filingId, {
      status: 'SHIELD_PASSED',
      irmarkBase64: 'fAkEiRmArKhAsH1234=',
      irmarkBase32: '0123456789ABCDEF',
      directorLegalDeclaration: true,
      directorApprovalDate: '2026-06-15'
    });

    assert.ok(updated);
    assert.equal(updated.status, 'SHIELD_PASSED');
    assert.equal(updated.irmarkBase64, 'fAkEiRmArKhAsH1234=');
    assert.equal(updated.directorLegalDeclaration, true);
    assert.equal(updated.directorApprovalDate, '2026-06-15');

    // Simulate payment unlock
    const paid = repos.filings.update(filingId, {
      isPaid: true,
      paymentReference: 'pi_3MtwBwLkdIwHu7ix28a3tqPa',
      paidAmountPence: 4900,
      status: 'PAID'
    });

    assert.ok(paid);
    assert.equal(paid.isPaid, true);
    assert.equal(paid.paidAmountPence, 4900);
    assert.equal(paid.status, 'PAID');
  });

  await t.test('logs audit trail chronologically', () => {
    repos.auditLogs.append(filingId, 'TRIAL_BALANCE_UPLOADED', { rows: 14 });
    repos.auditLogs.append(filingId, 'SHIELD_EVALUATED', { rulesPassed: 40, fatalErrors: 0 });
    repos.auditLogs.append(filingId, 'PAYMENT_COMPLETED', { pence: 4900 });

    const logs = repos.auditLogs.listByFiling(filingId);
    assert.equal(logs.length, 3);
    assert.equal(logs[0]?.action, 'TRIAL_BALANCE_UPLOADED');
    assert.equal(logs[1]?.action, 'SHIELD_EVALUATED');
    assert.equal(logs[2]?.action, 'PAYMENT_COMPLETED');
  });

  await t.test('upserts and retrieves prior year accounts figures', () => {
    const company = repos.companies.getByCrn('15152081')!;
    const pya = repos.priorYears.upsert({
      companyId: company.id,
      periodEnd: '2025-04-30',
      turnoverPence: 3800000,
      costOfSalesPence: 900000,
      tangibleFixedAssetsPence: 500000,
      debtorsPence: 200000,
      cashAtBankPence: 1800000,
      creditorsDueWithinOneYearPence: 400000,
      calledUpShareCapitalPence: 10000,
      profitAndLossReservePence: 2090000
    });

    assert.equal(pya.turnoverPence, 3800000);
    assert.equal(pya.periodEnd, '2025-04-30');

    const fetched = repos.priorYears.getByPeriod(company.id, '2025-04-30');
    assert.ok(fetched);
    assert.equal(fetched.profitAndLossReservePence, 2090000);
  });

  db.close();
});

