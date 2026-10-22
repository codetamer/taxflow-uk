/**
 * TaxFlow UK Document Engine - Inbound FRS 105 iXBRL Extraction Parser
 * Reverse-engineers filed XHTML/iXBRL documents from Companies House into integer-pence financial records.
 */

export interface ParsedPriorYearAccounts {
  periodEnd: string;
  approvalDate?: string;
  directorName?: string;
  turnoverPence: number;
  costOfSalesPence: number;
  otherChargesPence: number;
  taxExpensePence: number;
  netProfitAfterTaxPence: number;
  tangibleFixedAssetsPence: number;
  debtorsPence: number;
  cashAtBankPence: number;
  creditorsDueWithinOneYearPence: number;
  calledUpShareCapitalPence: number;
  profitAndLossReservePence: number;
  profitLossReservePence: number;
  netCurrentAssetsPence: number;
  totalAssetsLessCurrentLiabilitiesPence: number;
  netAssetsPence: number;
  shareholderFundsPence: number;
  isBalanceSheetSymmetric: boolean;
  variancePence: number;
}

/**
 * Extracts the inner text of an ix:nonFraction tag by its taxonomy tag name.
 * Handles attributes in any order (unitRef, decimals, contextRef, sign, scale).
 */
export function extractNonFractionTag(xhtml: string, tagName: string): number | null {
  // Regex matches <ix:nonFraction ... name="uk-gaap:TurnoverGrossOperatingRevenue" ...>VALUE</ix:nonFraction>
  const escapedTag = tagName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const tagRegex = new RegExp(
    `<ix:nonFraction\\b(?=[^>]*\\bname=["']${escapedTag}["'])([^>]*)>([\\s\\S]*?)<\\/ix:nonFraction>`,
    'i'
  );

  const match = xhtml.match(tagRegex);
  if (!match) return null;

  const attributes = match[1];
  const rawText = match[2].trim().replace(/,/g, '');

  if (!rawText || isNaN(Number(rawText))) {
    return null;
  }

  let value = parseFloat(rawText);

  // Check sign attribute (e.g. sign="-")
  if (/sign=["']-["']/i.test(attributes)) {
    value = -Math.abs(value);
  }

  // Check scale attribute (e.g. scale="3" for thousands)
  const scaleMatch = attributes.match(/scale=["'](-?\d+)["']/i);
  if (scaleMatch) {
    const scale = parseInt(scaleMatch[1], 10);
    value = value * Math.pow(10, scale);
  }

  // Check decimals attribute: if decimals="0" or not present, whole pounds -> pence (* 100)
  // If decimals="2", value is in pounds with pence decimals -> * 100
  return Math.round(value * 100);
}

/**
 * Extracts inner text of an ix:nonNumeric tag by name.
 */
export function extractNonNumericTag(xhtml: string, tagName: string): string | null {
  const escapedTag = tagName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const tagRegex = new RegExp(
    `<ix:nonNumeric\\b(?=[^>]*\\bname=["']${escapedTag}["'])([^>]*)>([\\s\\S]*?)<\\/ix:nonNumeric>`,
    'i'
  );

  const match = xhtml.match(tagRegex);
  if (!match) return null;

  return match[2].trim().replace(/<[^>]*>/g, '');
}

/**
 * Parses full FRS 105 iXBRL document into a verified Prior Year Accounts record.
 */
export function parseFrs105Ixbrl(xhtml: string, fallbackPeriodEnd: string = '2025-09-30'): ParsedPriorYearAccounts {
  if (!xhtml || typeof xhtml !== 'string') {
    throw new Error('Invalid iXBRL document: empty or non-string input');
  }

  // Extract Profit & Loss
  const turnoverPence = extractNonFractionTag(xhtml, 'uk-gaap:TurnoverGrossOperatingRevenue') ?? 0;
  const costOfSalesPence = extractNonFractionTag(xhtml, 'uk-gaap:CostSales') ?? 0;
  const otherChargesPence = extractNonFractionTag(xhtml, 'uk-gaap:OtherOperatingChargesExpenses') ?? 0;
  const taxExpensePence = extractNonFractionTag(xhtml, 'uk-gaap:TaxTaxCreditOnProfitOrLossOnOrdinaryActivities') ?? 0;
  const netProfitAfterTaxPence =
    extractNonFractionTag(xhtml, 'uk-gaap:ProfitLossForPeriod') ??
    (turnoverPence - costOfSalesPence - otherChargesPence - taxExpensePence);

  // Extract Balance Sheet
  const tangibleFixedAssetsPence = extractNonFractionTag(xhtml, 'uk-gaap:PropertyPlantEquipment') ?? 0;
  const debtorsPence = extractNonFractionTag(xhtml, 'uk-gaap:Debtors') ?? 0;
  const cashAtBankPence = extractNonFractionTag(xhtml, 'uk-gaap:CashBankOnHand') ?? 0;
  const creditorsDueWithinOneYearPence = extractNonFractionTag(xhtml, 'uk-gaap:CreditorsDueWithinOneYear') ?? 0;
  const calledUpShareCapitalPence = extractNonFractionTag(xhtml, 'uk-gaap:CalledUpShareCapital') ?? 10000; // default £100
  const profitLossReservePence = extractNonFractionTag(xhtml, 'uk-gaap:ProfitLossAccountReserve') ?? 0;

  // Metadata
  const approvalDate = extractNonNumericTag(xhtml, 'uk-direp:DateApprovalAccounts') || undefined;
  const directorName = extractNonNumericTag(xhtml, 'uk-direp:NameEntityOfficer') || undefined;

  // Calculate Balance Sheet Identities
  const netCurrentAssetsPence = (debtorsPence + cashAtBankPence) - creditorsDueWithinOneYearPence;
  const totalAssetsLessCurrentLiabilitiesPence = tangibleFixedAssetsPence + netCurrentAssetsPence;
  const netAssetsPence = totalAssetsLessCurrentLiabilitiesPence;

  // Extracted or derived Shareholder Funds
  const taggedShareholderFunds = extractNonFractionTag(xhtml, 'uk-gaap:ShareholderFunds');
  const shareholderFundsPence = taggedShareholderFunds ?? (calledUpShareCapitalPence + profitLossReservePence);

  const variancePence = netAssetsPence - (calledUpShareCapitalPence + profitLossReservePence);
  const isBalanceSheetSymmetric = variancePence === 0;

  // Infer period end from title or approval date or fallback
  let periodEnd = fallbackPeriodEnd;
  const dateMatch = xhtml.match(/(\d{4}-\d{2}-\d{2})/);
  if (approvalDate) {
    periodEnd = fallbackPeriodEnd;
  } else if (dateMatch) {
    periodEnd = dateMatch[1];
  }

  return {
    periodEnd,
    approvalDate,
    directorName,
    turnoverPence,
    costOfSalesPence,
    otherChargesPence,
    taxExpensePence,
    netProfitAfterTaxPence,
    tangibleFixedAssetsPence,
    debtorsPence,
    cashAtBankPence,
    creditorsDueWithinOneYearPence,
    calledUpShareCapitalPence,
    profitAndLossReservePence: profitLossReservePence,
    profitLossReservePence,
    netCurrentAssetsPence,
    totalAssetsLessCurrentLiabilitiesPence,
    netAssetsPence,
    shareholderFundsPence,
    isBalanceSheetSymmetric,
    variancePence
  };
}
