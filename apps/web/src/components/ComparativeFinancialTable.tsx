'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, Check } from 'lucide-react';

export interface FinancialLineItem {
  id: string;
  label: string;
  boxLabel?: string;
  tooltip?: string;
  currentValue: number;
  priorValue?: number;
  onChangeCurrent: (val: number) => void;
  onChangePrior?: (val: number) => void;
  isHeader?: boolean;
  isTotal?: boolean;
  isLocked?: boolean;
  isSubItem?: boolean;
  overrideBadge?: string;
  allowNegative?: boolean;
}

interface ComparativeFinancialTableProps {
  title: string;
  subtitle?: string;
  currentYearLabel: string; // e.g. "2026 (CY)"
  priorYearLabel: string;   // e.g. "2025 (PY)"
  items: FinancialLineItem[];
  onCarryForward?: () => void;
  hasPriorYearData?: boolean;
}

function formatAccounting(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) {
    return '—';
  }
  if (val < 0) {
    return `(£${Math.abs(val).toLocaleString()})`;
  }
  return `£${val.toLocaleString()}`;
}

export function ComparativeFinancialTable({
  title,
  subtitle,
  currentYearLabel,
  priorYearLabel,
  items,
  onCarryForward,
  hasPriorYearData = false
}: ComparativeFinancialTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            {title}
          </h4>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>

        {onCarryForward && hasPriorYearData && (
          <button
            type="button"
            onClick={onCarryForward}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold transition"
          >
            <RefreshCw className="w-3 h-3 text-emerald-600" />
            <span>Carry forward opening balances</span>
          </button>
        )}
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] text-slate-500 font-semibold">
                <th className="py-2.5 px-4 w-1/2">Line Item</th>
                <th className="py-2.5 px-3 text-right">{currentYearLabel}</th>
                <th className="py-2.5 px-3 text-right">{priorYearLabel}</th>
                <th className="py-2.5 px-3 text-right w-24">YoY Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                if (item.isHeader) {
                  return (
                    <tr key={item.id} className="bg-slate-50/40">
                      <td colSpan={4} className="py-2 px-4 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                        {item.label}
                      </td>
                    </tr>
                  );
                }

                const hasPrior = item.priorValue !== undefined && item.priorValue !== null && !isNaN(item.priorValue);
                const diff = hasPrior ? (item.currentValue || 0) - (item.priorValue || 0) : null;
                const percentChange =
                  hasPrior && item.priorValue! > 0
                    ? ((diff! / item.priorValue!) * 100).toFixed(1)
                    : null;

                const isPositiveDiff = diff !== null && diff > 0;
                const isZero = diff !== null && diff === 0;

                return (
                  <tr 
                    key={item.id} 
                    className={`transition hover:bg-slate-50/60 ${item.isTotal ? 'bg-slate-50/80 font-semibold' : ''}`}
                  >
                    <td className={`py-2 px-4 ${item.isSubItem ? 'pl-8' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-slate-900 ${item.isTotal ? 'font-bold' : item.isSubItem ? 'text-slate-700' : ''}`}>
                            {item.label}
                          </span>
                          {item.overrideBadge && (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              {item.overrideBadge}
                            </span>
                          )}
                        </div>
                        {item.boxLabel && (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded font-normal">
                            {item.boxLabel}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Current Year Input */}
                    <td className="py-2 px-3 text-right">
                      {item.isTotal || item.isLocked ? (
                        <span className={`font-mono tabular-nums font-bold inline-flex items-center space-x-1.5 ${item.currentValue < 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                          <span>{formatAccounting(item.currentValue)}</span>
                          {item.isLocked && (
                            <span className="text-[10px] font-normal text-slate-400 bg-slate-100 border border-slate-200 px-1 rounded">
                              Locked
                            </span>
                          )}
                        </span>
                      ) : (
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">£</span>
                          <input
                            type="number"
                            min={item.allowNegative ? undefined : "0"}
                            value={item.currentValue === 0 ? '' : item.currentValue}
                            onChange={(e) => item.onChangeCurrent(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full pl-6 pr-2 py-1 text-right bg-slate-50/60 border border-slate-200 rounded-lg text-xs font-mono tabular-nums focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
                          />
                        </div>
                      )}
                    </td>

                    {/* Prior Year Input or Display */}
                    <td className="py-2 px-3 text-right">
                      {item.isTotal ? (
                        <span className="font-mono tabular-nums text-slate-500">
                          {formatAccounting(item.priorValue)}
                        </span>
                      ) : item.onChangePrior ? (
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">£</span>
                          <input
                            type="number"
                            min="0"
                            value={item.priorValue === 0 ? '' : (item.priorValue ?? '')}
                            onChange={(e) => item.onChangePrior!(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full pl-6 pr-2 py-1 text-right bg-slate-50/30 border border-slate-200/70 rounded-lg text-xs font-mono tabular-nums text-slate-600 focus:bg-white focus:ring-1 focus:ring-slate-700 transition"
                          />
                        </div>
                      ) : (
                        <span className="font-mono tabular-nums text-slate-600">
                          {formatAccounting(item.priorValue)}
                        </span>
                      )}
                    </td>

                    {/* YoY Delta Pill */}
                    <td className="py-2 px-3 text-right">
                      {hasPrior && diff !== null ? (
                        isZero ? (
                          <span className="text-[10px] text-slate-400 font-mono">0.0%</span>
                        ) : (
                          <span
                            className={`inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              isPositiveDiff
                                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isPositiveDiff ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600 inline mr-0.5" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-slate-500 inline mr-0.5" />
                            )}
                            {percentChange ? `${percentChange}%` : `£${Math.abs(diff).toLocaleString()}`}
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">n/a</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
