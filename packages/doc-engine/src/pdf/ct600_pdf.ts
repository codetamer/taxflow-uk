/**
 * TaxFlow UK Document Engine - HMRC CT600 & CT600A Form PDF Generator
 * Renders official HMRC box-numbered layout, tax computation, s455 loan schedule,
 * capital allowances, director declaration, and dynamic draft watermark.
 */

import { SimplePdfDocument } from './pdf_builder.ts';

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

function fmt(pence?: number): string {
  if (pence === undefined || pence === null) return '£0.00';
  const val = Math.round(pence) / 100;
  return `£${val.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateCt600Pdf(
  data: Ct600PdfData,
  options?: { isDraft?: boolean }
): Buffer {
  const doc = new SimplePdfDocument();

  if (options?.isDraft) {
    doc.setWatermark('DRAFT - NOT FOR FILING');
  }

  // --- PAGE 1: HMRC CT600 COMPANY TAX RETURN (PAGES 1-4 COMPACT STATUTORY VIEW) ---
  // HMRC Banner
  doc.drawRect(50, 780, 495, 30, { fillColor: [0.0, 0.44, 0.38] }); // HMRC Forest Green
  doc.drawText('HM Revenue & Customs', 65, 792, {
    font: 'Helvetica-Bold',
    size: 13,
    color: [1, 1, 1]
  });
  doc.drawText('CT600 (2026/27) Company Tax Return', 310, 792, {
    font: 'Helvetica-Bold',
    size: 10,
    color: [1, 1, 1]
  });

  // Company Details Block
  doc.drawRect(50, 680, 495, 90, {
    fillColor: [0.98, 0.98, 0.98],
    strokeColor: [0.8, 0.8, 0.8],
    lineWidth: 1
  });

  doc.drawText('COMPANY IDENTIFICATION', 65, 750, {
    font: 'Helvetica-Bold',
    size: 9,
    color: [0.0, 0.44, 0.38]
  });

  doc.drawText('[ 1 ] UTR:', 65, 730, { font: 'Helvetica', size: 8, color: [0.4, 0.4, 0.4] });
  doc.drawText(data.utr, 140, 730, { font: 'Helvetica-Bold', size: 9, color: [0.1, 0.1, 0.1] });

  doc.drawText('[ 3 ] CRN:', 310, 730, { font: 'Helvetica', size: 8, color: [0.4, 0.4, 0.4] });
  doc.drawText(data.companyNumber, 370, 730, { font: 'Helvetica-Bold', size: 9, color: [0.1, 0.1, 0.1] });

  doc.drawText('[ 2 ] Name:', 65, 712, { font: 'Helvetica', size: 8, color: [0.4, 0.4, 0.4] });
  doc.drawText(data.companyName.toUpperCase(), 140, 712, { font: 'Helvetica-Bold', size: 9, color: [0.1, 0.1, 0.1] });

  doc.drawText('[ 30 ] Period Start:', 65, 694, { font: 'Helvetica', size: 8, color: [0.4, 0.4, 0.4] });
  doc.drawText(data.periodStart, 140, 694, { font: 'Helvetica-Bold', size: 9, color: [0.1, 0.1, 0.1] });

  doc.drawText('[ 35 ] Period End:', 310, 694, { font: 'Helvetica', size: 8, color: [0.4, 0.4, 0.4] });
  doc.drawText(data.periodEnd, 390, 694, { font: 'Helvetica-Bold', size: 9, color: [0.1, 0.1, 0.1] });

  // Tax Computation Table
  doc.drawRect(50, 420, 495, 250, {
    fillColor: [1, 1, 1],
    strokeColor: [0.8, 0.8, 0.8],
    lineWidth: 1
  });

  doc.drawRect(50, 645, 495, 25, { fillColor: [0.93, 0.95, 0.94] });
  doc.drawText('INCOME & CHARGEABLE PROFITS COMPUTATION', 65, 653, {
    font: 'Helvetica-Bold',
    size: 9,
    color: [0.0, 0.44, 0.38]
  });

  const compRows: [string, string, string, boolean][] = [
    ['145', 'Turnover / gross operating revenue', fmt(data.turnoverPence), false],
    ['155', 'Trading profits before capital allowances', fmt(data.tradingProfitPence), false],
    ['705', 'Main pool capital allowances (WDA)', fmt(-data.mainPoolWdaPence), false],
    ['730', 'Annual Investment Allowance (AIA) claimed', fmt(-data.aiaClaimedPence), false],
    ['170', 'Non-trading bank interest received', fmt(data.bankInterestPence), false],
    ['235', 'Total Taxable Profits', fmt(data.totalTaxableProfitPence), true],
    ['315', 'Profits chargeable at Small Profits Rate (19%)', fmt(data.totalTaxableProfitPence), false],
    ['435', 'Marginal Relief deduction', fmt(-data.marginalReliefPence), false],
    ['440', 'Corporation Tax chargeable for period', fmt(data.corporationTaxChargeablePence), true],
    ['475', 'Tax payable on loans to participators (s455)', fmt(data.s455TaxChargePence), false],
    ['500', 'NET TAX PAYABLE TO HMRC', fmt(data.totalTaxPayablePence), true],
    ['510', 'Statutory payment due date', data.paymentDueDate, false]
  ];

  let compY = 625;
  for (const [box, desc, val, isBold] of compRows) {
    if (isBold) {
      doc.drawRect(51, compY - 3, 493, 17, { fillColor: [0.96, 0.97, 0.98] });
    }
    // Box number pill
    doc.drawRect(65, compY - 2, 28, 13, {
      fillColor: [0.9, 0.92, 0.9],
      strokeColor: [0.7, 0.75, 0.7],
      lineWidth: 0.5
    });
    doc.drawText(box, 79, compY + 2, {
      font: 'Helvetica-Bold',
      size: 7.5,
      color: [0.1, 0.1, 0.1],
      align: 'center'
    });

    doc.drawText(desc, 105, compY + 2, {
      font: isBold ? 'Helvetica-Bold' : 'Helvetica',
      size: 8,
      color: [0.15, 0.15, 0.15]
    });
    doc.drawText(val, 520, compY + 2, {
      font: isBold ? 'Helvetica-Bold' : 'Helvetica',
      size: 8.5,
      color: isBold ? [0.0, 0.44, 0.38] : [0.15, 0.15, 0.15],
      align: 'right'
    });

    compY -= 18;
  }

  // Declaration Block
  doc.drawRect(50, 310, 495, 95, {
    fillColor: [0.98, 0.99, 1.0],
    strokeColor: [0.82, 0.86, 0.9],
    lineWidth: 1
  });

  doc.drawText('DECLARATION (HMRC STATUTORY RETURN)', 65, 385, {
    font: 'Helvetica-Bold',
    size: 9,
    color: [0.12, 0.23, 0.36]
  });

  doc.drawText(
    'I declare that the information given in this company tax return and accompanying documents is correct and complete to the best of my knowledge and belief.',
    65,
    370,
    { font: 'Helvetica-Oblique', size: 7.5, color: [0.35, 0.35, 0.35] }
  );

  doc.drawText('[ 985 ] Name of Signatory:', 65, 345, { font: 'Helvetica', size: 8, color: [0.4, 0.4, 0.4] });
  doc.drawText(data.signatoryName.toUpperCase(), 180, 345, {
    font: 'Helvetica-Bold',
    size: 8.5,
    color: [0.1, 0.1, 0.1]
  });

  doc.drawText('[ 990 ] Status / Capacity:', 65, 328, { font: 'Helvetica', size: 8, color: [0.4, 0.4, 0.4] });
  doc.drawText(data.signatoryStatus, 180, 328, { font: 'Helvetica-Bold', size: 8.5, color: [0.1, 0.1, 0.1] });

  doc.drawText('[ 995 ] Date of Declaration:', 350, 328, {
    font: 'Helvetica',
    size: 8,
    color: [0.4, 0.4, 0.4]
  });
  doc.drawText(data.declarationDate, 440, 328, { font: 'Helvetica-Bold', size: 8.5, color: [0.1, 0.1, 0.1] });

  // Footer on page 1
  doc.drawLine(50, 70, 545, 70, { color: [0.8, 0.8, 0.8] });
  doc.drawText(`HMRC CT600 (2026/27) — UTR: ${data.utr} — Company: ${data.companyName}`, 50, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5]
  });
  doc.drawText('Page 1 of 2', 545, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5],
    align: 'right'
  });

  // --- PAGE 2: CT600A SCHEDULE (LOANS TO PARTICIPATORS - s455 TAX) ---
  doc.addPage();

  doc.drawRect(50, 780, 495, 30, { fillColor: [0.0, 0.44, 0.38] });
  doc.drawText('CT600A (2026/27) Loans to Participators', 65, 792, {
    font: 'Helvetica-Bold',
    size: 11,
    color: [1, 1, 1]
  });
  doc.drawText('Close Company Section 455 CTA 2010 Tax Computation', 270, 792, {
    font: 'Helvetica',
    size: 9,
    color: [1, 1, 1]
  });

  doc.drawText(
    'Complete this supplementary schedule if the company is a close company and made loans or advances to participators or associates during the accounting period that remained outstanding at the end of the period.',
    50,
    755,
    { font: 'Helvetica', size: 8, color: [0.35, 0.35, 0.35] }
  );

  // Table header
  doc.drawRect(50, 720, 495, 20, { fillColor: [0.92, 0.94, 0.96] });
  doc.drawText('Director / Participator', 55, 727, { font: 'Helvetica-Bold', size: 7.5, color: [0.2, 0.2, 0.2] });
  doc.drawText('Advance Date', 170, 727, { font: 'Helvetica-Bold', size: 7.5, color: [0.2, 0.2, 0.2] });
  doc.drawText('Advance (£)', 255, 727, { font: 'Helvetica-Bold', size: 7.5, color: [0.2, 0.2, 0.2], align: 'right' });
  doc.drawText('Repaid (£)', 335, 727, { font: 'Helvetica-Bold', size: 7.5, color: [0.2, 0.2, 0.2], align: 'right' });
  doc.drawText('Outstanding (£)', 425, 727, { font: 'Helvetica-Bold', size: 7.5, color: [0.2, 0.2, 0.2], align: 'right' });
  doc.drawText('s455 Rate', 475, 727, { font: 'Helvetica-Bold', size: 7.5, color: [0.2, 0.2, 0.2], align: 'right' });
  doc.drawText('Tax Due (£)', 535, 727, { font: 'Helvetica-Bold', size: 7.5, color: [0.2, 0.2, 0.2], align: 'right' });

  let loanY = 705;
  const loans = data.directorLoans && data.directorLoans.length > 0 ? data.directorLoans : [];

  if (loans.length === 0) {
    doc.drawText('No loans or advances made to participators during this return period.', 55, loanY, {
      font: 'Helvetica-Oblique',
      size: 8.5,
      color: [0.5, 0.5, 0.5]
    });
    loanY -= 25;
  } else {
    for (const loan of loans) {
      doc.drawText(loan.directorName, 55, loanY, { font: 'Helvetica', size: 8, color: [0.15, 0.15, 0.15] });
      doc.drawText(loan.advanceDate, 170, loanY, { font: 'Helvetica', size: 8, color: [0.3, 0.3, 0.3] });
      doc.drawText(fmt(loan.advancePence), 255, loanY, {
        font: 'Helvetica',
        size: 8,
        color: [0.15, 0.15, 0.15],
        align: 'right'
      });
      doc.drawText(fmt(loan.repaidPence), 335, loanY, {
        font: 'Helvetica',
        size: 8,
        color: [0.15, 0.15, 0.15],
        align: 'right'
      });
      doc.drawText(fmt(loan.outstandingPence), 425, loanY, {
        font: 'Helvetica-Bold',
        size: 8,
        color: [0.15, 0.15, 0.15],
        align: 'right'
      });
      doc.drawText(`${(loan.s455Rate * 100).toFixed(2)}%`, 475, loanY, {
        font: 'Helvetica',
        size: 8,
        color: [0.3, 0.3, 0.3],
        align: 'right'
      });
      doc.drawText(fmt(loan.s455TaxPence), 535, loanY, {
        font: 'Helvetica-Bold',
        size: 8,
        color: [0.0, 0.44, 0.38],
        align: 'right'
      });
      doc.drawLine(50, loanY - 4, 545, loanY - 4, { lineWidth: 0.5, color: [0.85, 0.85, 0.85] });
      loanY -= 20;
    }
  }

  // Summary box
  doc.drawRect(50, loanY - 60, 495, 60, {
    fillColor: [0.97, 0.98, 0.99],
    strokeColor: [0.8, 0.85, 0.9],
    lineWidth: 1
  });

  doc.drawText('CT600A SUMMARY RECONCILIATION', 65, loanY - 15, {
    font: 'Helvetica-Bold',
    size: 8.5,
    color: [0.12, 0.23, 0.36]
  });

  doc.drawText('[ A15 ] Total s455 Tax Chargeable on Participator Loans:', 65, loanY - 35, {
    font: 'Helvetica',
    size: 8.5,
    color: [0.3, 0.3, 0.3]
  });
  doc.drawText(fmt(data.s455TaxChargePence), 520, loanY - 35, {
    font: 'Helvetica-Bold',
    size: 9.5,
    color: [0.0, 0.44, 0.38],
    align: 'right'
  });

  // Footer on page 2
  doc.drawLine(50, 70, 545, 70, { color: [0.8, 0.8, 0.8] });
  doc.drawText(`HMRC CT600A (2026/27) — UTR: ${data.utr} — Company: ${data.companyName}`, 50, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5]
  });
  doc.drawText('Page 2 of 2', 545, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5],
    align: 'right'
  });

  return doc.build();
}
