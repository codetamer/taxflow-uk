import test from 'node:test';
import assert from 'node:assert/strict';
import { CompaniesHouseClient, formatOfficerName, formatAddress } from '../src/index.ts';

test('@taxflow/companies-house: formatters', async (t) => {
  await t.test('formats officer name from UK Companies House format', () => {
    assert.equal(formatOfficerName('DOE, Jane'), 'Jane Doe');
    assert.equal(formatOfficerName('SMITH, John Robert'), 'John Robert Smith');
    assert.equal(formatOfficerName('O\'CONNOR, Sean Patrick'), 'Sean Patrick O\'connor');
    assert.equal(formatOfficerName('SingleName'), 'SingleName');
  });

  await t.test('formats registered office address cleanly', () => {
    const formatted = formatAddress({
      address_line_1: '71-75 Shelton Street',
      locality: 'Covent Garden',
      region: 'London',
      postal_code: 'WC2H 9JQ',
      country: 'United Kingdom'
    });
    assert.equal(formatted, '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ');
  });
});

test('@taxflow/companies-house: client operations in sandbox mode', async (t) => {
  const client = new CompaniesHouseClient(); // Uses sandbox

  await t.test('searches companies by name keyword', async () => {
    const results = await client.searchCompanies('droplogicx');
    assert.ok(results.length >= 1);
    assert.equal(results[0]?.company_number, '15152081');
    assert.equal(results[0]?.title, 'DROPLOGICX LTD');
  });

  await t.test('searches companies by CRN', async () => {
    const results = await client.searchCompanies('15152081');
    assert.ok(results.length >= 1);
    assert.equal(results[0]?.title, 'DROPLOGICX LTD');
  });

  await t.test('retrieves normalized company details for DropLogicX Ltd', async () => {
    const details = await client.getNormalizedCompanyDetails('15152081');
    assert.ok(details);
    assert.equal(details.crn, '15152081');
    assert.equal(details.name, 'DROPLOGICX LTD');
    assert.equal(details.status, 'active');
    assert.equal(details.isActive, true);
    assert.equal(details.isMicroEntityEligible, true);
    assert.equal(details.periodStart, '2025-05-01');
    assert.equal(details.periodEnd, '2026-04-30');
    assert.equal(details.accountsDueDate, '2027-01-31');
    assert.deepEqual(details.directors, ['Muhammad Saif Raza']);
  });

  await t.test('generates algorithmic fallback for arbitrary 8-digit CRN', async () => {
    const details = await client.getNormalizedCompanyDetails('88776655');
    assert.ok(details);
    assert.equal(details.crn, '88776655');
    assert.equal(details.isActive, true);
    assert.equal(details.periodStart, '2025-04-01');
    assert.equal(details.periodEnd, '2026-03-31');
  });

  await t.test('retrieves filing history for DropLogicX Ltd', async () => {
    const filings = await client.getFilingHistory('15152081', 'accounts');
    assert.ok(filings.length >= 1);
    assert.equal(filings[0]?.type, 'AA');
    assert.equal(filings[0]?.category, 'accounts');
    assert.ok(filings[0]?.links?.document_metadata);
  });

  await t.test('retrieves latest accounts document and raw iXBRL XHTML for DropLogicX Ltd', async () => {
    const result = await client.getLatestAccountsDocument('15152081');
    assert.equal(result.isAvailable, true);
    assert.equal(result.reason, 'SUCCESS');
    assert.equal(result.periodEnd, '2025-09-30');
    assert.ok(result.rawXhtml);
    assert.ok(result.rawXhtml.includes('DROPLOGICX LTD'));
    assert.ok(result.rawXhtml.includes('uk-gaap:TurnoverGrossOperatingRevenue'));
    assert.ok(result.rawXhtml.includes('uk-gaap:PropertyPlantEquipment'));
  });

  await t.test('handles company with no accounts filed gracefully', async () => {
    const result = await client.getLatestAccountsDocument('99999999');
    assert.equal(result.isAvailable, false);
    assert.equal(result.reason, 'NO_ACCOUNTS_FILED');
  });
});

