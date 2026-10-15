import type { ShieldInput, ShieldReport, RuleEvaluation } from './types.ts';
import { evaluateCategory1 } from './rules/category1_double_entry.ts';
import { evaluateCategory2 } from './rules/category2_retained_earnings.ts';
import { evaluateCategory3 } from './rules/category3_ct600_parity.ts';
import { evaluateCategory4 } from './rules/category4_micro_entity.ts';
import { evaluateCategory5 } from './rules/category5_periods_dates.ts';
import { evaluateCategory6 } from './rules/category6_director_loans.ts';
import { evaluateCategory7 } from './rules/category7_capital_allowances.ts';
import { evaluateCategory8 } from './rules/category8_gateway_credentials.ts';

/**
 * The 40-Point Pre-Flight Rejection Shield.
 * Executes all 40 statutory, mathematical, and gateway compliance checks.
 * Returns a ShieldReport blocking submission if any FATAL rule fails.
 */
export function runPreFlightShield(input: ShieldInput): ShieldReport {
  const evaluations: RuleEvaluation[] = [
    ...evaluateCategory1(input),
    ...evaluateCategory2(input),
    ...evaluateCategory3(input),
    ...evaluateCategory4(input),
    ...evaluateCategory5(input),
    ...evaluateCategory6(input),
    ...evaluateCategory7(input),
    ...evaluateCategory8(input),
  ];

  let fatalFailureCount = 0;
  let warningCount = 0;
  let passedCount = 0;

  for (const ev of evaluations) {
    if (ev.status === 'PASS') {
      passedCount++;
    } else if (ev.severity === 'FATAL') {
      fatalFailureCount++;
    } else {
      warningCount++;
    }
  }

  return {
    passed: fatalFailureCount === 0,
    totalRulesEvaluated: evaluations.length,
    passedCount,
    fatalFailureCount,
    warningCount,
    evaluations,
  };
}

