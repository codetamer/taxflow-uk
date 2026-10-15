'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { runPreFlightShield } from '@taxflow/shield';
import type { ShieldInput, ShieldReport } from '@taxflow/shield';

const GBP = (pounds: number) => Math.round(pounds * 100);

const cleanBenchmarkInput: ShieldInput = {
  entity: {
    crn: '15152081',
    companyName: 'DROPLOGICX LTD',
    companyType: 'TRADING',
    utr: '1234567890',
    isCloseCompany: true,
    isCharityOrPlc: false,
    chAuthCode: 'ABC123',
    gatewayUserId: '123456789012',
    gatewayPassword: 'SecretPassword123!'
  },
  period: {
    periodStart: '2025-10-01',
    periodEnd: '2026-09-30',
    daysInYearBasis: 365,
    paymentDueDate: '2027-07-01',
    accountsApprovalDate: '2026-10-15',
    directorDeclarationName: 'Muhammad Saif Raza',
    isDirectorApproved: true
  },
  ledger: {
    turnoverPence: GBP(100000),
    costOfSalesPence: GBP(20000),
    staffCostsPence: 0,
    depreciationPence: 0,
    otherChargesPence: GBP(48100),
    clientEntertainingPence: GBP(3100),
    finesPence: 0,
    bankInterestPence: 0,
    taxExpensePence: GBP(6061),
    netProfitAfterTaxPence: GBP(25839),
    dividendsPaidPence: GBP(10000),
    openingRetainedEarningsPence: GBP(15200),
    closingRetainedEarningsPence: GBP(31039),
    fixedAssetsPence: GBP(15000),
    debtorsPence: GBP(10000),
    cashPence: GBP(31139),
    creditorsUnderOneYearPence: GBP(25000),
    creditorsOverOneYearPence: 0,
    provisionsPence: 0,
    shareCapitalPence: GBP(100),
    employeeCount: 3
  },
  tax: {
    tradingProfitPence: GBP(31900),
    nonTradingIncomePence: 0,
    exemptDistributionsPence: 0,
    ttpPence: GBP(31900),
    augmentedProfitsPence: GBP(31900),
    lowerLimitPence: GBP(50000),
    upperLimitPence: GBP(250000),
    ctBeforeReliefPence: GBP(6061),
    marginalReliefPence: 0,
    ctPayablePence: GBP(6061),
    mainPoolWdaRatePct: 14.0,
    carAiaClaimedPence: 0,
    zeroEmissionFyaClaimedPence: 0,
    directorLoans: [],
    s455TaxPence: 0
  }
};

export default function ShieldDashboardPage() {
  const [activeScenario, setActiveScenario] = useState<'clean' | 'imbalance' | 'dividend' | 'car_aia' | 'declaration'>('clean');

  const getScenarioInput = (scenario: typeof activeScenario): ShieldInput => {
    const input = JSON.parse(JSON.stringify(cleanBenchmarkInput)) as ShieldInput;
    if (scenario === 'imbalance') {
      // Add 1 penny imbalance: Cash + 1p
      input.ledger.cashPence += 1;
    } else if (scenario === 'dividend') {
      // Illegal dividend: £50,000 dividend on £25,839 profit
      input.ledger.dividendsPaidPence = GBP(50000);
      input.ledger.closingRetainedEarningsPence = input.ledger.openingRetainedEarningsPence + input.ledger.netProfitAfterTaxPence - input.ledger.dividendsPaidPence;
    } else if (scenario === 'car_aia') {
      // Claimed £15,000 AIA on a car
      input.tax.carAiaClaimedPence = GBP(15000);
    } else if (scenario === 'declaration') {
      // Unchecked director approval declaration
      input.period.isDirectorApproved = false;
    }
    return input;
  };

  const report: ShieldReport = runPreFlightShield(getScenarioInput(activeScenario));
  const fatalErrors = report.evaluations.filter((e) => e.status === 'FAIL' && e.severity === 'FATAL');
  const warnings = report.evaluations.filter((e) => e.status === 'FAIL' && e.severity === 'WARN');

  const categories = [
    { id: 'category1', name: 'Category 1: Gateway Credentials & Identity', checks: [1, 2, 3, 4, 5] },
    { id: 'category2', name: 'Category 2: Accounting Period & Temporal Validity', checks: [6, 7, 8, 9, 10] },
    { id: 'category3', name: 'Category 3: Mathematical Integrity & Balancing', checks: [11, 12, 13, 14, 15] },
    { id: 'category4', name: 'Category 4: Corporate Governance & Solvency', checks: [16, 17, 18, 19, 20] },
    { id: 'category5', name: 'Category 5: Corporation Tax & Relief Mechanics', checks: [21, 22, 23, 24, 25] },
    { id: 'category6', name: 'Category 6: Capital Allowances & Depreciation Add-Backs', checks: [26, 27, 28, 29, 30] },
    { id: 'category7', name: 'Category 7: Close Company & Director Loan s455', checks: [31, 32, 33, 34, 35] },
    { id: 'category8', name: 'Category 8: Statutory Exemption & Legal Declarations', checks: [36, 37, 38, 39, 40] }
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight">40-Point Pre-Flight Rejection Shield</h1>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Statutory validation suite executing 40 non-negotiable checks across HMRC CATO, Companies House TIS, and FRS 105 specifications before submission.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700">
          <div className="text-right">
            <p className="text-xs text-slate-400">Submission Gate</p>
            <p className={`text-base font-black ${report.passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {report.passed ? 'UNLOCKED (0 ERRORS)' : 'LOCKED (GATEWAY BLOCKED)'}
            </p>
          </div>
          <span className={`w-3.5 h-3.5 rounded-full ${report.passed ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Interactive Scenario Sandbox */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Interactive Pre-Flight Error Simulation Sandbox
            </h2>
          </div>
          <span className="text-xs text-slate-500">Click a test condition to observe real-time gateway defense</span>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={() => setActiveScenario('clean')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeScenario === 'clean'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clean Benchmark (DropLogicX 40/40)</span>
          </button>

          <button
            onClick={() => setActiveScenario('imbalance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeScenario === 'imbalance'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Simulate 1p Balance Sheet Imbalance</span>
          </button>

          <button
            onClick={() => setActiveScenario('dividend')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeScenario === 'dividend'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Simulate Illegal Dividend Exceeding Reserves</span>
          </button>

          <button
            onClick={() => setActiveScenario('car_aia')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeScenario === 'car_aia'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Simulate Car AIA Violation</span>
          </button>

          <button
            onClick={() => setActiveScenario('declaration')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeScenario === 'declaration'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Simulate Missing Director Approval</span>
          </button>
        </div>
      </div>

      {/* Summary Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Passed Checks</p>
            <p className="text-2xl font-black text-emerald-600">{report.passedCount} / {report.totalRulesEvaluated}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Fatal Errors (Blocks Filing)</p>
            <p className={`text-2xl font-black ${fatalErrors.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {fatalErrors.length}
            </p>
          </div>
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${fatalErrors.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
            <XCircle className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Advisory Warnings</p>
            <p className={`text-2xl font-black ${warnings.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {warnings.length}
            </p>
          </div>
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${warnings.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Fatal Error Callout Box if any */}
      {fatalErrors.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-extrabold text-base">Gateway Rejection Shield Activated: Submission Blocked</h3>
          </div>
          <div className="space-y-3">
            {fatalErrors.map((err) => (
              <div key={err.id} className="bg-white p-4 rounded-xl border border-red-200 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    {err.id}: {err.name}
                  </span>
                  <span className="text-xs font-semibold text-red-600">FATAL ERROR</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{err.message}</p>
                {err.remediation && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <strong>Remediation:</strong> {err.remediation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The 40 Rules Breakdown by Category */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">The 40 Statutory Rules Catalogue</h2>

        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">{cat.name}</h3>
                <span className="text-xs font-mono font-medium text-slate-500">Rules {cat.checks[0]}–{cat.checks[cat.checks.length - 1]}</span>
              </div>

              <div className="divide-y divide-slate-100">
                {cat.checks.map((ruleNum) => {
                  const ruleIdStr = `RULE_${ruleNum.toString().padStart(2, '0')}`;
                  const fatalMatch = fatalErrors.find((e) => e.id === ruleIdStr);
                  const isPassed = !fatalMatch;

                  return (
                    <div key={ruleNum} className="px-6 py-4 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            <span className="font-mono text-xs text-slate-400 mr-2">{ruleIdStr}</span>
                            {fatalMatch ? fatalMatch.name : `Rule ${ruleNum} Verified`}
                          </p>
                          {fatalMatch && (
                            <p className="text-xs text-red-600 font-medium mt-0.5">{fatalMatch.message}</p>
                          )}
                        </div>
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {isPassed ? 'PASSED' : 'FATAL ERROR'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
