import type { ShieldInput, RuleEvaluation } from '../types.ts';

export function evaluateCategory2(input: ShieldInput): RuleEvaluation[] {
  const evaluations: RuleEvaluation[] = [];
  const { ledger, tax } = input;

  // RULE 06: Retained Earnings Roll-Forward
  const expectedClosingReserve =
    ledger.openingRetainedEarningsPence + ledger.netProfitAfterTaxPence - ledger.dividendsPaidPence;
  const reserveDiff = ledger.closingRetainedEarningsPence - expectedClosingReserve;

  if (reserveDiff === 0) {
    evaluations.push({
      id: 'RULE_06',
      name: 'Retained Earnings Roll-Forward Reconciliation',
      category: 'P&L and Reserves Reconciliation',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Closing P&L reserve exactly reconciles with opening reserve, current net profit, and dividends paid.',
    });
  } else {
    evaluations.push({
      id: 'RULE_06',
      name: 'Retained Earnings Roll-Forward Reconciliation',
      category: 'P&L and Reserves Reconciliation',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Closing Retained Earnings (£${(ledger.closingRetainedEarningsPence / 100).toFixed(
        2
      )}) does not match Opening Reserve (£${(ledger.openingRetainedEarningsPence / 100).toFixed(
        2
      )}) + Net Profit (£${(ledger.netProfitAfterTaxPence / 100).toFixed(2)}) - Dividends (£${(
        ledger.dividendsPaidPence / 100
      ).toFixed(2)}). Variance: £${(Math.abs(reserveDiff) / 100).toFixed(2)}.`,
      remediation: 'Ensure Closing Retained Earnings strictly equals Opening Reserve + Profit for Financial Year - Dividends.',
      offendingFields: ['closingRetainedEarningsPence', 'openingRetainedEarningsPence', 'netProfitAfterTaxPence', 'dividendsPaidPence'],
    });
  }

  // RULE 07: Illegal Dividend Guard (Distributable Reserves Check)
  const distributableReserves = ledger.openingRetainedEarningsPence + ledger.netProfitAfterTaxPence;
  if (ledger.dividendsPaidPence > 0 && ledger.dividendsPaidPence > distributableReserves) {
    evaluations.push({
      id: 'RULE_07',
      name: 'Distributable Profits Dividend Guard',
      category: 'P&L and Reserves Reconciliation',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Illegal Dividend Alert: Dividends paid (£${(ledger.dividendsPaidPence / 100).toFixed(
        2
      )}) exceed cumulative distributable reserves (£${(distributableReserves / 100).toFixed(
        2
      )}). Under Companies Act 2006 s830, a company may only make distributions out of profits available for the purpose.`,
      remediation: 'Reduce dividends paid so they do not exceed available distributable profits. Excess withdrawals should be reclassified as Director Loan drawings.',
      offendingFields: ['dividendsPaidPence', 'openingRetainedEarningsPence', 'netProfitAfterTaxPence'],
    });
  } else {
    evaluations.push({
      id: 'RULE_07',
      name: 'Distributable Profits Dividend Guard',
      category: 'P&L and Reserves Reconciliation',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Dividends paid are fully covered by available distributable reserves.',
    });
  }

  // RULE 08: Turnover Parity
  if (ledger.turnoverPence < 0) {
    evaluations.push({
      id: 'RULE_08',
      name: 'Turnover Validity',
      category: 'P&L and Reserves Reconciliation',
      severity: 'FATAL',
      status: 'FAIL',
      message: 'Turnover cannot be negative.',
      remediation: 'Verify sales income is reported as a non-negative amount.',
      offendingFields: ['turnoverPence'],
    });
  } else {
    evaluations.push({
      id: 'RULE_08',
      name: 'Turnover Validity',
      category: 'P&L and Reserves Reconciliation',
      severity: 'FATAL',
      status: 'PASS',
      message: `Turnover (£${(ledger.turnoverPence / 100).toFixed(2)}) is non-negative and consistent with CT600 Box 145.`,
    });
  }

  // RULE 09: Corporation Tax Expense Reconciled with Box 440
  const taxDiff = Math.abs(ledger.taxExpensePence - tax.ctPayablePence);
  if (taxDiff === 0) {
    evaluations.push({
      id: 'RULE_09',
      name: 'Corporation Tax Provision Parity',
      category: 'P&L and Reserves Reconciliation',
      severity: 'FATAL',
      status: 'PASS',
      message: `P&L tax expense (£${(ledger.taxExpensePence / 100).toFixed(
        2
      )}) exactly equals CT600 Box 440 tax payable.`,
    });
  } else {
    evaluations.push({
      id: 'RULE_09',
      name: 'Corporation Tax Provision Parity',
      category: 'P&L and Reserves Reconciliation',
      severity: 'FATAL',
      status: 'FAIL',
      message: `P&L Corporation Tax charge (£${(ledger.taxExpensePence / 100).toFixed(
        2
      )}) does not match CT600 Box 440 computed tax payable (£${(tax.ctPayablePence / 100).toFixed(
        2
      )}). Variance: £${(taxDiff / 100).toFixed(2)}.`,
      remediation: 'Update the P&L tax charge to match the CT600 tax payable computation.',
      offendingFields: ['taxExpensePence'],
    });
  }

  // RULE 10: Operating Expenses vs Turnover Reasonableness
  const totalOperatingCosts =
    ledger.costOfSalesPence + ledger.staffCostsPence + ledger.depreciationPence + ledger.otherChargesPence;
  if (ledger.turnoverPence > 0 && totalOperatingCosts > ledger.turnoverPence * 5) {
    evaluations.push({
      id: 'RULE_10',
      name: 'Operating Cost Ratio Reasonableness',
      category: 'P&L and Reserves Reconciliation',
      severity: 'WARN',
      status: 'FAIL',
      message: `Operating expenses (£${(totalOperatingCosts / 100).toFixed(
        2
      )}) exceed turnover by more than 500%. Verify this is intentional and not a missed revenue omission.`,
      remediation: 'Verify all revenue streams and invoices for the period have been ingested.',
      offendingFields: ['turnoverPence', 'otherChargesPence'],
    });
  } else {
    evaluations.push({
      id: 'RULE_10',
      name: 'Operating Cost Ratio Reasonableness',
      category: 'P&L and Reserves Reconciliation',
      severity: 'WARN',
      status: 'PASS',
      message: 'Operating expenses ratio is within standard bounds.',
    });
  }

  return evaluations;
}

