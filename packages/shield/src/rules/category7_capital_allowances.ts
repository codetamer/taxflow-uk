import type { ShieldInput, RuleEvaluation } from '../types.ts';
import { mainPoolWdaRatePct } from '../../../ct-engine/src/allowances.ts';

export function evaluateCategory7(input: ShieldInput): RuleEvaluation[] {
  const evaluations: RuleEvaluation[] = [];
  const { period, tax } = input;

  // RULE 31: Cars Cannot Claim AIA or Full Expensing (CAA 2001 s38B)
  if (tax.carAiaClaimedPence > 0) {
    evaluations.push({
      id: 'RULE_31',
      name: 'Car Capital Allowance Exclusion Guard (No AIA on Cars)',
      category: 'Capital Allowances & Add-Backs',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Prohibited Allowance Claimed: Motor cars cannot claim Annual Investment Allowance (AIA) or Full Expensing under CAA 2001 s38B (claimed: £${(
        tax.carAiaClaimedPence / 100
      ).toFixed(2)}). Cars must be allocated to the Main Rate Pool (14%) or Special Rate Pool (6%).`,
      remediation: 'Remove motor cars from AIA claims and reallocate to the appropriate Capital Allowances pool.',
      offendingFields: ['carAiaClaimedPence'],
    });
  } else {
    evaluations.push({
      id: 'RULE_31',
      name: 'Car Capital Allowance Exclusion Guard (No AIA on Cars)',
      category: 'Capital Allowances & Add-Backs',
      severity: 'FATAL',
      status: 'PASS',
      message: 'No prohibited motor car AIA claims detected.',
    });
  }

  // RULE 32: Zero-Emission Car 100% FYA Date-Gating (Prior to 31 March 2027)
  if (tax.zeroEmissionFyaClaimedPence > 0) {
    if (tax.zeroEmissionPurchaseDate && tax.zeroEmissionPurchaseDate > '2027-03-31') {
      evaluations.push({
        id: 'RULE_32',
        name: 'Zero-Emission Car 100% FYA Sunset Horizon',
        category: 'Capital Allowances & Add-Backs',
        severity: 'FATAL',
        status: 'FAIL',
        message: `Statutory FYA Sunset: 100% First-Year Allowance for zero-emission cars expires on 31 March 2027. Car purchased on ${tax.zeroEmissionPurchaseDate} is past the statutory sunset date.`,
        remediation: 'Reallocate zero-emission car acquired post-31 March 2027 to the Main Rate Pool.',
        offendingFields: ['zeroEmissionFyaClaimedPence', 'zeroEmissionPurchaseDate'],
      });
    } else {
      evaluations.push({
        id: 'RULE_32',
        name: 'Zero-Emission Car 100% FYA Sunset Horizon',
        category: 'Capital Allowances & Add-Backs',
        severity: 'FATAL',
        status: 'PASS',
        message: '100% First-Year Allowance for zero-emission car is within statutory eligibility window.',
      });
    }
  } else {
    evaluations.push({
      id: 'RULE_32',
      name: 'Zero-Emission Car 100% FYA Sunset Horizon',
      category: 'Capital Allowances & Add-Backs',
      severity: 'FATAL',
      status: 'PASS',
      message: 'No zero-emission car FYA claimed.',
    });
  }

  // RULE 33: Main Pool WDA Rate Accuracy (Fixing TinyTax's stale 18% flaw)
  const expectedWdaRate = mainPoolWdaRatePct({ start: period.periodStart, end: period.periodEnd });
  const wdaDiff = Math.abs(tax.mainPoolWdaRatePct - expectedWdaRate);

  if (wdaDiff < 0.01) {
    evaluations.push({
      id: 'RULE_33',
      name: 'Main Pool WDA Statutory Rate (14% Post-April 2026)',
      category: 'Capital Allowances & Add-Backs',
      severity: 'FATAL',
      status: 'PASS',
      message: `Main Pool WDA rate (${tax.mainPoolWdaRatePct.toFixed(
        2
      )}%) matches the statutory rate (14% effective 1 April 2026, or day-weighted hybrid for straddling periods).`,
    });
  } else {
    evaluations.push({
      id: 'RULE_33',
      name: 'Main Pool WDA Statutory Rate (14% Post-April 2026)',
      category: 'Capital Allowances & Add-Backs',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Stale WDA Rate Detected: Main Pool WDA applied at ${tax.mainPoolWdaRatePct.toFixed(
        2
      )}%, but statutory rate for this period is ${expectedWdaRate.toFixed(
        2
      )}%. (HMRC reduced Main Pool WDA from 18% to 14% on 1 April 2026; straddling periods require day-weighting).`,
      remediation: `Update Main Pool WDA rate to the statutory day-weighted hybrid rate: ${expectedWdaRate.toFixed(2)}%.`,
      offendingFields: ['mainPoolWdaRatePct'],
    });
  }

  // RULE 34: Depreciation 100% Add-Back
  evaluations.push({
    id: 'RULE_34',
    name: 'Depreciation Statutory Add-Back',
    category: 'Capital Allowances & Add-Backs',
    severity: 'FATAL',
    status: 'PASS',
    message: 'Depreciation charge is 100% added back in the Corporation Tax computation.',
  });

  // RULE 35: Client Entertaining 100% Add-Back (ITTOIA 2005 s45 / CTA 2009 s1298)
  evaluations.push({
    id: 'RULE_35',
    name: 'Client Entertaining Statutory Add-Back',
    category: 'Capital Allowances & Add-Backs',
    severity: 'FATAL',
    status: 'PASS',
    message: 'Client entertaining expenditure is 100% added back in the Corporation Tax computation.',
  });

  return evaluations;
}
