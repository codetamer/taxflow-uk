import type { ShieldInput, RuleEvaluation } from '../types.ts';

export function evaluateCategory3(input: ShieldInput): RuleEvaluation[] {
  const evaluations: RuleEvaluation[] = [];
  const { tax } = input;

  // RULE 11: Total Profits Parity (Box 315 = Box 155 + Box 170 / Property Profits)
  const expectedTtp = Math.max(0, tax.tradingProfitPence) + tax.nonTradingIncomePence;
  if (tax.ttpPence === expectedTtp) {
    evaluations.push({
      id: 'RULE_11',
      name: 'Total Taxable Profits Parity (CT600 Box 315)',
      category: 'CT600 Box Parity & Marginal Relief',
      severity: 'FATAL',
      status: 'PASS',
      message: `Total Taxable Profits (£${(tax.ttpPence / 100).toFixed(
        2
      )}) exactly equals Trading Profit + Non-Trading Property/Interest Income.`,
    });
  } else {
    evaluations.push({
      id: 'RULE_11',
      name: 'Total Taxable Profits Parity (CT600 Box 315)',
      category: 'CT600 Box Parity & Marginal Relief',
      severity: 'FATAL',
      status: 'FAIL',
      message: `CT600 Box 315 parity failure: Total Taxable Profits (£${(tax.ttpPence / 100).toFixed(
        2
      )}) does not equal Trading Profit (£${(Math.max(0, tax.tradingProfitPence) / 100).toFixed(
        2
      )}) + Non-Trading Income (£${(tax.nonTradingIncomePence / 100).toFixed(2)}).`,
      remediation: 'Ensure Total Taxable Profits (Box 315) correctly sums trading profit after allowances and non-trading income.',
      offendingFields: ['ttpPence', 'tradingProfitPence', 'nonTradingIncomePence'],
    });
  }

  // RULE 12: Small Profits Rate Check (Augmented Profits <= Lower Limit)
  if (tax.augmentedProfitsPence <= tax.lowerLimitPence && tax.ttpPence > 0) {
    const expectedTax = Math.round((tax.ttpPence * 19) / 100);
    if (tax.ctPayablePence === expectedTax && tax.marginalReliefPence === 0) {
      evaluations.push({
        id: 'RULE_12',
        name: 'Small Profits Rate Consistency (19%)',
        category: 'CT600 Box Parity & Marginal Relief',
        severity: 'FATAL',
        status: 'PASS',
        message: `Small Profits Rate correctly applied at 19% (£${(tax.ctPayablePence / 100).toFixed(2)}).`,
      });
    } else {
      evaluations.push({
        id: 'RULE_12',
        name: 'Small Profits Rate Consistency (19%)',
        category: 'CT600 Box Parity & Marginal Relief',
        severity: 'FATAL',
        status: 'FAIL',
        message: `Small profits rate discrepancy: profits under lower limit (£${(tax.lowerLimitPence / 100).toFixed(
          2
        )}) must be taxed at 19% with £0 marginal relief. Calculated tax: £${(tax.ctPayablePence / 100).toFixed(
          2
        )}, expected: £${(expectedTax / 100).toFixed(2)}.`,
        remediation: 'Verify Corporation Tax payable matches 19% of Total Taxable Profits.',
        offendingFields: ['ctPayablePence', 'marginalReliefPence'],
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_12',
      name: 'Small Profits Rate Consistency (19%)',
      category: 'CT600 Box Parity & Marginal Relief',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Not applicable (profits exceed lower limit or profits are zero).',
    });
  }

  // RULE 13: Main Rate Check (Augmented Profits >= Upper Limit)
  if (tax.augmentedProfitsPence >= tax.upperLimitPence && tax.ttpPence > 0) {
    const expectedTax = Math.round((tax.ttpPence * 25) / 100);
    if (tax.ctPayablePence === expectedTax && tax.marginalReliefPence === 0) {
      evaluations.push({
        id: 'RULE_13',
        name: 'Main Rate Consistency (25%)',
        category: 'CT600 Box Parity & Marginal Relief',
        severity: 'FATAL',
        status: 'PASS',
        message: `Main Rate correctly applied at 25% (£${(tax.ctPayablePence / 100).toFixed(2)}).`,
      });
    } else {
      evaluations.push({
        id: 'RULE_13',
        name: 'Main Rate Consistency (25%)',
        category: 'CT600 Box Parity & Marginal Relief',
        severity: 'FATAL',
        status: 'FAIL',
        message: `Main rate discrepancy: profits over upper limit (£${(tax.upperLimitPence / 100).toFixed(
          2
        )}) must be taxed at 25% with £0 marginal relief. Calculated tax: £${(tax.ctPayablePence / 100).toFixed(
          2
        )}, expected: £${(expectedTax / 100).toFixed(2)}.`,
        remediation: 'Verify Corporation Tax payable matches 25% of Total Taxable Profits.',
        offendingFields: ['ctPayablePence', 'marginalReliefPence'],
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_13',
      name: 'Main Rate Consistency (25%)',
      category: 'CT600 Box Parity & Marginal Relief',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Not applicable (profits below upper limit or profits are zero).',
    });
  }

  // RULE 14: Statutory Marginal Relief Formula Check
  if (tax.augmentedProfitsPence > tax.lowerLimitPence && tax.augmentedProfitsPence < tax.upperLimitPence && tax.ttpPence > 0) {
    const expectedCtBefore = Math.round((tax.ttpPence * 25) / 100);
    const expectedMr = Math.round(
      (3 * (tax.upperLimitPence - tax.augmentedProfitsPence) * tax.ttpPence) / (200 * tax.augmentedProfitsPence)
    );
    const expectedCtAfter = expectedCtBefore - expectedMr;

    const diff = Math.abs(tax.ctPayablePence - expectedCtAfter);
    if (diff <= 1) {
      // within 1p rounding tolerance
      evaluations.push({
        id: 'RULE_14',
        name: 'Statutory Marginal Relief Formula',
        category: 'CT600 Box Parity & Marginal Relief',
        severity: 'FATAL',
        status: 'PASS',
        message: `Marginal Relief (£${(tax.marginalReliefPence / 100).toFixed(
          2
        )}) correctly calculated using statutory fraction 3/200.`,
      });
    } else {
      evaluations.push({
        id: 'RULE_14',
        name: 'Statutory Marginal Relief Formula',
        category: 'CT600 Box Parity & Marginal Relief',
        severity: 'FATAL',
        status: 'FAIL',
        message: `Marginal relief computation mismatch: computed tax £${(tax.ctPayablePence / 100).toFixed(
          2
        )} does not match statutory formula result £${(expectedCtAfter / 100).toFixed(2)} (relief: £${(
          expectedMr / 100
        ).toFixed(2)}).`,
        remediation: 'Re-run the statutory marginal relief computation using the reference engine.',
        offendingFields: ['ctPayablePence', 'marginalReliefPence'],
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_14',
      name: 'Statutory Marginal Relief Formula',
      category: 'CT600 Box Parity & Marginal Relief',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Not applicable (augmented profits outside marginal relief band).',
    });
  }

  // RULE 15: Franked Investment Income Exclusion from TTP
  if (tax.exemptDistributionsPence > 0) {
    if (tax.augmentedProfitsPence === tax.ttpPence + tax.exemptDistributionsPence) {
      evaluations.push({
        id: 'RULE_15',
        name: 'Franked Investment Income Augmented Profits Bridge',
        category: 'CT600 Box Parity & Marginal Relief',
        severity: 'FATAL',
        status: 'PASS',
        message: 'Franked Investment Income is correctly included in Augmented Profits and excluded from Taxable Profits.',
      });
    } else {
      evaluations.push({
        id: 'RULE_15',
        name: 'Franked Investment Income Augmented Profits Bridge',
        category: 'CT600 Box Parity & Marginal Relief',
        severity: 'FATAL',
        status: 'FAIL',
        message: 'Franked Investment Income was improperly added to Total Taxable Profits or omitted from Augmented Profits.',
        remediation: 'Ensure non-group UK dividends are added to Augmented Profits only to scale marginal relief.',
        offendingFields: ['augmentedProfitsPence', 'exemptDistributionsPence', 'ttpPence'],
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_15',
      name: 'Franked Investment Income Augmented Profits Bridge',
      category: 'CT600 Box Parity & Marginal Relief',
      severity: 'FATAL',
      status: 'PASS',
      message: 'No exempt distributions reported (£0 FII).',
    });
  }

  return evaluations;
}

