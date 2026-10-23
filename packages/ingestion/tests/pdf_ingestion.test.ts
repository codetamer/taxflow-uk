import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ingestFinancialPdf } from '../src/pdf_extractor.ts';

test('PDF Ingestion: parses Bank Statement PDF into normalized transactions', async () => {
  // Create sample Bank Statement PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]);

  page.drawText('Monzo Bank Business Statement', { x: 50, y: 800, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('Account Number: 12345678 | Sort Code: 04-00-04', { x: 50, y: 780, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('Statement Period: 01 Oct 2025 to 30 Sep 2026', { x: 50, y: 765, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

  page.drawText('Date Description Amount Balance', { x: 50, y: 730, size: 9, font: boldFont, color: rgb(0.2, 0.2, 0.2) });

  const rows = [
    '01/10/2025 CLIENT INVOICE INV-1001 £5,000.00 £5,000.00',
    '15/10/2025 AMAZON WEB SERVICES CLOUD HOSTING -£150.00 £4,850.00',
    '01/11/2025 APPLE STORE MACBOOK PRO M3 AIA ELIGIBLE -£2,400.00 £2,450.00',
    '15/11/2025 CLIENT ENTERTAINING DINNER SOHO HOUSE -£320.00 £2,130.00',
    '01/12/2025 CONSULTING REVENUE PAYMENT £10,000.00 £12,130.00'
  ];

  let y = 710;
  for (const r of rows) {
    page.drawText(r, { x: 50, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
    y -= 20;
  }

  const pdfBytes = await pdfDoc.save();

  const ingestion = await ingestFinancialPdf(Buffer.from(pdfBytes));

  assert.equal(ingestion.type, 'bank_statement');
  assert.equal(ingestion.detectedBank, 'MONZO');
  assert.equal(ingestion.result.importedTransactions.length, 5);

  // Inflow credits: 5,000 + 10,000 = 15,000
  assert.equal(ingestion.result.totalInflowPence, 1500000);
  // Outflow debits: 150 + 2400 + 320 = 2870
  assert.equal(ingestion.result.totalOutflowPence, 287000);
  assert.equal(ingestion.result.netCashFlowPence, 1213000);

  // Check categorization
  const aws = ingestion.result.importedTransactions.find((t) => t.cleanDescription.includes('AMAZON'));
  assert.ok(aws);
  assert.equal(aws.amountPence, -15000);

  const apple = ingestion.result.importedTransactions.find((t) => t.cleanDescription.includes('APPLE'));
  assert.ok(apple);
  assert.equal(apple.isCapitalAsset, true);

  const entertaining = ingestion.result.importedTransactions.find((t) => t.cleanDescription.includes('ENTERTAINING'));
  assert.ok(entertaining);
  assert.equal(entertaining.isDisallowable, true);
  assert.equal(ingestion.result.disallowableTotalPence, 32000);
});

test('PDF Ingestion: parses Trial Balance PDF with exact debits/credits balance', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]);

  page.drawText('DropLogicX Ltd - Trial Balance Report', { x: 50, y: 800, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('As of 30 September 2026 (FRS 105 Nominal Ledger)', { x: 50, y: 780, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('Account Code Account Name Debit (£) Credit (£)', { x: 50, y: 750, size: 9, font: boldFont, color: rgb(0.2, 0.2, 0.2) });

  const rows = [
    '1000 Sales Turnover £0.00 £100,000.00',
    '2000 Cost of Raw Materials £20,000.00 £0.00',
    '3000 Software Subscriptions & Hosting £48,100.00 £0.00',
    '4000 Computer Equipment £15,000.00 £0.00',
    '5100 Trade Debtors £10,000.00 £0.00',
    '6000 Business Bank Account £33,400.00 £0.00',
    '6500 Trade Creditors £0.00 £25,000.00',
    '7000 Ordinary Share Capital £0.00 £100.00',
    '7100 Retained Earnings Brought Forward £0.00 £1,400.00'
  ];

  let y = 730;
  for (const r of rows) {
    page.drawText(r, { x: 50, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
    y -= 18;
  }

  const pdfBytes = await pdfDoc.save();

  const ingestion = await ingestFinancialPdf(Buffer.from(pdfBytes));

  assert.equal(ingestion.type, 'trial_balance');
  const tb = ingestion.result;

  assert.equal(tb.frs105Summary.turnoverPence, 10000000);
  assert.equal(tb.frs105Summary.costOfSalesPence, 2000000);
  assert.equal(tb.frs105Summary.otherChargesPence, 4810000);
  assert.equal(tb.frs105Summary.tangibleFixedAssetsPence, 1500000);
  assert.equal(tb.frs105Summary.cashAtBankPence, 3340000);
  assert.equal(tb.frs105Summary.shareCapitalPence, 10000);

  // Debits: 20k + 48.1k + 15k + 10k + 33.4k = 126.5k
  // Credits: 100k + 25k + 0.1k + 1.4k = 126.5k
  assert.equal(tb.totalDebitsPence, 12650000);
  assert.equal(tb.totalCreditsPence, 12650000);
  assert.equal(tb.isBalanced, true);
  assert.equal(tb.variancePence, 0);
});
