'use client';

import React from 'react';
import { Calculator, FileText, ChevronRight, CheckCircle2, ShieldCheck, Download, Printer } from 'lucide-react';

interface TaxComputationBreakdownProps {
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
}

export function TaxComputationBreakdown({
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
  periodEnd = '2026-09-30'
}: TaxComputationBreakdownProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fintech-card p-5 space-y-4 bg-white border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Official HMRC Corporation Tax Computation (CT600 Format)</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Corporation Tax Act 2010 Part 2 statutory profits reconciliation.
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

      <div className="space-y-2 text-xs">
        {/* Line 1: Turnover */}
        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Gross Turnover &amp; Operating Revenue</span>
            <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
              CT600 Box 145
            </span>
          </div>
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            £{turnover.toLocaleString()}
          </span>
        </div>

        {/* Line 2: Operating Profit */}
        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-slate-700">Accounting Profit before Tax</span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
              P&amp;L Box 155
            </span>
          </div>
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            £{operatingProfit.toLocaleString()}
          </span>
        </div>

        {/* Line 3: Add-back */}
        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg text-amber-900 bg-amber-50/40">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span>(+) Add-back: Client Entertaining &amp; Disallowables</span>
            </span>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">
              CT600 Box 165
            </span>
          </div>
          <span className="font-mono tabular-nums font-semibold text-amber-900">
            +£{clientEntertaining.toLocaleString()}
          </span>
        </div>

        {/* Line 4: Capital Allowances */}
        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg text-emerald-900 bg-emerald-50/40">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span>(-) Capital Allowances: 100% Annual Investment Allowance (AIA)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
              CT600 Box 705
            </span>
          </div>
          <span className="font-mono tabular-nums font-semibold text-emerald-900">
            -£{aiaClaimed.toLocaleString()}
          </span>
        </div>

        {/* Line 5: Taxable Profit */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-100/80 font-semibold border-t border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-slate-900">Net Taxable Trading Profit</span>
            <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
              CT600 Box 315
            </span>
          </div>
          <span className="font-mono tabular-nums text-sm text-slate-950 font-bold">
            £{taxableProfit.toLocaleString()}
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
            £{corporationTax.toLocaleString()}
          </span>
        </div>

        {/* Line 7: s455 Tax if any */}
        {s455Tax > 0 && (
          <div className="flex items-center justify-between py-1.5 px-3 rounded-lg text-amber-900 bg-amber-50/40">
            <div className="flex items-center gap-2">
              <span>(+) Section 455 Tax on Director Loans</span>
              <span className="text-[10px] font-mono text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">
                CT600 Box A30
              </span>
            </div>
            <span className="font-mono tabular-nums font-semibold text-amber-900">
              +£{s455Tax.toLocaleString()}
            </span>
          </div>
        )}

        {/* Total Final Tax Payable */}
        <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-900 text-white font-semibold shadow-sm">
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
              £{totalTaxDue.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Effective Rate: {effectiveRatePct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
