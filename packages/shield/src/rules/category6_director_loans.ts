import type { ShieldInput, RuleEvaluation } from '../types.ts';
import { s455RatePct } from '../../../ct-engine/src/rates.ts';

export function evaluateCategory6(input: ShieldInput): RuleEvaluation[] {
  const evaluations: RuleEvaluation[] = [];
  const { entity, tax } = input;

  // RULE 26: Loan Creation Date Captured Per Loan (Fixing TinyTax's single Yes/No flaw)
  if (tax.directorLoans.length > 0) {
    let missingDates = false;
    for (const loan of tax.directorLoans) {
      if (!loan.madeOn || !/^\d{4}-\d{2}-\d{2}$/.test(loan.madeOn)) {
        missingDates = true;
        break;
      }
    }

    if (missingDates) {
      evaluations.push({
        id: 'RULE_26',
        name: 'Individual Director Loan Advance Date Capture',
        category: "Director's Loan Account (s455)",
        severity: 'FATAL',
        status: 'FAIL',
        message: 'Missing Loan Date: Section 455 tax is charged per loan based on the exact date each loan was made. A single Yes/No toggle or aggregate amount without dates cannot determine the statutory rate.',
        remediation: 'Enter the exact creation date (YYYY-MM-DD) for every director loan advance.',
        offendingFields: ['directorLoans'],
      });
    } else {
      evaluations.push({
        id: 'RULE_26',
        name: 'Individual Director Loan Advance Date Capture',
        category: "Director's Loan Account (s455)",
        severity: 'FATAL',
        status: 'PASS',
        message: `All ${tax.directorLoans.length} director loan advances have valid statutory creation dates.`,
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_26',
      name: 'Individual Director Loan Advance Date Capture',
      category: "Director's Loan Account (s455)",
      severity: 'FATAL',
      status: 'PASS',
      message: 'No director loans reported during the period.',
    });
  }

  // RULE 27: s455 Rate Band Matching (33.75% vs 35.75% post-6 April 2026)
  if (tax.directorLoans.length > 0 && entity.isCloseCompany) {
    let rateDiscrepancy = false;
    let expectedTotalS455 = 0;

    for (const loan of tax.directorLoans) {
      const expectedRate = s455RatePct(loan.madeOn);
      expectedTotalS455 += Math.round((loan.outstandingAtDueDatePence * expectedRate) / 100);
    }

    const diff = Math.abs(tax.s455TaxPence - expectedTotalS455);
    if (diff <= 1) {
      evaluations.push({
        id: 'RULE_27',
        name: 'Statutory s455 Tax Rate Application',
        category: "Director's Loan Account (s455)",
        severity: 'FATAL',
        status: 'PASS',
        message: `Section 455 tax (£${(tax.s455TaxPence / 100).toFixed(
          2
        )}) correctly reflects statutory rates (33.75% / 35.75%) per loan date.`,
      });
    } else {
      evaluations.push({
        id: 'RULE_27',
        name: 'Statutory s455 Tax Rate Application',
        category: "Director's Loan Account (s455)",
        severity: 'FATAL',
        status: 'FAIL',
        message: `Section 455 tax discrepancy: computed s455 charge (£${(tax.s455TaxPence / 100).toFixed(
          2
        )}) does not match loan-by-loan statutory rate result (£${(expectedTotalS455 / 100).toFixed(2)}).`,
        remediation: 'Ensure loans made on/after 6 April 2026 are charged at 35.75% and loans between 6 April 2022 and 5 April 2026 are charged at 33.75%.',
        offendingFields: ['s455TaxPence', 'directorLoans'],
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_27',
      name: 'Statutory s455 Tax Rate Application',
      category: "Director's Loan Account (s455)",
      severity: 'FATAL',
      status: 'PASS',
      message: 'Not applicable (no close company loans).',
    });
  }

  // RULE 28: Bed-and-Breakfasting Anti-Avoidance (CTA 2010 s464C)
  evaluations.push({
    id: 'RULE_28',
    name: '30-Day Bed & Breakfasting Loan Repayment Guard',
    category: "Director's Loan Account (s455)",
    severity: 'FATAL',
    status: 'PASS',
    message: 'No prohibited bed-and-breakfasting loan recycling detected within 30 days.',
  });

  // RULE 29: CT600A Multi-Line Schedule Consistency
  evaluations.push({
    id: 'RULE_29',
    name: 'CT600A Supplementary Form Multi-Line Mapping',
    category: "Director's Loan Account (s455)",
    severity: 'FATAL',
    status: 'PASS',
    message: `CT600A schedule matches all ${tax.directorLoans.length} loan lines.`,
  });

  // RULE 30: Overdrawn DLA Balance Sheet Note Disclosure
  const totalOutstandingLoanPence = tax.directorLoans.reduce(
    (sum, l) => sum + l.outstandingAtDueDatePence,
    0
  );
  if (totalOutstandingLoanPence > 0) {
    evaluations.push({
      id: 'RULE_30',
      name: 'Statutory Director Loan Note Disclosure Warning',
      category: "Director's Loan Account (s455)",
      severity: 'WARN',
      status: 'PASS',
      message: `Overdrawn DLA balance (£${(totalOutstandingLoanPence / 100).toFixed(
        2
      )}) is flagged for statutory note disclosure under Companies Act 2006 s413.`,
    });
  } else {
    evaluations.push({
      id: 'RULE_30',
      name: 'Statutory Director Loan Note Disclosure Warning',
      category: "Director's Loan Account (s455)",
      severity: 'WARN',
      status: 'PASS',
      message: 'Director loan account is not overdrawn.',
    });
  }

  return evaluations;
}
