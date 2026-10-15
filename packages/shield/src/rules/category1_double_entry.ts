import type { ShieldInput, RuleEvaluation } from '../types.ts';

export function evaluateCategory1(input: ShieldInput): RuleEvaluation[] {
  const evaluations: RuleEvaluation[] = [];
  const { ledger } = input;

  // RULE 01: Net Assets = Total Shareholders' Funds
  const currentAssets = ledger.debtorsPence + ledger.cashPence;
  const netAssets =
    ledger.fixedAssetsPence +
    currentAssets -
    ledger.creditorsUnderOneYearPence -
    ledger.creditorsOverOneYearPence -
    ledger.provisionsPence;

  const totalShareholdersFunds = ledger.shareCapitalPence + ledger.closingRetainedEarningsPence;
  const balanceDiscrepancy = netAssets - totalShareholdersFunds;

  if (balanceDiscrepancy === 0) {
    evaluations.push({
      id: 'RULE_01',
      name: 'Double-Entry Balance Sheet Equation',
      category: 'Double-Entry Mathematics',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Net Assets exactly equal Total Shareholders’ Funds down to integer penny (£0.00 variance).',
    });
  } else {
    evaluations.push({
      id: 'RULE_01',
      name: 'Double-Entry Balance Sheet Equation',
      category: 'Double-Entry Mathematics',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Balance Sheet equation does not balance: Net Assets (£${(netAssets / 100).toFixed(
        2
      )}) differs from Total Equity (£${(totalShareholdersFunds / 100).toFixed(2)}) by £${Math.abs(
        balanceDiscrepancy / 100
      ).toFixed(2)}.`,
      remediation: 'Reconcile your Balance Sheet assets, liabilities, and retained earnings reserves so Net Assets equals Total Shareholders’ Funds.',
      offendingFields: ['fixedAssetsPence', 'cashPence', 'debtorsPence', 'creditorsUnderOneYearPence', 'shareCapitalPence', 'closingRetainedEarningsPence'],
    });
  }

  // RULE 02: Debits Equal Credits
  if (ledger.totalDebitsPence !== undefined && ledger.totalCreditsPence !== undefined) {
    const tbDiff = ledger.totalDebitsPence - ledger.totalCreditsPence;
    if (tbDiff === 0) {
      evaluations.push({
        id: 'RULE_02',
        name: 'Trial Balance Parity',
        category: 'Double-Entry Mathematics',
        severity: 'FATAL',
        status: 'PASS',
        message: 'Total Debits equal Total Credits (£0.00 variance).',
      });
    } else {
      evaluations.push({
        id: 'RULE_02',
        name: 'Trial Balance Parity',
        category: 'Double-Entry Mathematics',
        severity: 'FATAL',
        status: 'FAIL',
        message: `Trial Balance does not balance: Debits (£${(ledger.totalDebitsPence / 100).toFixed(
          2
        )}) do not equal Credits (£${(ledger.totalCreditsPence / 100).toFixed(2)}). Variance: £${(
          Math.abs(tbDiff) / 100
        ).toFixed(2)}.`,
        remediation: 'Check imported journal entries or CSV rows for unbalanced transactions.',
        offendingFields: ['totalDebitsPence', 'totalCreditsPence'],
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_02',
      name: 'Trial Balance Parity',
      category: 'Double-Entry Mathematics',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Not applicable (standard manual accounts entry).',
    });
  }

  // RULE 03: Called-up Share Capital >= £1.00
  if (ledger.shareCapitalPence >= 100) {
    evaluations.push({
      id: 'RULE_03',
      name: 'Called-Up Share Capital Minimum',
      category: 'Double-Entry Mathematics',
      severity: 'FATAL',
      status: 'PASS',
      message: `Called-up share capital is valid (£${(ledger.shareCapitalPence / 100).toFixed(2)}).`,
    });
  } else {
    evaluations.push({
      id: 'RULE_03',
      name: 'Called-Up Share Capital Minimum',
      category: 'Double-Entry Mathematics',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Called-up share capital must be at least £1.00 for an active company limited by shares (current: £${(
        ledger.shareCapitalPence / 100
      ).toFixed(2)}).`,
      remediation: 'Set Called-Up Share Capital to at least £1.00 (100 pence) to reflect issued company shares.',
      offendingFields: ['shareCapitalPence'],
    });
  }

  // RULE 04: Overdrawn Cash Warning
  if (ledger.cashPence < 0) {
    evaluations.push({
      id: 'RULE_04',
      name: 'Bank Overdraft Classification',
      category: 'Double-Entry Mathematics',
      severity: 'WARN',
      status: 'FAIL',
      message: `Cash at bank is reported as negative (£${(ledger.cashPence / 100).toFixed(
        2
      )}). Bank overdrafts should legally be classified under Creditors falling due within one year rather than negative cash.`,
      remediation: 'Move overdrawn bank balance to Creditors: amounts falling due within one year and set Cash to £0.',
      offendingFields: ['cashPence', 'creditorsUnderOneYearPence'],
    });
  } else {
    evaluations.push({
      id: 'RULE_04',
      name: 'Bank Overdraft Classification',
      category: 'Double-Entry Mathematics',
      severity: 'WARN',
      status: 'PASS',
      message: 'Cash at bank balance is non-negative.',
    });
  }

  // RULE 05: Negative Debtors or Creditors
  if (ledger.debtorsPence < 0 || ledger.creditorsUnderOneYearPence < 0 || ledger.creditorsOverOneYearPence < 0) {
    evaluations.push({
      id: 'RULE_05',
      name: 'Receivables & Payables Sign Convention',
      category: 'Double-Entry Mathematics',
      severity: 'WARN',
      status: 'FAIL',
      message: 'Debtors or Creditors balances are reported with negative amounts. Verify this is not an inverted sign error.',
      remediation: 'Ensure assets and liabilities are reported as positive balances on the Balance Sheet.',
      offendingFields: ['debtorsPence', 'creditorsUnderOneYearPence', 'creditorsOverOneYearPence'],
    });
  } else {
    evaluations.push({
      id: 'RULE_05',
      name: 'Receivables & Payables Sign Convention',
      category: 'Double-Entry Mathematics',
      severity: 'WARN',
      status: 'PASS',
      message: 'Debtors and Creditors balances follow positive convention.',
    });
  }

  return evaluations;
}

