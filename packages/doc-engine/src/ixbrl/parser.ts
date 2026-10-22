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

  // Extract Profit & Loss (supports uk-gaap and uk-core)
  const turnoverPence =
    extractNonFractionTag(xhtml, 'uk-gaap:TurnoverGrossOperatingRevenue') ??
    extractNonFractionTag(xhtml, 'uk-core:TurnoverGrossOperatingRevenue') ??
    0;

  const costOfSalesPence =
    extractNonFractionTag(xhtml, 'uk-gaap:CostSales') ??
    extractNonFractionTag(xhtml, 'uk-core:CostSales') ??
    0;

  const otherChargesPence =
    extractNonFractionTag(xhtml, 'uk-gaap:OtherOperatingChargesExpenses') ??
    extractNonFractionTag(xhtml, 'uk-core:OtherOperatingChargesExpenses') ??
    0;

  const taxExpensePence =
    extractNonFractionTag(xhtml, 'uk-gaap:TaxTaxCreditOnProfitOrLossOnOrdinaryActivities') ??
    extractNonFractionTag(xhtml, 'uk-core:TaxTaxCreditOnProfitOrLossOnOrdinaryActivities') ??
    0;

  const netProfitAfterTaxPence =
    extractNonFractionTag(xhtml, 'uk-gaap:ProfitLossForPeriod') ??
    extractNonFractionTag(xhtml, 'uk-core:ProfitLossForPeriod') ??
    (turnoverPence - costOfSalesPence - otherChargesPence - taxExpensePence);

  // Extract Balance Sheet
  const tangibleFixedAssetsPence =
    extractNonFractionTag(xhtml, 'uk-gaap:PropertyPlantEquipment') ??
    extractNonFractionTag(xhtml, 'uk-core:PropertyPlantEquipment') ??
    0;

  const debtorsPence =
    extractNonFractionTag(xhtml, 'uk-gaap:Debtors') ??
    extractNonFractionTag(xhtml, 'uk-core:Debtors') ??
    0;

  const cashAtBankPence =
    extractNonFractionTag(xhtml, 'uk-gaap:CashBankOnHand') ??
    extractNonFractionTag(xhtml, 'uk-core:CashBankOnHand') ??
    0;

  const creditorsDueWithinOneYearPence =
    extractNonFractionTag(xhtml, 'uk-gaap:CreditorsDueWithinOneYear') ??
    extractNonFractionTag(xhtml, 'uk-core:CreditorsDueWithinOneYear') ??
    0;

  const calledUpShareCapitalPence =
    extractNonFractionTag(xhtml, 'uk-core:CalledUpShareCapitalNotPaidNotExpressedAsCurrentAsset') ??
    extractNonFractionTag(xhtml, 'uk-gaap:CalledUpShareCapital') ??
    extractNonFractionTag(xhtml, 'uk-core:CalledUpShareCapital') ??
    10000; // default £100

  const profitLossReservePence =
    extractNonFractionTag(xhtml, 'uk-gaap:ProfitLossAccountReserve') ??
    extractNonFractionTag(xhtml, 'uk-core:ProfitLossAccountReserve') ??
    0;

  // Metadata
  const approvalDate =
    extractNonNumericTag(xhtml, 'uk-direp:DateApprovalAccounts') ??
    extractNonNumericTag(xhtml, 'uk-core:DateApprovalAccounts') ??
    undefined;

  const directorName =
    extractNonNumericTag(xhtml, 'uk-direp:NameEntityOfficer') ??
    extractNonNumericTag(xhtml, 'uk-core:NameEntityOfficer') ??
    undefined;

  // Calculate Balance Sheet Identities
  const netCurrentAssetsPence = (debtorsPence + cashAtBankPence) - creditorsDueWithinOneYearPence;
  const totalAssetsLessCurrentLiabilitiesPence =
    extractNonFractionTag(xhtml, 'uk-core:TotalAssetsLessCurrentLiabilities') ??
    (tangibleFixedAssetsPence + netCurrentAssetsPence);

  const netAssetsPence =
    extractNonFractionTag(xhtml, 'uk-core:NetAssetsLiabilities') ??
    extractNonFractionTag(xhtml, 'uk-gaap:NetAssetsLiabilities') ??
    totalAssetsLessCurrentLiabilitiesPence;

  // Extracted or derived Shareholder Funds
  const taggedShareholderFunds =
    extractNonFractionTag(xhtml, 'uk-core:Equity') ??
    extractNonFractionTag(xhtml, 'uk-gaap:ShareholderFunds') ??
    extractNonFractionTag(xhtml, 'uk-core:ShareholderFunds');

  const shareholderFundsPence = taggedShareholderFunds ?? (calledUpShareCapitalPence + profitLossReservePence);

  const variancePence = netAssetsPence - shareholderFundsPence;
  const isBalanceSheetSymmetric = variancePence === 0;

  // Infer period end from instant or endDate context tag, or fallback
  let periodEnd = fallbackPeriodEnd;
  const instantMatch = xhtml.match(/<xbrli:instant>(\d{4}-\d{2}-\d{2})<\/xbrli:instant>/i);
  const endDateMatch = xhtml.match(/<xbrli:endDate>(\d{4}-\d{2}-\d{2})<\/xbrli:endDate>/i);
  if (instantMatch) {
    periodEnd = instantMatch[1];
  } else if (endDateMatch) {
    periodEnd = endDateMatch[1];
  } else if (approvalDate) {
    periodEnd = fallbackPeriodEnd;
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
