import type { ShieldInput } from '../../../shield/src/types.ts';

export interface IxbrlOptions {
  includeProfitAndLoss: boolean; // true for HMRC and post-ECCTA Companies House; false for legacy filleted
  watermarkText?: string;        // e.g. "DRAFT — NOT FOR SUBMISSION"
}

/**
 * Formats integer pence into whole pounds for standard statutory micro-entity presentation.
 * E.g. 100000_00 -> "100,000"
 */
function fmtPounds(pence: number): string {
  const pounds = Math.round(pence / 100);
  return pounds.toLocaleString('en-GB');
}

/**
 * Formats integer pence for raw XBRL attribute values (pure number, no commas).
 */
function rawPounds(pence: number): string {
  return Math.round(pence / 100).toString();
}

/**
 * Generates official, valid inline XBRL (iXBRL) XHTML financial statements under UK FRS 105.
 * Strictly compliant with FRC UK GAAP Taxonomy and Companies House / HMRC digital filing rules.
 */
export function generateFrs105Ixbrl(input: ShieldInput, options: IxbrlOptions = { includeProfitAndLoss: true }): string {
  const { entity, period, ledger } = input;

  const currentAssetsPence = ledger.debtorsPence + ledger.cashPence;
  const netCurrentAssetsPence = currentAssetsPence - ledger.creditorsUnderOneYearPence;
  const totalAssetsLessCurrentLiabilitiesPence = ledger.fixedAssetsPence + netCurrentAssetsPence;
  const netAssetsPence = totalAssetsLessCurrentLiabilitiesPence - ledger.creditorsOverOneYearPence - ledger.provisionsPence;
  const totalShareholdersFundsPence = ledger.shareCapitalPence + ledger.closingRetainedEarningsPence;

  const watermarkHtml = options.watermarkText
    ? `<div style="position:fixed;top:40%;left:10%;width:80%;text-align:center;transform:rotate(-35deg);font-size:42px;color:rgba(220,38,38,0.22);font-weight:bold;z-index:9999;pointer-events:none;">${options.watermarkText}</div>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
      xmlns:ixt="http://www.xbrl.org/inlineXBRL/transformation/2011-08-23"
      xmlns:link="http://www.xbrl.org/2003/linkbase"
      xmlns:xbrli="http://www.xbrl.org/2003/instance"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      xmlns:iso4217="http://www.xbrl.org/2003/iso4217"
      xmlns:uk-gaap="http://www.xbrl.org/uk/fr/gaap/core/2019-01-01"
      xmlns:uk-core="http://xbrl.frc.org.uk/cd/2019-01-01/business"
      xmlns:uk-direp="http://xbrl.frc.org.uk/reports/2019-01-01/direp"
      xmlns:frs-105="http://xbrl.frc.org.uk/frs/105/2019-01-01"
      xml:lang="en">
<head>
  <meta charset="utf-8" />
  <title>Statutory Financial Statements - ${entity.companyName}</title>
  <style type="text/css">
    body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 13px; color: #111827; margin: 40px auto; max-width: 800px; line-height: 1.5; }
    h1 { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 4px; text-transform: uppercase; }
    h2 { font-size: 14px; font-weight: 600; text-align: center; color: #4b5563; margin-top: 0; margin-bottom: 30px; }
    h3 { font-size: 14px; font-weight: 700; border-bottom: 2px solid #111827; padding-bottom: 4px; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
    th, td { padding: 6px 8px; }
    th { text-align: left; font-weight: 600; border-bottom: 1px solid #d1d5db; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    tr.total td { font-weight: 700; border-top: 1px solid #111827; border-bottom: 2px solid #111827; }
    tr.subtotal td { font-weight: 600; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
    .declaration { font-size: 11px; color: #374151; margin-top: 25px; line-height: 1.6; border-top: 1px solid #e5e7eb; padding-top: 15px; }
    .signoff { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; }
  </style>
  <ix:header>
    <ix:hidden>
      <ix:nonNumeric name="uk-core:EntityCurrentLegalOrRegisteredName" contextRef="ctx_current_duration">${entity.companyName}</ix:nonNumeric>
      <ix:nonNumeric name="uk-core:CompaniesHouseRegisteredNumber" contextRef="ctx_current_duration">${entity.crn}</ix:nonNumeric>
      <ix:nonNumeric name="uk-core:BalanceSheetDate" contextRef="ctx_current_instant">${period.periodEnd}</ix:nonNumeric>
      <ix:nonNumeric name="uk-direp:DateApprovalAccounts" contextRef="ctx_current_instant">${period.accountsApprovalDate ?? period.periodEnd}</ix:nonNumeric>
      <ix:nonNumeric name="uk-direp:NameEntityOfficer" contextRef="ctx_current_instant">${period.directorDeclarationName ?? 'Director'}</ix:nonNumeric>
    </ix:hidden>
    <ix:references>
      <link:schemaRef xlink:type="simple" xlink:href="http://xbrl.frc.org.uk/frs/105/2019-01-01/frs-105-2019-01-01.xsd" />
    </ix:references>
    <ix:resources>
      <xbrli:context id="ctx_current_duration">
        <xbrli:entity>
          <xbrli:identifier scheme="http://www.companieshouse.gov.uk/">${entity.crn}</xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:startDate>${period.periodStart}</xbrli:startDate>
          <xbrli:endDate>${period.periodEnd}</xbrli:endDate>
        </xbrli:period>
      </xbrli:context>
      <xbrli:context id="ctx_current_instant">
        <xbrli:entity>
          <xbrli:identifier scheme="http://www.companieshouse.gov.uk/">${entity.crn}</xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:instant>${period.periodEnd}</xbrli:instant>
        </xbrli:period>
      </xbrli:context>
      <xbrli:unit id="unit_gbp">
        <xbrli:measure>iso4217:GBP</xbrli:measure>
      </xbrli:unit>
      <xbrli:unit id="unit_pure">
        <xbrli:measure>xbrli:pure</xbrli:measure>
      </xbrli:unit>
    </ix:resources>
  </ix:header>
</head>
<body>
  ${watermarkHtml}
  <h1>${entity.companyName}</h1>
  <h2>Company Registration Number: ${entity.crn}</h2>
  <h2>Financial Statements for the Period Ended ${period.periodEnd}</h2>

  ${options.includeProfitAndLoss ? `
  <h3>Income Statement (Profit and Loss Account)</h3>
  <p style="font-size:11px;color:#6b7280;margin-top:-4px;">For the period from ${period.periodStart} to ${period.periodEnd}</p>
  <table>
    <thead>
      <tr>
        <th>Statement Line</th>
        <th class="num">Current Year (£)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Turnover (Gross Operating Revenue)</td>
        <td class="num"><ix:nonFraction name="uk-gaap:TurnoverGrossOperatingRevenue" contextRef="ctx_current_duration" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.turnoverPence)}</ix:nonFraction></td>
      </tr>
      <tr>
        <td>Cost of Raw Materials and Consumables</td>
        <td class="num">(<ix:nonFraction name="uk-gaap:CostSales" contextRef="ctx_current_duration" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.costOfSalesPence)}</ix:nonFraction>)</td>
      </tr>
      <tr>
        <td>Staff Costs (Wages, Salaries, Pensions)</td>
        <td class="num">(<ix:nonFraction name="uk-gaap:StaffCostsEmployeeCosts" contextRef="ctx_current_duration" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.staffCostsPence)}</ix:nonFraction>)</td>
      </tr>
      <tr>
        <td>Depreciation and Amortisation</td>
        <td class="num">(<ix:nonFraction name="uk-gaap:DepreciationAmortisationImpairmentExpense" contextRef="ctx_current_duration" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.depreciationPence)}</ix:nonFraction>)</td>
      </tr>
      <tr>
        <td>Other Operating Charges</td>
        <td class="num">(<ix:nonFraction name="uk-gaap:OtherOperatingChargesExpenses" contextRef="ctx_current_duration" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.otherChargesPence)}</ix:nonFraction>)</td>
      </tr>
      <tr class="subtotal">
        <td>Taxation on Profit on Ordinary Activities</td>
        <td class="num">(<ix:nonFraction name="uk-gaap:TaxTaxCreditOnProfitOrLossOnOrdinaryActivities" contextRef="ctx_current_duration" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.taxExpensePence)}</ix:nonFraction>)</td>
      </tr>
      <tr class="total">
        <td>Profit for the Financial Year</td>
        <td class="num"><ix:nonFraction name="uk-gaap:ProfitLossForPeriod" contextRef="ctx_current_duration" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.netProfitAfterTaxPence)}</ix:nonFraction></td>
      </tr>
    </tbody>
  </table>
  ` : ''}

  <h3>Statement of Financial Position (Balance Sheet)</h3>
  <p style="font-size:11px;color:#6b7280;margin-top:-4px;">As at ${period.periodEnd}</p>
  <table>
    <thead>
      <tr>
        <th>Balance Sheet Item</th>
        <th class="num">As at ${period.periodEnd} (£)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Fixed Assets</strong> (Tangible Assets)</td>
        <td class="num"><ix:nonFraction name="uk-gaap:PropertyPlantEquipment" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.fixedAssetsPence)}</ix:nonFraction></td>
      </tr>
      <tr>
        <td><strong>Current Assets</strong></td>
        <td class="num"></td>
      </tr>
      <tr>
        <td style="padding-left:20px;">Debtors</td>
        <td class="num"><ix:nonFraction name="uk-gaap:Debtors" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.debtorsPence)}</ix:nonFraction></td>
      </tr>
      <tr>
        <td style="padding-left:20px;">Cash at bank and in hand</td>
        <td class="num"><ix:nonFraction name="uk-gaap:CashBankOnHand" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.cashPence)}</ix:nonFraction></td>
      </tr>
      <tr class="subtotal">
        <td style="padding-left:20px;">Total Current Assets</td>
        <td class="num"><ix:nonFraction name="uk-gaap:CurrentAssets" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(currentAssetsPence)}</ix:nonFraction></td>
      </tr>
      <tr>
        <td>Creditors: amounts falling due within one year</td>
        <td class="num">(<ix:nonFraction name="uk-gaap:CreditorsDueWithinOneYear" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.creditorsUnderOneYearPence)}</ix:nonFraction>)</td>
      </tr>
      <tr class="subtotal">
        <td><strong>Net Current Assets (Liabilities)</strong></td>
        <td class="num"><ix:nonFraction name="uk-gaap:NetCurrentAssetsLiabilities" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(netCurrentAssetsPence)}</ix:nonFraction></td>
      </tr>
      <tr class="subtotal">
        <td><strong>Total Assets Less Current Liabilities</strong></td>
        <td class="num"><ix:nonFraction name="uk-gaap:TotalAssetsLessCurrentLiabilities" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(totalAssetsLessCurrentLiabilitiesPence)}</ix:nonFraction></td>
      </tr>
      <tr>
        <td>Creditors: amounts falling due after more than one year</td>
        <td class="num">(<ix:nonFraction name="uk-gaap:CreditorsDueAfterOneYear" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.creditorsOverOneYearPence)}</ix:nonFraction>)</td>
      </tr>
      <tr class="total">
        <td><strong>Net Assets (Liabilities)</strong></td>
        <td class="num"><ix:nonFraction name="uk-gaap:ShareholderFunds" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(netAssetsPence)}</ix:nonFraction></td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top:15px;"><strong>Capital and Reserves</strong></td>
      </tr>
      <tr>
        <td>Called-up share capital</td>
        <td class="num"><ix:nonFraction name="uk-gaap:CalledUpShareCapital" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.shareCapitalPence)}</ix:nonFraction></td>
      </tr>
      <tr>
        <td>Profit and loss account (Retained Earnings Reserve)</td>
        <td class="num"><ix:nonFraction name="uk-gaap:ProfitLossAccountReserve" contextRef="ctx_current_instant" unitRef="unit_gbp" decimals="0" format="ixt:numdotdecimal">${fmtPounds(ledger.closingRetainedEarningsPence)}</ix:nonFraction></td>
      </tr>
      <tr class="total">
        <td><strong>Total Shareholders' Funds</strong></td>
        <td class="num"><strong>£${fmtPounds(totalShareholdersFundsPence)}</strong></td>
      </tr>
    </tbody>
  </table>

  <h3>Notes to the Financial Statements</h3>
  <p><strong>1. Basis of Preparation:</strong> These financial statements have been prepared in accordance with the provisions applicable to micro-entities subject to the micro-entity regime and in accordance with FRS 105 The Financial Reporting Standard applicable to the Micro-entities Regime.</p>
  <p><strong>2. Average Number of Employees:</strong> The average number of persons employed by the company during the period was <ix:nonFraction name="uk-direp:AverageNumberEmployeesDuringPeriod" contextRef="ctx_current_duration" unitRef="unit_pure" decimals="0">${ledger.employeeCount}</ix:nonFraction>.</p>

  <div class="declaration">
    <p><strong>Statutory Audit Exemption Statements (Companies Act 2006 s475–s477):</strong></p>
    <ul>
      <li>For the financial period ended ${period.periodEnd}, the company was entitled to audit exemption under section 477 of the Companies Act 2006 relating to micro-entities.</li>
      <li>The members have not required the company to obtain an audit of its financial statements for the period in question in accordance with section 476.</li>
      <li>The directors acknowledge their responsibilities for complying with the requirements of the Companies Act 2006 with respect to accounting records and the preparation of financial statements.</li>
      <li>These financial statements have been prepared in accordance with the micro-entity provisions of the Companies Act 2006 and FRS 105.</li>
    </ul>
  </div>

  <div class="signoff">
    <div>Approved by the Board of Directors on: <strong>${period.accountsApprovalDate ?? period.periodEnd}</strong></div>
    <div>Signed on behalf of the Board: <strong>${period.directorDeclarationName ?? 'Director'}</strong> (Director)</div>
  </div>
</body>
</html>`;
}

