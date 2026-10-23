'use client';

import React from 'react';
import { Calculator, FileText, ChevronRight, CheckCircle2, ShieldCheck, Download, Printer, Landmark, Building, Info, AlertTriangle } from 'lucide-react';

interface TaxComputationBreakdownProps {
  companyType?: 'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED';
  turnover: number;
  costOfSales: number;
  otherCharges: number;
  operatingProfit: number;
  clientEntertaining: number;
  capitalAdditions: number;
  aiaClaimed: number;
  taxableProfit: number;
  corporationTax: number;
  s455Tax: number;
  totalTaxDue: number;
  effectiveRatePct: string;
  wdaRatePct?: number;
  companyName?: string;
  crn?: string;
  periodStart?: string;
  periodEnd?: string;
  // Property SPV specific props
  propertyRentalIncome?: number;
  propertyAllowableExpenses?: number;
  propertyMortgageInterest?: number; // Box 260
  propertyNetProfit?: number; // Box 190
  propertyLossCarriedForward?: number; // Box 805
}

function formatAccounting(val: number, isCurrency = true): string {
  const absVal = Math.abs(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const prefix = isCurrency ? '£' : '';
  if (val < 0) {
    return `(${prefix}${absVal})`;
  }
  return `${prefix}${absVal}`;
}

export function TaxComputationBreakdown({
  companyType = 'TRADING',
  turnover,
  costOfSales,
  otherCharges,
  operatingProfit,
  clientEntertaining,
  capitalAdditions,
  aiaClaimed,
  taxableProfit,
  corporationTax,
  s455Tax,
  totalTaxDue,
  effectiveRatePct,
  wdaRatePct = 15.99,
  companyName = 'DROPLOGICX LTD',
  crn = '15152081',
  periodStart = '2025-10-01',
  periodEnd = '2026-09-30',
  propertyRentalIncome = 0,
  propertyAllowableExpenses = 0,
  propertyMortgageInterest = 0,
  propertyNetProfit = 0,
  propertyLossCarriedForward = 0
}: TaxComputationBreakdownProps) {
  const handlePrint = () => {
    window.print();
  };

  const isDormant = companyType === 'DORMANT';
  const isProperty = companyType === 'PROPERTY';
  const isMixed = companyType === 'MIXED';

  return (
    <div className="fintech-card p-5 space-y-4 bg-white border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>
              {isDormant
                ? 'HMRC Dormant Company Nil Tax Computation (CT600 Form)'
                : isProperty
                ? 'HMRC UK Property SPV Tax Computation (Schedule A / CT600)'
                : isMixed
                ? 'HMRC Mixed Trading & Property Tax Computation (CT600 Format)'
                : 'Official HMRC Corporation Tax Computation (CT600 Format)'}
            </span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isDormant
              ? 'Companies Act 2006 s480 / TMA 1970 statutory nil return.'
              : isProperty
              ? 'CTA 2009 Part 4 (Schedule A) & Part 5 (Loan Relationships) reconciliation.'
              : 'Corporation Tax Act 2010 Part 2 statutory profits reconciliation.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition print:hidden"
        >
          <Printer className="w-3 h-3 text-slate-500" />
          <span>Print Schedule</span>
        </button>
      </div>

      {/* DORMANT COMPANY VIEW */}
      {isDormant ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Statutory Nil Corporation Tax Return Confirmed</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            As a dormant entity with no significant accounting transactions during the period (CA 2006 s1169), taxable profit is <span className="font-mono font-bold text-slate-950">£0.00</span> and corporation tax liability is <span className="font-mono font-bold text-emerald-700">£0.00</span>.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Box 145 (Turnover)</span>
              <span className="font-bold text-slate-900">£0.00</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Box 315 (Profits)</span>
              <span className="font-bold text-slate-900">£0.00</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Box 440 (Tax Due)</span>
              <span className="font-bold text-emerald-700">£0.00</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          {/* TRADING / MIXED STREAM */}
          {(!isProperty || isMixed) && (
            <>
              {/* Line 1: Turnover */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Gross Trading Turnover &amp; Revenue</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                    CT600 Box 145
                  </span>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatAccounting(turnover)}
                </span>
              </div>

              {/* Line 2: Operating Profit */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700">Accounting Trading Profit before Tax</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                    P&amp;L Box 155
                  </span>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatAccounting(operatingProfit)}
                </span>
              </div>

              {/* Line 3: Add-back */}
              {clientEntertaining > 0 && (
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg text-amber-900 bg-amber-50/40">
                  <div className="flex items-center gap-2">
                    <span>(+) Add-back: Disallowable Client Entertaining</span>
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">
                      CT600 Box 165
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-amber-900">
                    +{formatAccounting(clientEntertaining)}
                  </span>
                </div>
              )}

              {/* Line 4: Capital Allowances */}
              {aiaClaimed > 0 && (
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg text-emerald-900 bg-emerald-50/40">
                  <div className="flex items-center gap-2">
                    <span>(-) Capital Allowances: 100% Annual Investment Allowance (AIA)</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      CT600 Box 705
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-emerald-900">
                    -{formatAccounting(aiaClaimed)}
                  </span>
                </div>
              )}
            </>
          )}

          {/* PROPERTY SPV / SCHEDULE A STREAM */}
          {(isProperty || isMixed) && (
            <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-3 space-y-2 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950 uppercase tracking-wide">
                <span>Schedule A: UK Property Business Computations (CTA 2009 Part 4)</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-mono">
                  SPV Schedule
                </span>
              </div>

              {/* Gross Rental Income */}
              <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white/70">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Gross Rental Receipts &amp; Property Income</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                    Schedule A
                  </span>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatAccounting(propertyRentalIncome)}
                </span>
              </div>

              {/* Allowable Property Expenses */}
              <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white/70">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">(-) Allowable Property Costs (Repairs, Insurance, Agent Fees)</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                    Allowable
                  </span>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  -{formatAccounting(propertyAllowableExpenses)}
                </span>
              </div>

              {/* CTA 2009 Part 5 Mortgage Interest Guardrail Callout */}
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-amber-50/70 text-amber-950 border border-amber-200/50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">(-) Loan Interest &amp; Finance Costs (NTLR Debit)</span>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                    CT600 Box 260
                  </span>
                </div>
                <span className="font-mono tabular-nums font-semibold text-amber-950">
                  -{formatAccounting(propertyMortgageInterest)}
                </span>
              </div>

              {/* Net Property Profits Box 190 */}
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white font-semibold border border-indigo-200">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-950 font-bold">Income from UK Property</span>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                    CT600 Box 190
                  </span>
                </div>
                <span className="font-mono tabular-nums font-bold text-indigo-950">
                  {formatAccounting(propertyNetProfit)}
                </span>
              </div>

              {/* Box 805 Loss Carry-Forward if Deficit */}
              {propertyLossCarriedForward > 0 && (
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Property Business Deficit Carried Forward</span>
                    <span className="text-[10px] font-mono text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                      CT600 Box 805
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-rose-900">
                    {formatAccounting(propertyLossCarriedForward)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Line 5: Total Taxable Profits */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-100/80 font-semibold border-t border-b border-slate-200 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-900">
                {isProperty ? 'Net Chargeable Property Profits' : isMixed ? 'Total Taxable Profits (TTP)' : 'Net Taxable Trading Profit'}
              </span>
              <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                CT600 Box 315 / 335
              </span>
            </div>
            <span className="font-mono tabular-nums text-sm text-slate-950 font-bold">
              {formatAccounting(taxableProfit)}
            </span>
          </div>

          {/* Line 6: Corporation Tax */}
          <div className="flex items-center justify-between py-1.5 px-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Corporation Tax @ 19.0% Small Profits Rate</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                CT600 Box 430
              </span>
            </div>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {formatAccounting(corporationTax)}
            </span>
          </div>

          {/* Line 7: s455 Tax if any */}
          {s455Tax > 0 && (
            <div className="flex items-center justify-between py-1.5 px-3 rounded-lg text-amber-900 bg-amber-50/40">
              <div className="flex items-center gap-2">
                <span>(+) Section 455 Tax on Director Loans (33.75%)</span>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">
                  CT600 Box A30
                </span>
              </div>
              <span className="font-mono tabular-nums font-semibold text-amber-900">
                +{formatAccounting(s455Tax)}
              </span>
            </div>
          )}

          {/* Total Final Tax Payable */}
          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-900 text-white font-semibold shadow-sm mt-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold">Total Amount Payable to HMRC</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-slate-800 border border-slate-700 px-1.5 py-0.2 rounded">
                  CT600 Box 440
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-normal">
                Due exactly 9 months &amp; 1 day after period end (TMA 1970 s59D)
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono tabular-nums text-lg text-emerald-400 font-bold block">
                {formatAccounting(totalTaxDue)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Effective Rate: {effectiveRatePct}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
