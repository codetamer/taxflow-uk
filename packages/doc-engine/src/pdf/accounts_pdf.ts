/**
 * TaxFlow UK Document Engine - Statutory FRS 105 Full Accounts PDF Generator
 * Renders complete micro-entity accounts with Balance Sheet, P&L, Notes, s475/s477 declarations,
 * and dynamic draft watermark.
 */

import { SimplePdfDocument } from './pdf_builder.ts';

export interface Frs105AccountsData {
  companyName: string;
  companyNumber: string;
  registeredOfficeAddress?: string;
  periodStart: string;
  periodEnd: string;
  turnoverPence: number;
  costOfSalesPence: number;
  otherIncomePence?: number;
  staffCostsPence?: number;
  depreciationPence?: number;
  otherChargesPence: number;
  taxOnProfitPence: number;
  profitOrLossPence: number;
  tangibleFixedAssetsPence: number;
  debtorsPence: number;
  cashAtBankPence: number;
  creditorsDueWithinOneYearPence: number;
  calledUpShareCapitalPence: number;
  profitAndLossAccountReservePence: number;
  shareholderFundsPence: number;
  averageEmployees: number;
  balanceSheetDateApproval: string;
  directorName: string;
  directorsLoanAdvancePence: number;
  directorsLoanRepaidPence?: number;
  directorsLoanClosingPence?: number;
}

function formatPounds(pence?: number): string {
  if (pence === undefined || pence === null) return '-';
  const pounds = Math.round(pence) / 100;
  if (pounds < 0) {
    return `(${Math.abs(pounds).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})`;
  }
  return pounds.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function generateAccountsPdf(
  data: Frs105AccountsData,
  options?: { isDraft?: boolean }
): Buffer {
  const doc = new SimplePdfDocument();

  if (options?.isDraft) {
    doc.setWatermark('DRAFT - FOR REVIEW ONLY');
  }

  // --- PAGE 1: TITLE & COMPANY OVERVIEW ---
  // Top header rule
  doc.drawRect(50, 790, 495, 2, { fillColor: [0.12, 0.23, 0.36] });

  // Concept 5 Ledger Chevron Logo Mark (Header Top Right)
  doc.drawRect(495, 756, 32, 4, { fillColor: [0.92, 0.35, 0.05] }); // Tier 1: Terracotta
  doc.drawRect(503, 748, 24, 4, { fillColor: [0.96, 0.62, 0.04] }); // Tier 2: Amber
  doc.drawRect(503, 740, 16, 4, { fillColor: [0.85, 0.47, 0.02] }); // Tier 3: Deep Amber
  doc.drawText('TaxFlow UK', 480, 726, {
    font: 'Helvetica-Bold',
    size: 9,
    color: [0.11, 0.10, 0.09]
  });

  doc.drawText(data.companyName.toUpperCase(), 50, 750, {
    font: 'Helvetica-Bold',
    size: 20,
    color: [0.12, 0.23, 0.36]
  });
  doc.drawText('REPORT AND UNAUDITED FINANCIAL STATEMENTS', 50, 728, {
    font: 'Helvetica',
    size: 11,
    color: [0.4, 0.4, 0.4]
  });
  doc.drawText(`FOR THE PERIOD ENDED ${data.periodEnd}`, 50, 712, {
    font: 'Helvetica-Bold',
    size: 11,
    color: [0.2, 0.2, 0.2]
  });

  // Company details box
  doc.drawRect(50, 520, 495, 160, {
    fillColor: [0.97, 0.98, 0.99],
    strokeColor: [0.85, 0.88, 0.9],
    lineWidth: 1
  });

  doc.drawText('COMPANY INFORMATION', 70, 650, {
    font: 'Helvetica-Bold',
    size: 11,
    color: [0.12, 0.23, 0.36]
  });

  const infoRows: [string, string][] = [
    ['Company Registration Number:', data.companyNumber],
    ['Director(s):', data.directorName],
    ['Registered Office:', data.registeredOfficeAddress || 'Registered Office in England & Wales'],
    ['Accounting Framework:', 'FRS 105 The Financial Reporting Standard applicable to the Micro-entities Regime'],
    ['Accounting Period:', `${data.periodStart} to ${data.periodEnd}`],
    ['Approval Date:', data.balanceSheetDateApproval]
  ];

  let currentY = 625;
  for (const [label, val] of infoRows) {
    doc.drawText(label, 70, currentY, { font: 'Helvetica', size: 9, color: [0.4, 0.4, 0.4] });
    doc.drawText(val, 220, currentY, { font: 'Helvetica-Bold', size: 9, color: [0.15, 0.15, 0.15] });
    currentY -= 18;
  }

  // Footer on page 1
  doc.drawLine(50, 70, 545, 70, { color: [0.85, 0.88, 0.9] });
  doc.drawText(`Company Registration No. ${data.companyNumber} (England and Wales)`, 50, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5]
  });
  doc.drawText('Page 1 of 3', 545, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5],
    align: 'right'
  });

  // --- PAGE 2: PROFIT & LOSS AND BALANCE SHEET ---
  doc.addPage();

  doc.drawText(data.companyName.toUpperCase(), 50, 800, {
    font: 'Helvetica-Bold',
    size: 10,
    color: [0.3, 0.3, 0.3]
  });
  doc.drawText('PROFIT AND LOSS ACCOUNT', 50, 775, {
    font: 'Helvetica-Bold',
    size: 13,
    color: [0.12, 0.23, 0.36]
  });
  doc.drawText(`For the period ended ${data.periodEnd}`, 50, 760, {
    font: 'Helvetica',
    size: 9,
    color: [0.4, 0.4, 0.4]
  });

  // P&L Column headers
  doc.drawText('Notes', 380, 740, { font: 'Helvetica-Bold', size: 9, color: [0.3, 0.3, 0.3] });
  doc.drawText(`${data.periodEnd.substring(0, 4)} (£)`, 520, 740, {
    font: 'Helvetica-Bold',
    size: 9,
    color: [0.3, 0.3, 0.3],
    align: 'right'
  });
  doc.drawLine(50, 735, 545, 735, { lineWidth: 1, color: [0.2, 0.2, 0.2] });

  const rawMaterialsPence = data.costOfSalesPence;
  const otherIncomePence = data.otherIncomePence ?? 0;
  const staffCostsPence = data.staffCostsPence ?? 0;
  const depreciationPence = data.depreciationPence ?? 0;

  const plRows: [string, string, string, boolean][] = [
    ['Turnover', '', formatPounds(data.turnoverPence), false],
    ['Other income', '', otherIncomePence > 0 ? formatPounds(otherIncomePence) : '-', false],
    ['Cost of raw materials and consumables', '', rawMaterialsPence > 0 ? formatPounds(-rawMaterialsPence) : '-', false],
    ['Staff costs', '', staffCostsPence > 0 ? formatPounds(-staffCostsPence) : '-', false],
    ['Depreciation and other amounts written off assets', '', depreciationPence > 0 ? formatPounds(-depreciationPence) : '-', false],
    ['Other charges', '', formatPounds(-data.otherChargesPence), false],
    ['Tax on profit', '', formatPounds(-data.taxOnProfitPence), false],
    ['Profit for the financial year', '', formatPounds(data.profitOrLossPence), true]
  ];

  let plY = 720;
  for (const [label, note, val, isBold] of plRows) {
    if (isBold) {
      doc.drawLine(440, plY + 11, 545, plY + 11, { lineWidth: 0.5, color: [0.6, 0.6, 0.6] });
    }
    doc.drawText(label, 50, plY, {
      font: isBold ? 'Helvetica-Bold' : 'Helvetica',
      size: 9,
      color: [0.15, 0.15, 0.15]
    });
    if (note) doc.drawText(note, 385, plY, { font: 'Helvetica', size: 9, color: [0.4, 0.4, 0.4] });
    doc.drawText(val, 520, plY, {
      font: isBold ? 'Helvetica-Bold' : 'Helvetica',
      size: 9,
      color: [0.15, 0.15, 0.15],
      align: 'right'
    });
    if (isBold) {
      doc.drawLine(440, plY - 3, 545, plY - 3, { lineWidth: isBold ? 1 : 0.5, color: [0.2, 0.2, 0.2] });
    }
    plY -= 15;
  }

  // --- BALANCE SHEET ---
  const bsStartY = plY - 20;
  doc.drawText('STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)', 50, bsStartY, {
    font: 'Helvetica-Bold',
    size: 13,
    color: [0.12, 0.23, 0.36]
  });
  doc.drawText(`As at ${data.periodEnd}`, 50, bsStartY - 15, {
    font: 'Helvetica',
    size: 9,
    color: [0.4, 0.4, 0.4]
  });

  doc.drawText('Notes', 380, bsStartY - 35, { font: 'Helvetica-Bold', size: 9, color: [0.3, 0.3, 0.3] });
  doc.drawText(`${data.periodEnd.substring(0, 4)} (£)`, 520, bsStartY - 35, {
    font: 'Helvetica-Bold',
    size: 9,
    color: [0.3, 0.3, 0.3],
    align: 'right'
  });
  doc.drawLine(50, bsStartY - 40, 545, bsStartY - 40, { lineWidth: 1, color: [0.2, 0.2, 0.2] });

  const currentAssetsPence = data.debtorsPence + data.cashAtBankPence;
  const netCurrentAssetsPence = currentAssetsPence - data.creditorsDueWithinOneYearPence;
  const netAssetsPence = data.tangibleFixedAssetsPence + netCurrentAssetsPence;

  const bsRows: [string, string, string, boolean][] = [
    ['Fixed assets', '', formatPounds(data.tangibleFixedAssetsPence), false],
    ['Current assets', '', '', false],
    ['  Debtors', '', formatPounds(data.debtorsPence), false],
    ['  Cash at bank and in hand', '', formatPounds(data.cashAtBankPence), false],
    ['Total current assets', '', formatPounds(currentAssetsPence), true],
    ['Creditors: amounts falling due within one year', '', formatPounds(-data.creditorsDueWithinOneYearPence), false],
    ['Net current assets (liabilities)', '', formatPounds(netCurrentAssetsPence), true],
    ['Total assets less current liabilities', '', formatPounds(netAssetsPence), true],
    ['Net assets', '', formatPounds(netAssetsPence), true],
    ['Capital and reserves', '', '', false],
    ['  Called up share capital', '', formatPounds(data.calledUpShareCapitalPence), false],
    ['  Profit and loss account', '', formatPounds(data.profitAndLossAccountReservePence), false],
    ['Total shareholders\' funds', '', formatPounds(data.shareholderFundsPence), true]
  ];

  let bsY = bsStartY - 55;
  for (const [label, note, val, isBold] of bsRows) {
    if (isBold && val) {
      doc.drawLine(440, bsY + 11, 545, bsY + 11, { lineWidth: 0.5, color: [0.6, 0.6, 0.6] });
    }
    doc.drawText(label, 50, bsY, {
      font: isBold ? 'Helvetica-Bold' : 'Helvetica',
      size: 9,
      color: [0.15, 0.15, 0.15]
    });
    if (note) doc.drawText(note, 385, bsY, { font: 'Helvetica', size: 9, color: [0.4, 0.4, 0.4] });
    if (val) {
      doc.drawText(val, 520, bsY, {
        font: isBold ? 'Helvetica-Bold' : 'Helvetica',
        size: 9,
        color: [0.15, 0.15, 0.15],
        align: 'right'
      });
    }
    if (isBold && val) {
      doc.drawLine(440, bsY - 3, 545, bsY - 3, { lineWidth: 1, color: [0.2, 0.2, 0.2] });
    }
    bsY -= 15;
  }

  // Footer on page 2
  doc.drawLine(50, 70, 545, 70, { color: [0.85, 0.88, 0.9] });
  doc.drawText(`Company Registration No. ${data.companyNumber} (England and Wales)`, 50, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5]
  });
  doc.drawText('Page 2 of 3', 545, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5],
    align: 'right'
  });

  // --- PAGE 3: STATUTORY STATEMENTS & NOTES ---
  doc.addPage();

  doc.drawText(data.companyName.toUpperCase(), 50, 800, {
    font: 'Helvetica-Bold',
    size: 10,
    color: [0.3, 0.3, 0.3]
  });
  doc.drawText('STATUTORY STATEMENTS & NOTES TO THE ACCOUNTS', 50, 775, {
    font: 'Helvetica-Bold',
    size: 13,
    color: [0.12, 0.23, 0.36]
  });
  doc.drawText(`For the period ended ${data.periodEnd}`, 50, 760, {
    font: 'Helvetica',
    size: 9,
    color: [0.4, 0.4, 0.4]
  });

  // Statutory Declarations Box
  doc.drawRect(50, 560, 495, 185, {
    fillColor: [0.98, 0.99, 1.0],
    strokeColor: [0.85, 0.88, 0.92],
    lineWidth: 1
  });

  doc.drawText('STATUTORY STATEMENTS (COMPANIES ACT 2006 s475 / s477)', 65, 725, {
    font: 'Helvetica-Bold',
    size: 9,
    color: [0.12, 0.23, 0.36]
  });

  const legalStatements = [
    `a) For the period ended ${data.periodEnd}, the company was entitled to exemption from audit under section 477 of the Companies Act 2006 relating to micro-entities.`,
    'b) The members have not required the company to obtain an audit of its accounts for the period in question in accordance with section 476 of the Companies Act 2006.',
    'c) The directors acknowledge their responsibilities for complying with the requirements of the Companies Act 2006 with respect to accounting records and the preparation of accounts.',
    'd) These accounts have been prepared in accordance with the micro-entity provisions and delivered in accordance with the provisions applicable to companies subject to the small companies regime.',
    'e) The financial statements were approved by the board of directors and authorised for issue.'
  ];

  let stmtY = 705;
  for (const stmt of legalStatements) {
    doc.drawText(stmt, 65, stmtY, { font: 'Helvetica', size: 7.5, color: [0.3, 0.3, 0.3] });
    stmtY -= 25;
  }

  // Director Sign-off Block
  doc.drawRect(50, 450, 495, 90, {
    fillColor: [0.96, 0.97, 0.98],
    strokeColor: [0.82, 0.85, 0.88],
    lineWidth: 1
  });

  doc.drawText('APPROVAL AND SIGNATURE', 65, 520, {
    font: 'Helvetica-Bold',
    size: 9,
    color: [0.12, 0.23, 0.36]
  });
  doc.drawText(`Signed on behalf of the Board by:`, 65, 500, {
    font: 'Helvetica',
    size: 8.5,
    color: [0.3, 0.3, 0.3]
  });
  doc.drawText(data.directorName.toUpperCase(), 65, 480, {
    font: 'Helvetica-Bold',
    size: 10,
    color: [0.15, 0.15, 0.15]
  });
  doc.drawText('Director', 65, 468, { font: 'Helvetica-Oblique', size: 8.5, color: [0.4, 0.4, 0.4] });
  doc.drawText(`Date of Approval: ${data.balanceSheetDateApproval}`, 350, 480, {
    font: 'Helvetica-Bold',
    size: 9,
    color: [0.2, 0.2, 0.2]
  });

  // Notes to the Accounts
  doc.drawText('NOTES TO THE FINANCIAL STATEMENTS', 50, 410, {
    font: 'Helvetica-Bold',
    size: 11,
    color: [0.12, 0.23, 0.36]
  });

  doc.drawText('1. Statutory Information', 50, 390, { font: 'Helvetica-Bold', size: 8.5, color: [0.2, 0.2, 0.2] });
  doc.drawText(
    `${data.companyName} is a private company limited by shares, registered in England and Wales under company number ${data.companyNumber}.`,
    50,
    378,
    { font: 'Helvetica', size: 8, color: [0.35, 0.35, 0.35] }
  );

  doc.drawText('2. Basis of Preparation & Accounting Policies', 50, 355, {
    font: 'Helvetica-Bold',
    size: 8.5,
    color: [0.2, 0.2, 0.2]
  });
  doc.drawText(
    'These financial statements have been prepared in accordance with Financial Reporting Standard 105 "The Financial Reporting Standard applicable to the Micro-entities Regime" and the Companies Act 2006. The financial statements have been prepared under the historical cost convention.',
    50,
    343,
    { font: 'Helvetica', size: 8, color: [0.35, 0.35, 0.35] }
  );

  doc.drawText('3. Average Number of Employees', 50, 318, {
    font: 'Helvetica-Bold',
    size: 8.5,
    color: [0.2, 0.2, 0.2]
  });
  doc.drawText(
    `The average number of employees, including director(s), during the period was ${data.averageEmployees}.`,
    50,
    306,
    { font: 'Helvetica', size: 8, color: [0.35, 0.35, 0.35] }
  );

  doc.drawText('4. Directors\' Advances, Guarantees and Other Commitments', 50, 280, {
    font: 'Helvetica-Bold',
    size: 8.5,
    color: [0.2, 0.2, 0.2]
  });
  const closingBalance = data.directorsLoanClosingPence !== undefined
    ? data.directorsLoanClosingPence
    : Math.max(0, data.directorsLoanAdvancePence - (data.directorsLoanRepaidPence ?? 0));

  let dlaText: string;
  if (data.directorsLoanAdvancePence > 0) {
    const advFmt = (data.directorsLoanAdvancePence / 100).toLocaleString('en-GB');
    const repaidFmt = ((data.directorsLoanRepaidPence ?? 0) / 100).toLocaleString('en-GB');
    const closeFmt = (closingBalance / 100).toLocaleString('en-GB');
    if ((data.directorsLoanRepaidPence ?? 0) > 0) {
      dlaText = `During the period, advances of £${advFmt} were made to ${data.directorName}. Repayments of £${repaidFmt} were made, leaving an outstanding balance of £${closeFmt}. The loan is unsecured and interest-free.`;
    } else {
      dlaText = `During the period, advances of £${advFmt} were made to ${data.directorName}. The loan is unsecured, interest-free, and repayable upon demand.`;
    }
  } else {
    dlaText = 'No advances, credits or guarantee commitments were outstanding to directors at the balance sheet date.';
  }
  doc.drawText(dlaText, 50, 268, { font: 'Helvetica', size: 8, color: [0.35, 0.35, 0.35] });

  // Footer on page 3
  doc.drawLine(50, 70, 545, 70, { color: [0.85, 0.88, 0.9] });
  doc.drawText(`Company Registration No. ${data.companyNumber} (England and Wales)`, 50, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5]
  });
  doc.drawText('Page 3 of 3', 545, 55, {
    font: 'Helvetica',
    size: 8,
    color: [0.5, 0.5, 0.5],
    align: 'right'
  });

  return doc.build();
}
