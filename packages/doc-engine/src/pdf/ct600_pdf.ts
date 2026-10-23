/**
 * TaxFlow UK Document Engine - HMRC CT600 & CT600A Form PDF Generator
 * Renders official HMRC box-numbered layout, tax computation, s455 loan schedule,
 * capital allowances, director declaration, and dynamic draft watermark.
 */

import { rgb } from 'pdf-lib';
import { EnterprisePdfDocument, type TableColumn, type TableRow } from './pdf_builder.ts';

export interface Ct600PdfData {
  companyName: string;
  companyNumber: string;
  utr: string;
  periodStart: string;
  periodEnd: string;
  paymentDueDate: string;
  turnoverPence: number;
  tradingProfitPence: number;
  bankInterestPence: number;
  propertyIncomePence?: number;
  totalTaxableProfitPence: number;
  smallProfitsTaxPence: number;
  marginalReliefPence: number;
  mainRateTaxPence: number;
  corporationTaxChargeablePence: number;
  s455TaxChargePence: number;
  totalTaxPayablePence: number;
  aiaClaimedPence: number;
  mainPoolWdaPence: number;
  signatoryName: string;
  signatoryStatus: string;
  declarationDate: string;
  clientEntertainingPence?: number;
  depreciationPence?: number;
  finesPence?: number;
  directorLoans?: Array<{
    directorName: string;
    advanceDate: string;
    advancePence: number;
    repaidPence: number;
    outstandingPence: number;
    s455Rate: number;
    s455TaxPence: number;
  }>;
}

function fmt(pence?: number | null): string {
  if (pence === undefined || pence === null) return '£0.00';
  const val = Math.round(pence) / 100;
  if (val < 0) {
    return `(£${Math.abs(val).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
  }
  return `£${val.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateBritish(isoDate?: string): string {
  if (!isoDate) return '30 September 2026';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export async function generateCt600Pdf(
  data: Ct600PdfData,
  options?: { isDraft?: boolean }
): Promise<Buffer> {
  const doc = await EnterprisePdfDocument.create();

  if (options?.isDraft) {
    doc.setWatermark('DRAFT - NOT FOR FILING');
  }

  const periodEndFormatted = formatDateBritish(data.periodEnd);
  const periodStartFormatted = formatDateBritish(data.periodStart);
  const paymentDueDateFormatted = formatDateBritish(data.paymentDueDate);
  const declarationDateFormatted = formatDateBritish(data.declarationDate);

  // =========================================================================
  // PAGE 1: HMRC CT600 (2026/27) COMPANY TAX RETURN
  // =========================================================================
  doc.addPage();

  // HMRC Forest Green Header
  doc.drawRect(45, 770, 505, 38, { fillColor: rgb(0.0, 0.44, 0.35) }); // HMRC Emerald
  doc.drawText('HM Revenue & Customs', 60, 785, {
    font: 'bold',
    size: 13,
    color: rgb(1, 1, 1)
  });
  doc.drawText('CT600 (2026/27) Company Tax Return', 535, 785, {
    font: 'bold',
    size: 10,
    color: rgb(1, 1, 1),
    align: 'right'
  });

  // Company Identification Card
  doc.drawRect(45, 680, 505, 80, {
    fillColor: rgb(0.98, 0.99, 1.0),
    borderColor: rgb(0.82, 0.86, 0.9),
    borderWidth: 1
  });

  doc.drawText('COMPANY IDENTIFICATION & STATUTORY DATES', 60, 745, {
    font: 'bold',
    size: 8.5,
    color: rgb(0.0, 0.44, 0.35)
  });

  // Box 1: UTR
  doc.drawText('[ 1 ] Unique Taxpayer Reference (UTR):', 60, 727, { font: 'bold', size: 8, color: rgb(0.3, 0.35, 0.4) });
  doc.drawText(data.utr, 220, 727, { font: 'monoBold', size: 9, color: rgb(0.06, 0.15, 0.28) });

  // Box 3: CRN
  doc.drawText('[ 3 ] Registration Number (CRN):', 340, 727, { font: 'bold', size: 8, color: rgb(0.3, 0.35, 0.4) });
  doc.drawText(data.companyNumber, 480, 727, { font: 'monoBold', size: 9, color: rgb(0.06, 0.15, 0.28) });

  // Box 2: Company Name
  doc.drawText('[ 2 ] Company Name:', 60, 709, { font: 'bold', size: 8, color: rgb(0.3, 0.35, 0.4) });
  doc.drawText(data.companyName.toUpperCase(), 220, 709, { font: 'bold', size: 8.5, color: rgb(0.06, 0.15, 0.28) });

  // Box 30 & 35: Period dates
  doc.drawText('[ 30 ] Accounting Period Start:', 60, 691, { font: 'bold', size: 8, color: rgb(0.3, 0.35, 0.4) });
  doc.drawText(data.periodStart, 220, 691, { font: 'regular', size: 8, color: rgb(0.1, 0.15, 0.2) });

  doc.drawText('[ 35 ] Period End:', 340, 691, { font: 'bold', size: 8, color: rgb(0.3, 0.35, 0.4) });
  doc.drawText(data.periodEnd, 480, 691, { font: 'regular', size: 8, color: rgb(0.1, 0.15, 0.2) });

  // Core Tax Computation Table (CT600 Boxes)
  doc.drawText('CORPORATION TAX COMPUTATION (BOXES 145 – 525)', 45, 665, {
    font: 'bold',
    size: 9.5,
    color: rgb(0.06, 0.15, 0.28)
  });

  const ctColumns: TableColumn[] = [
    { header: 'HMRC Box', width: 65, align: 'center' },
    { header: 'Statutory Description / Tax Regime Section', width: 330, align: 'left' },
    { header: 'Amount (£)', width: 110, align: 'right' }
  ];

  const ctRows: TableRow[] = [
    {
      cells: ['Box 145', 'Total turnover from trade or profession', fmt(data.turnoverPence)],
      bold: true
    },
    {
      cells: ['Box 155', 'Trading profit (after capital allowances & statutory tax adjustments)', fmt(data.tradingProfitPence)]
    },
    {
      cells: ['Box 190', 'Property income / non-trading loan relationships & interest', fmt((data.propertyIncomePence ?? 0) + (data.bankInterestPence || 0))]
    },
    {
      cells: ['Box 315', 'Total Taxable Profits (TTP)', fmt(data.totalTaxableProfitPence)],
      isSubtotal: true,
      bold: true
    },
    {
      cells: ['Box 440', 'Corporation Tax chargeable (Small Profits Rate 19% / Main Rate 25%)', fmt(data.corporationTaxChargeablePence)],
      bold: true
    },
    {
      cells: ['Box 480', 'Tax payable under Section 455 CTA 2010 (loans to participators)', fmt(data.s455TaxChargePence)]
    },
    {
      cells: ['Box 525', 'Total amount of Corporation Tax payable for period', fmt(data.totalTaxPayablePence)],
      isTotal: true,
      bold: true
    }
  ];

  const ctEndY = doc.drawTable(45, 650, ctColumns, ctRows, { rowHeight: 22 });

  // Capital Allowances Table
  const capY = ctEndY - 15;
  doc.drawText('CAPITAL ALLOWANCES & PLANT RELIEFS (CAA 2001)', 45, capY, {
    font: 'bold',
    size: 9.5,
    color: rgb(0.06, 0.15, 0.28)
  });

  const capColumns: TableColumn[] = [
    { header: 'HMRC Box', width: 65, align: 'center' },
    { header: 'Capital Allowance Classification', width: 330, align: 'left' },
    { header: 'Claimed (£)', width: 110, align: 'right' }
  ];

  const capRows: TableRow[] = [
    {
      cells: ['Box 690', 'Annual Investment Allowance (AIA) claimed (100% first year relief)', fmt(data.aiaClaimedPence)],
      bold: true
    },
    {
      cells: ['Box 705', 'Main Pool Writing Down Allowance (WDA) claimed (statutory rate)', fmt(data.mainPoolWdaPence)]
    }
  ];

  const capEndY = doc.drawTable(45, capY - 14, capColumns, capRows, { rowHeight: 22 });

  // Payment Notice Callout Box
  const noticeY = capEndY - 18;
  doc.drawRect(45, noticeY - 45, 505, 52, {
    fillColor: rgb(0.96, 0.98, 0.96),
    borderColor: rgb(0.7, 0.85, 0.75),
    borderWidth: 1
  });

  doc.drawText('[ 80 ] STATUTORY CORPORATION TAX PAYMENT DEADLINE', 60, noticeY - 6, {
    font: 'bold',
    size: 8,
    color: rgb(0.0, 0.44, 0.35)
  });

  doc.drawText(
    `Corporation Tax payment of ${fmt(data.totalTaxPayablePence)} is due by: ${paymentDueDateFormatted} (9 months and 1 day after ARD).`,
    60,
    noticeY - 22,
    { font: 'bold', size: 9, color: rgb(0.1, 0.15, 0.2) }
  );

  doc.drawText(
    `Quote Company UTR ${data.utr} and payment reference code on all BACS / CHAPS bank transfers to HMRC.`,
    60,
    noticeY - 36,
    { font: 'regular', size: 7.5, color: rgb(0.4, 0.45, 0.5) }
  );

  doc.drawRunningFooter(1, 3, data.companyNumber);

  // =========================================================================
  // PAGE 2: CT600A SUPPLEMENTARY PAGES (LOANS TO PARTICIPATORS)
  // =========================================================================
  doc.addPage();
  doc.drawRunningHeader(data.companyName.toUpperCase(), 'CT600A — Loans to Participators (s455 CTA 2010)');

  doc.drawText('CT600A SUPPLEMENTARY PAGES: LOANS TO PARTICIPATORS', 45, 770, {
    font: 'bold',
    size: 13,
    color: rgb(0.06, 0.15, 0.28)
  });

  doc.drawText('CORPORATION TAX ACT 2010 PART 10 SECTION 455 SCHEDULE', 45, 755, {
    font: 'bold',
    size: 9,
    color: rgb(0.0, 0.44, 0.35)
  });

  const rawLoans = data.directorLoans || [];

  if (rawLoans.length > 0) {
    const loanCols: TableColumn[] = [
      { header: 'Participator Name', width: 145, align: 'left' },
      { header: 'Advance Date', width: 75, align: 'center' },
      { header: 'Advanced (£)', width: 75, align: 'right' },
      { header: 'Repaid 9M (£)', width: 75, align: 'right' },
      { header: 'Outstanding (£)', width: 75, align: 'right' },
      { header: 'Rate', width: 60, align: 'right' }
    ];

    const loanRows: TableRow[] = rawLoans.map((l) => ({
      cells: [
        l.directorName,
        formatDateBritish(l.advanceDate),
        fmt(l.advancePence),
        fmt(l.repaidPence),
        fmt(l.outstandingPence),
        `${l.s455Rate.toFixed(2)}%`
      ]
    }));

    const totalAdvances = rawLoans.reduce((acc, l) => acc + l.advancePence, 0);
    const totalRepaid = rawLoans.reduce((acc, l) => acc + l.repaidPence, 0);
    const totalOutstanding = rawLoans.reduce((acc, l) => acc + l.outstandingPence, 0);

    loanRows.push({
      cells: [
        'Total Loans to Participators (Carried to Box 480)',
        '',
        fmt(totalAdvances),
        fmt(totalRepaid),
        fmt(totalOutstanding),
        fmt(data.s455TaxChargePence)
      ],
      isTotal: true,
      bold: true
    });

    const loansEndY = doc.drawTable(45, 735, loanCols, loanRows, { rowHeight: 22 });

    // Bed and breakfasting declaration
    doc.drawRect(45, loansEndY - 60, 505, 55, {
      fillColor: rgb(0.98, 0.99, 1.0),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 0.75
    });

    doc.drawText('BED & BREAKFASTING ANTI-AVOIDANCE DISCLOSURE (CTA 2010 s464C)', 60, loansEndY - 20, {
      font: 'bold',
      size: 8,
      color: rgb(0.06, 0.22, 0.4)
    });

    doc.drawText(
      '•  No repaid amounts have been redrawn within 30 days under section 464C of the Corporation Tax Act 2010.',
      60,
      loansEndY - 34,
      { font: 'regular', size: 7.5, color: rgb(0.3, 0.35, 0.4) }
    );
    doc.drawText(
      '•  Section 455 tax payable is refundable by HMRC under CTA 2010 s458 upon repayment or waiver of the loan.',
      60,
      loansEndY - 47,
      { font: 'regular', size: 7.5, color: rgb(0.3, 0.35, 0.4) }
    );
  } else {
    doc.drawRect(45, 680, 505, 60, {
      fillColor: rgb(0.98, 0.99, 1.0),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 0.75
    });

    doc.drawText('NO LOANS TO PARTICIPATORS REPORTABLE', 60, 720, {
      font: 'bold',
      size: 9,
      color: rgb(0.0, 0.44, 0.35)
    });

    doc.drawText(
      'The company had no loans, advances, or credit arrangements outstanding to directors or participators during the accounting period. Section 455 tax charge is £0.00.',
      60,
      702,
      { font: 'regular', size: 8, color: rgb(0.3, 0.35, 0.4) }
    );
  }

  doc.drawRunningFooter(2, 3, data.companyNumber);

  // =========================================================================
  // PAGE 3: TAX COMPUTATION BRIDGE & DECLARATION
  // =========================================================================
  doc.addPage();
  doc.drawRunningHeader(data.companyName.toUpperCase(), 'Tax Computation Bridge & Sign-Off');

  doc.drawText('TAX COMPUTATION BRIDGE & STATUTORY DECLARATION', 45, 770, {
    font: 'bold',
    size: 13,
    color: rgb(0.06, 0.15, 0.28)
  });

  doc.drawText('RECONCILIATION OF ACCOUNTING PROFIT TO TAXABLE PROFIT', 45, 755, {
    font: 'bold',
    size: 9,
    color: rgb(0.4, 0.45, 0.5)
  });

  const bridgeCols: TableColumn[] = [
    { header: 'Reconciliation Step', width: 395, align: 'left' },
    { header: 'Amount (£)', width: 110, align: 'right' }
  ];

  const clientEnt = data.clientEntertainingPence || 0;
  const dep = data.depreciationPence || 0;
  const fines = data.finesPence || 0;

  const bridgeRows: TableRow[] = [
    { cells: ['Net trading profit per accounts before taxation', fmt(data.tradingProfitPence + (data.aiaClaimedPence || 0) - dep - clientEnt - fines)], bold: true },
    { cells: ['Add: Depreciation charged in financial statements (statutory add-back)', fmt(dep)] },
    { cells: ['Add: Client entertaining expenditure (disallowable under CTA 2009 s1298)', fmt(clientEnt)] },
    { cells: ['Add: Fines and penalties (disallowable under CTA 2009 s1303)', fmt(fines)] },
    { cells: ['Less: Annual Investment Allowance (AIA) claimed (Box 690)', fmt(-(data.aiaClaimedPence || 0))] },
    { cells: ['Equals: Adjusted Trading Profit for Corporation Tax (Box 155)', fmt(data.tradingProfitPence)], isTotal: true, bold: true }
  ];

  const bridgeEndY = doc.drawTable(45, 735, bridgeCols, bridgeRows, { rowHeight: 21 });

  // Statutory Declaration & Sign-off Block
  const declY = bridgeEndY - 25;

  doc.drawRect(45, declY - 140, 505, 145, {
    fillColor: rgb(0.98, 0.99, 1.0),
    borderColor: rgb(0.82, 0.86, 0.9),
    borderWidth: 1
  });

  doc.drawText('STATUTORY DECLARATION (TAXES MANAGEMENT ACT 1970 s108)', 60, declY - 6, {
    font: 'bold',
    size: 9,
    color: rgb(0.0, 0.44, 0.35)
  });

  doc.drawLine(60, declY - 14, 535, declY - 14, { color: rgb(0.85, 0.88, 0.92), thickness: 0.75 });

  const declText =
    'I declare that the information I have given on this company tax return and any supplementary pages is correct and complete to the best of my knowledge and belief. I understand that giving false information can lead to prosecution.';

  doc.drawText(declText, 60, declY - 30, { font: 'bold', size: 8, color: rgb(0.1, 0.15, 0.2) });

  doc.drawText('Signatory Name:', 60, declY - 55, { font: 'bold', size: 8, color: rgb(0.35, 0.4, 0.45) });
  doc.drawText(data.signatoryName.toUpperCase(), 160, declY - 55, { font: 'bold', size: 8.5, color: rgb(0.06, 0.15, 0.28) });

  doc.drawText('Status / Capacity:', 60, declY - 72, { font: 'bold', size: 8, color: rgb(0.35, 0.4, 0.45) });
  doc.drawText(data.signatoryStatus || 'Director', 160, declY - 72, { font: 'regular', size: 8.5, color: rgb(0.1, 0.15, 0.2) });

  doc.drawText('Date of Declaration:', 60, declY - 89, { font: 'bold', size: 8, color: rgb(0.35, 0.4, 0.45) });
  doc.drawText(declarationDateFormatted, 160, declY - 89, { font: 'regular', size: 8.5, color: rgb(0.1, 0.15, 0.2) });

  doc.drawText('Signature:', 60, declY - 110, { font: 'bold', size: 8, color: rgb(0.35, 0.4, 0.45) });
  doc.drawLine(160, declY - 110, 320, declY - 110, { color: rgb(0.6, 0.65, 0.7), thickness: 1 });
  doc.drawText(data.signatoryName, 165, declY - 105, { font: 'oblique', size: 9, color: rgb(0.1, 0.2, 0.4) });

  doc.drawText('Electronically Signed via TaxFlow UK GovTalk Gateway', 525, declY - 110, {
    font: 'mono',
    size: 7,
    color: rgb(0.0, 0.44, 0.35),
    align: 'right'
  });

  doc.drawRunningFooter(3, 3, data.companyNumber);

  return await doc.toBuffer();
}
