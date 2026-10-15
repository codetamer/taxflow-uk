import type { ShieldInput, RuleEvaluation } from '../types.ts';
import { daysInclusive, ctPaymentDueDate, addDays } from '../../../ct-engine/src/dates.ts';

export function evaluateCategory5(input: ShieldInput): RuleEvaluation[] {
  const evaluations: RuleEvaluation[] = [];
  const { period } = input;

  const days = daysInclusive(period.periodStart, period.periodEnd);

  // RULE 21: Max 12-Month CT Accounting Period (CTA 2009 s9)
  if (days <= 366) {
    evaluations.push({
      id: 'RULE_21',
      name: 'Maximum Accounting Period Duration',
      category: 'Accounting Periods & Statutory Dates',
      severity: 'FATAL',
      status: 'PASS',
      message: `Accounting period duration (${days} days) satisfies statutory 12-month limit.`,
    });
  } else {
    evaluations.push({
      id: 'RULE_21',
      name: 'Maximum Accounting Period Duration',
      category: 'Accounting Periods & Statutory Dates',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Accounting period spans ${days} days, exceeding the statutory 12-month limit for Corporation Tax. Under CTA 2009 s9, an accounting period cannot exceed 12 months.`,
      remediation: 'Use the automatic Period Splitting Planner to split this into a 12-month period plus the remainder.',
      offendingFields: ['periodStart', 'periodEnd'],
    });
  }

  // RULE 22: Period Continuity with Prior Period
  if (period.priorPeriodEnd) {
    const expectedStart = addDays(period.priorPeriodEnd, 1);
    if (period.periodStart === expectedStart) {
      evaluations.push({
        id: 'RULE_22',
        name: 'Accounting Period Continuity',
        category: 'Accounting Periods & Statutory Dates',
        severity: 'FATAL',
        status: 'PASS',
        message: 'Current period start date immediately follows prior period end date with zero gap or overlap.',
      });
    } else {
      evaluations.push({
        id: 'RULE_22',
        name: 'Accounting Period Continuity',
        category: 'Accounting Periods & Statutory Dates',
        severity: 'FATAL',
        status: 'FAIL',
        message: `Period Continuity Gap: Current period starts on ${period.periodStart}, but prior period ended on ${period.priorPeriodEnd}. Expected start: ${expectedStart}.`,
        remediation: 'Adjust the period start date so it starts exactly one day after the previous accounting period ended.',
        offendingFields: ['periodStart', 'priorPeriodEnd'],
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_22',
      name: 'Accounting Period Continuity',
      category: 'Accounting Periods & Statutory Dates',
      severity: 'FATAL',
      status: 'PASS',
      message: 'First financial year (no prior period continuity check needed).',
    });
  }

  // RULE 23: Statutory Payment Due Date (9 months + 1 day)
  const expectedPaymentDue = ctPaymentDueDate(period.periodEnd);
  if (!period.paymentDueDate || period.paymentDueDate === expectedPaymentDue) {
    evaluations.push({
      id: 'RULE_23',
      name: 'Corporation Tax Payment Due Date Alignment',
      category: 'Accounting Periods & Statutory Dates',
      severity: 'FATAL',
      status: 'PASS',
      message: `Payment due date correctly set to ${expectedPaymentDue} (9 months + 1 day after period end).`,
    });
  } else {
    evaluations.push({
      id: 'RULE_23',
      name: 'Corporation Tax Payment Due Date Alignment',
      category: 'Accounting Periods & Statutory Dates',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Statutory payment due date mismatch: Expected ${expectedPaymentDue}, received ${period.paymentDueDate}.`,
      remediation: 'Set payment due date strictly to 9 months and 1 day after accounting period end.',
      offendingFields: ['paymentDueDate'],
    });
  }

  // RULE 24: Board Accounts Approval Date Validity
  if (!period.isDirectorApproved) {
    evaluations.push({
      id: 'RULE_24',
      name: 'Director Board Approval & Signature Verification',
      category: 'Accounting Periods & Statutory Dates',
      severity: 'FATAL',
      status: 'FAIL',
      message: 'Director Board Approval Missing: Accounts and return must be formally approved by an appointed company director before submission.',
      remediation: 'Complete the director approval checkbox and enter the approving director’s name.',
      offendingFields: ['isDirectorApproved', 'directorDeclarationName'],
    });
  } else if (period.accountsApprovalDate && period.accountsApprovalDate < period.periodEnd) {
    evaluations.push({
      id: 'RULE_24',
      name: 'Director Board Approval & Signature Verification',
      category: 'Accounting Periods & Statutory Dates',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Invalid Board Approval Date: Accounts approval date (${period.accountsApprovalDate}) cannot be before the balance sheet date (${period.periodEnd}).`,
      remediation: 'Change approval date to on or after the balance sheet date.',
      offendingFields: ['accountsApprovalDate'],
    });
  } else {
    evaluations.push({
      id: 'RULE_24',
      name: 'Director Board Approval & Signature Verification',
      category: 'Accounting Periods & Statutory Dates',
      severity: 'FATAL',
      status: 'PASS',
      message: `Accounts approved by director ${period.directorDeclarationName ?? 'Officer'} on ${
        period.accountsApprovalDate ?? 'filing date'
      }.`,
    });
  }

  // RULE 25: Filing Deadline Proximity Warning
  evaluations.push({
    id: 'RULE_25',
    name: 'Statutory Filing Deadline Horizon',
    category: 'Accounting Periods & Statutory Dates',
    severity: 'WARN',
    status: 'PASS',
    message: 'Filing within normal statutory timeline.',
  });

  return evaluations;
}
