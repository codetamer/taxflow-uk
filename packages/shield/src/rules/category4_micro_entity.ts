import type { ShieldInput, RuleEvaluation } from '../types.ts';

export function evaluateCategory4(input: ShieldInput): RuleEvaluation[] {
  const evaluations: RuleEvaluation[] = [];
  const { entity, ledger, tax } = input;

  // RULE 16: Two-of-Three Micro-Entity Qualification Test (Companies Act 2006 s384A)
  const turnoverLimit = 1_000_000_00; // £1,000,000
  const balanceSheetLimit = 500_000_00; // £500,000 gross assets
  const employeeLimit = 10;

  const grossAssets = ledger.fixedAssetsPence + ledger.debtorsPence + ledger.cashPence;
  let exceededCount = 0;

  if (ledger.turnoverPence > turnoverLimit) exceededCount++;
  if (grossAssets > balanceSheetLimit) exceededCount++;
  if (ledger.employeeCount > employeeLimit) exceededCount++;

  if (exceededCount >= 2) {
    evaluations.push({
      id: 'RULE_16',
      name: 'Micro-Entity Statutory Size Test (2-of-3 Criteria)',
      category: 'Micro-Entity Statutory Qualification',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Ineligible for FRS 105 Micro-Entity Accounts: Company exceeds 2 of the 3 statutory thresholds (Turnover: £${(
        ledger.turnoverPence / 100
      ).toFixed(2)} / max £1M; Gross Assets: £${(grossAssets / 100).toFixed(2)} / max £500k; Employees: ${
        ledger.employeeCount
      } / max 10).`,
      remediation: 'This company must file small company accounts under FRS 102 Section 1A or medium/large company accounts.',
      offendingFields: ['turnoverPence', 'fixedAssetsPence', 'cashPence', 'debtorsPence', 'employeeCount'],
    });
  } else {
    evaluations.push({
      id: 'RULE_16',
      name: 'Micro-Entity Statutory Size Test (2-of-3 Criteria)',
      category: 'Micro-Entity Statutory Qualification',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Company qualifies as a micro-entity under Companies Act 2006 s384A.',
    });
  }

  // RULE 17: Excluded Entity Types
  if (entity.isCharityOrPlc) {
    evaluations.push({
      id: 'RULE_17',
      name: 'Excluded Corporate Structure Guard',
      category: 'Micro-Entity Statutory Qualification',
      severity: 'FATAL',
      status: 'FAIL',
      message: 'Charities, public limited companies (PLCs), and financial institutions are excluded by statute from FRS 105 micro-entity accounts.',
      remediation: 'Public companies and regulated entities must prepare accounts under full FRS 102 or IFRS.',
      offendingFields: ['isCharityOrPlc'],
    });
  } else {
    evaluations.push({
      id: 'RULE_17',
      name: 'Excluded Corporate Structure Guard',
      category: 'Micro-Entity Statutory Qualification',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Corporate structure is an eligible private company limited by shares/guarantee.',
    });
  }

  // RULE 18: Employee Count Integer 0..10
  if (!Number.isInteger(ledger.employeeCount) || ledger.employeeCount < 0 || ledger.employeeCount > 10) {
    evaluations.push({
      id: 'RULE_18',
      name: 'Employee Headcount Bounds',
      category: 'Micro-Entity Statutory Qualification',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Statutory average employee count must be an integer between 0 and 10 (received: ${ledger.employeeCount}).`,
      remediation: 'Enter a valid average employee count for the financial year (0 to 10).',
      offendingFields: ['employeeCount'],
    });
  } else {
    evaluations.push({
      id: 'RULE_18',
      name: 'Employee Headcount Bounds',
      category: 'Micro-Entity Statutory Qualification',
      severity: 'FATAL',
      status: 'PASS',
      message: `Employee count (${ledger.employeeCount}) is valid for micro-entity reporting.`,
    });
  }

  // RULE 19: Dormant Company Zero Activity Check (Fixing TinyTax's silent data-dropping bug)
  if (entity.companyType === 'DORMANT') {
    const hasActivity =
      ledger.turnoverPence !== 0 ||
      ledger.costOfSalesPence !== 0 ||
      ledger.staffCostsPence !== 0 ||
      ledger.otherChargesPence !== 0 ||
      (tax.directorLoans && tax.directorLoans.some((l) => (l.outstandingAtDueDatePence || 0) > 0));

    if (hasActivity) {
      evaluations.push({
        id: 'RULE_19',
        name: 'Dormant Company Activity Conflict Guard',
        category: 'Micro-Entity Statutory Qualification',
        severity: 'FATAL',
        status: 'FAIL',
        message: 'Dormant Company Inconsistency: The company type is set to Dormant, but financial activity (turnover, expenses, or director loans) is recorded. A dormant company must have no significant accounting transactions during the period (Companies Act 2006 s1169).',
        remediation: 'Change company type to "Trading" or "Property", or clear transaction entries to reflect a genuinely dormant entity.',
        offendingFields: ['companyType', 'turnoverPence', 'otherChargesPence'],
      });
    } else {
      evaluations.push({
        id: 'RULE_19',
        name: 'Dormant Company Activity Conflict Guard',
        category: 'Micro-Entity Statutory Qualification',
        severity: 'FATAL',
        status: 'PASS',
        message: 'Dormant company reports zero trading transactions.',
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_19',
      name: 'Dormant Company Activity Conflict Guard',
      category: 'Micro-Entity Statutory Qualification',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Not applicable (active company).',
    });
  }

  // RULE 20: Near-Threshold Transition Warning
  if (grossAssets > 450_000_00 || ledger.turnoverPence > 900_000_00) {
    evaluations.push({
      id: 'RULE_20',
      name: 'Micro-Entity Threshold Proximity Warning',
      category: 'Micro-Entity Statutory Qualification',
      severity: 'WARN',
      status: 'FAIL',
      message: 'Financial figures are within 10% of the statutory micro-entity ceiling. If growth continues, the company will transition to FRS 102 Section 1A next year.',
      remediation: 'Note upcoming requirement for small-company reporting if thresholds are breached next period.',
      offendingFields: ['turnoverPence', 'fixedAssetsPence'],
    });
  } else {
    evaluations.push({
      id: 'RULE_20',
      name: 'Micro-Entity Threshold Proximity Warning',
      category: 'Micro-Entity Statutory Qualification',
      severity: 'WARN',
      status: 'PASS',
      message: 'Figures well within micro-entity boundaries.',
    });
  }

  return evaluations;
}

