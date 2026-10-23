import assert from 'node:assert/strict';
import {
  computeIRmark,
  stripExistingIRmark,
  extractGovTalkBody,
  generateFrs105Ixbrl,
  parseFrs105Ixbrl,
  generateAccountsPdf,
  generateCt600Pdf
} from '../src/index.ts';
import type { ShieldInput } from '../../shield/src/types.ts';

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`ok  ${name}`);
};

const GBP = (pounds: number) => Math.round(pounds * 100);

const sampleGovTalkXml = `<GovTalkMessage xmlns="http://www.govtalk.gov.uk/CM/envelope">
  <Header>
    <MessageDetails>
      <Class>HMRC-CT600</Class>
      <Qualifier>request</Qualifier>
      <Function>submit</Function>
      <CorrelationID>TEST-CORR-12345</CorrelationID>
      <Transformation>XML</Transformation>
    </MessageDetails>
    <SenderDetails>
      <IDAuthentication>
        <SenderID>TESTUSER123</SenderID>
        <Authentication>
          <Method>clear</Method>
          <Role>principal</Role>
          <Value>SecretPass123</Value>
        </Authentication>
      </IDAuthentication>
    </SenderDetails>
  </Header>
  <GovTalkDetails>
    <Keys>
      <Key Type="UTR">1234567890</Key>
    </Keys>
  </GovTalkDetails>
  <Body>
    <IRmark Type="generic">OldHashToRemove=</IRmark>
    <CompanyTaxReturn xmlns="http://www.govtalk.gov.uk/taxation/CT/3">
      <CompanyDetails>
        <CompanyRegistrationNumber>15152081</CompanyRegistrationNumber>
        <CompanyName>DROPLOGICX LTD</CompanyName>
      </CompanyDetails>
      <ReturnTotals>
        <TotalTaxableProfits>31900</TotalTaxableProfits>
        <TaxPayable>6061</TaxPayable>
      </ReturnTotals>
    </CompanyTaxReturn>
  </Body>
</GovTalkMessage>`;

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
    ctPayablePence: GBP(6061),
    mainPoolWdaRatePct: 16.0,
    carAiaClaimedPence: 0,
    zeroEmissionFyaClaimedPence: 0,
    directorLoans: [],
    s455TaxPence: 0,
  },
};

// 1. IRmark & C14N Testing
test('extractGovTalkBody extracts the full <Body> element cleanly', () => {
  const body = extractGovTalkBody(sampleGovTalkXml);
  assert.ok(body.startsWith('<Body>'));
  assert.ok(body.endsWith('</Body>'));
  assert.ok(body.includes('DROPLOGICX LTD'));
});

test('stripExistingIRmark removes pre-existing IRmark nodes', () => {
  const stripped = stripExistingIRmark(sampleGovTalkXml);
  assert.ok(!stripped.includes('OldHashToRemove'));
  assert.ok(!stripped.includes('<IRmark'));
});

test('computeIRmark generates deterministic Base64 and Base32 SHA-1 hashes', () => {
  const body = extractGovTalkBody(sampleGovTalkXml);
  const res1 = computeIRmark(body);
  const res2 = computeIRmark(body);

  assert.equal(res1.irmarkBase64, res2.irmarkBase64);
  assert.equal(res1.irmarkBase32, res2.irmarkBase32);
  assert.ok(res1.irmarkBase64.length >= 24);
  assert.ok(!res1.canonicalBodyXml.includes('OldHashToRemove'));
});

// 2. FRS 105 iXBRL Generator Testing
test('generateFrs105Ixbrl produces well-formed XHTML with required namespaces', () => {
  const ixbrl = generateFrs105Ixbrl(sampleShieldInput);

  assert.ok(ixbrl.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(ixbrl.includes('xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"'));
  assert.ok(ixbrl.includes('xmlns:uk-gaap="http://www.xbrl.org/uk/fr/gaap/core/2019-01-01"'));
  assert.ok(ixbrl.includes('xmlns:frs-105="http://xbrl.frc.org.uk/frs/105/2019-01-01"'));
  assert.ok(ixbrl.includes('DROPLOGICX LTD'));
  assert.ok(ixbrl.includes('15152081'));
});

test('generateFrs105Ixbrl embeds all core FRS 105 P&L and Balance Sheet tags', () => {
  const ixbrl = generateFrs105Ixbrl(sampleShieldInput);

  // Core P&L Tags
  assert.ok(ixbrl.includes('name="uk-gaap:TurnoverGrossOperatingRevenue"'));
  assert.ok(ixbrl.includes('name="uk-gaap:CostSales"'));
  assert.ok(ixbrl.includes('name="uk-gaap:StaffCostsEmployeeCosts"'));
  assert.ok(ixbrl.includes('name="uk-gaap:DepreciationAmortisationImpairmentExpense"'));
  assert.ok(ixbrl.includes('name="uk-gaap:OtherOperatingChargesExpenses"'));
  assert.ok(ixbrl.includes('name="uk-gaap:TaxTaxCreditOnProfitOrLossOnOrdinaryActivities"'));
  assert.ok(ixbrl.includes('name="uk-gaap:ProfitLossForPeriod"'));

  // Core Balance Sheet Tags
  assert.ok(ixbrl.includes('name="uk-gaap:PropertyPlantEquipment"'));
  assert.ok(ixbrl.includes('name="uk-gaap:Debtors"'));
  assert.ok(ixbrl.includes('name="uk-gaap:CashBankOnHand"'));
  assert.ok(ixbrl.includes('name="uk-gaap:CurrentAssets"'));
  assert.ok(ixbrl.includes('name="uk-gaap:CreditorsDueWithinOneYear"'));
  assert.ok(ixbrl.includes('name="uk-gaap:NetCurrentAssetsLiabilities"'));
  assert.ok(ixbrl.includes('name="uk-gaap:TotalAssetsLessCurrentLiabilities"'));
  assert.ok(ixbrl.includes('name="uk-gaap:ShareholderFunds"'));
  assert.ok(ixbrl.includes('name="uk-gaap:CalledUpShareCapital"'));
  assert.ok(ixbrl.includes('name="uk-gaap:ProfitLossAccountReserve"'));

  // Statutory Disclosures & Audit Exemption Tags
  assert.ok(ixbrl.includes('name="uk-direp:AverageNumberEmployeesDuringPeriod"'));
  assert.ok(ixbrl.includes('section 477 of the Companies Act 2006'));
  assert.ok(ixbrl.includes('Muhammad Saif Raza'));
});

test('generateFrs105Ixbrl embeds watermark when requested and omits when not', () => {
  const draftIxbrl = generateFrs105Ixbrl(sampleShieldInput, {
    includeProfitAndLoss: true,
    watermarkText: 'DRAFT — NOT FOR SUBMISSION',
  });
  assert.ok(draftIxbrl.includes('DRAFT — NOT FOR SUBMISSION'));

  const finalIxbrl = generateFrs105Ixbrl(sampleShieldInput, {
    includeProfitAndLoss: true,
  });
  assert.ok(!finalIxbrl.includes('DRAFT — NOT FOR SUBMISSION'));
});

import { extractText } from 'unpdf';

// 3. Statutory PDF Generation Suite Testing
test('generateAccountsPdf produces valid ISO 32000-1 PDF Buffer with draft watermark', async () => {
  const accountsData = {
    companyName: 'DROPLOGICX LTD',
    companyNumber: '15152081',
    periodStart: '2025-10-01',
    periodEnd: '2026-09-30',
    turnoverPence: 10000000,
    costOfSalesPence: 2000000,
    otherChargesPence: 4810000,
    taxOnProfitPence: 606100,
    profitOrLossPence: 2583900,
    tangibleFixedAssetsPence: 1500000,
    debtorsPence: 1000000,
    cashAtBankPence: 3113900,
    creditorsDueWithinOneYearPence: 2500000,
    calledUpShareCapitalPence: 10000,
    profitAndLossAccountReservePence: 3103900,
    shareholderFundsPence: 3113900,
    averageEmployees: 3,
    balanceSheetDateApproval: '2026-10-15',
    directorName: 'Muhammad Saif Raza',
    directorsLoanAdvancePence: 500000
  };

  const pdfBuffer = await generateAccountsPdf(accountsData, { isDraft: true });
  assert.ok(Buffer.isBuffer(pdfBuffer));
  assert.ok(pdfBuffer.subarray(0, 4).toString().startsWith('%PDF'));
  assert.ok(pdfBuffer.length > 2000);

  const { text } = await extractText(new Uint8Array(pdfBuffer));
  const fullText = text.join(' ');
  assert.ok(fullText.includes('DROPLOGICX LTD'));
  assert.ok(fullText.includes('DRAFT - FOR REVIEW ONLY'));
});

test('generateCt600Pdf produces official HMRC box-numbered PDF with s455 loan schedule', async () => {
  const ct600Data = {
    companyName: 'DROPLOGICX LTD',
    companyNumber: '15152081',
    utr: '1234567890',
    periodStart: '2025-10-01',
    periodEnd: '2026-09-30',
    paymentDueDate: '2027-07-01',
    turnoverPence: 10000000,
    tradingProfitPence: 2990000,
    bankInterestPence: 200000,
    totalTaxableProfitPence: 3190000,
    smallProfitsTaxPence: 606100,
    marginalReliefPence: 0,
    mainRateTaxPence: 0,
    corporationTaxChargeablePence: 606100,
    s455TaxChargePence: 178750,
    totalTaxPayablePence: 784850,
    aiaClaimedPence: 1500000,
    mainPoolWdaPence: 0,
    signatoryName: 'Muhammad Saif Raza',
    signatoryStatus: 'Director',
    declarationDate: '2026-10-15',
    directorLoans: [
      {
        directorName: 'Muhammad Saif Raza',
        advanceDate: '2026-05-01',
        advancePence: 500000,
        repaidPence: 0,
        outstandingPence: 500000,
        s455Rate: 35.75,
        s455TaxPence: 178750
      }
    ]
  };

  const pdfBuffer = await generateCt600Pdf(ct600Data, { isDraft: true });
  assert.ok(Buffer.isBuffer(pdfBuffer));
  assert.ok(pdfBuffer.subarray(0, 4).toString().startsWith('%PDF'));
  assert.ok(pdfBuffer.length > 2000);

  const { text } = await extractText(new Uint8Array(pdfBuffer));
  const fullText = text.join(' ');
  assert.ok(fullText.includes('1234567890'));
  assert.ok(fullText.includes('CT600A'));
  assert.ok(fullText.includes('DRAFT - NOT FOR FILING'));
});

// 4. Inbound iXBRL Parser Testing
test('parseFrs105Ixbrl extracts all P&L and Balance Sheet figures into exact integer pence', () => {
  const sampleIxbrl = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
      xmlns:uk-gaap="http://www.xbrl.org/uk/fr/gaap/core/2019-01-01"
      xmlns:uk-direp="http://xbrl.frc.org.uk/reports/2019-01-01/direp"
      xmlns:frs-105="http://xbrl.frc.org.uk/frs/105/2019-01-01">
  <head>
    <title>DROPLOGICX LTD - Micro-Entity Annual Accounts 2025</title>
  </head>
  <body>
    <!-- Income Statement -->
    <ix:nonFraction name="uk-gaap:TurnoverGrossOperatingRevenue" unitRef="GBP" decimals="0" contextRef="ctx_2025">80000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CostSales" unitRef="GBP" decimals="0" contextRef="ctx_2025">15000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:OtherOperatingChargesExpenses" unitRef="GBP" decimals="0" contextRef="ctx_2025">35100</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:TaxTaxCreditOnProfitOrLossOnOrdinaryActivities" unitRef="GBP" decimals="0" contextRef="ctx_2025">5681</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ProfitLossForPeriod" unitRef="GBP" decimals="0" contextRef="ctx_2025">24219</ix:nonFraction>

    <!-- Balance Sheet -->
    <ix:nonFraction name="uk-gaap:PropertyPlantEquipment" unitRef="GBP" decimals="0" contextRef="ctx_2025">15000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:Debtors" unitRef="GBP" decimals="0" contextRef="ctx_2025">10000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CashBankOnHand" unitRef="GBP" decimals="0" contextRef="ctx_2025">20000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CreditorsDueWithinOneYear" unitRef="GBP" decimals="0" contextRef="ctx_2025">15000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CalledUpShareCapital" unitRef="GBP" decimals="0" contextRef="ctx_2025">100</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ProfitLossAccountReserve" unitRef="GBP" decimals="0" contextRef="ctx_2025">29900</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ShareholderFunds" unitRef="GBP" decimals="0" contextRef="ctx_2025">30000</ix:nonFraction>

    <!-- Approvals -->
    <ix:nonNumeric name="uk-direp:DateApprovalAccounts" contextRef="ctx_2025">2025-10-15</ix:nonNumeric>
    <ix:nonNumeric name="uk-direp:NameEntityOfficer" contextRef="ctx_2025">Muhammad Saif Raza</ix:nonNumeric>
  </body>
</html>`;

  const parsed = parseFrs105Ixbrl(sampleIxbrl, '2025-09-30');
  assert.equal(parsed.periodEnd, '2025-09-30');
  assert.equal(parsed.turnoverPence, 8000000);
  assert.equal(parsed.costOfSalesPence, 1500000);
  assert.equal(parsed.otherChargesPence, 3510000);
  assert.equal(parsed.taxExpensePence, 568100);
  assert.equal(parsed.netProfitAfterTaxPence, 2421900);
  assert.equal(parsed.tangibleFixedAssetsPence, 1500000);
  assert.equal(parsed.debtorsPence, 1000000);
  assert.equal(parsed.cashAtBankPence, 2000000);
  assert.equal(parsed.creditorsDueWithinOneYearPence, 1500000);
  assert.equal(parsed.calledUpShareCapitalPence, 10000);
  assert.equal(parsed.profitLossReservePence, 2990000);
  assert.equal(parsed.netAssetsPence, 3000000);
  assert.equal(parsed.shareholderFundsPence, 3000000);
  assert.equal(parsed.isBalanceSheetSymmetric, true);
  assert.equal(parsed.variancePence, 0);
  assert.equal(parsed.approvalDate, '2025-10-15');
  assert.equal(parsed.directorName, 'Muhammad Saif Raza');
});

test('parseFrs105Ixbrl round-trips generated outbound iXBRL accurately', () => {
  const generated = generateFrs105Ixbrl(sampleShieldInput);
  const parsed = parseFrs105Ixbrl(generated, '2026-09-30');
  assert.equal(parsed.turnoverPence, 10000000);
  assert.equal(parsed.costOfSalesPence, 4500000);
  assert.equal(parsed.tangibleFixedAssetsPence, 500000);
  assert.equal(parsed.calledUpShareCapitalPence, 10000);
  assert.equal(parsed.isBalanceSheetSymmetric, true);
});

console.log(`\nAll ${passed} @taxflow/doc-engine tests passed successfully!`);
