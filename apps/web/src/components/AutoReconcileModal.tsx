'use client';

import React, { useState } from 'react';
import { Scale, CheckCircle2, AlertTriangle, X, ArrowRight, ShieldAlert } from 'lucide-react';

interface AutoReconcileModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAssetsPence: number;
  totalFundsPence: number;
  variancePence: number; // totalAssetsPence - totalFundsPence
  onApply: (target: 'cash' | 'retainedEarnings' | 'creditors') => void;
}

export function AutoReconcileModal({
  isOpen,
  onClose,
  totalAssetsPence,
  totalFundsPence,
  variancePence,
  onApply
}: AutoReconcileModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<'cash' | 'retainedEarnings' | 'creditors'>('cash');

  if (!isOpen) return null;

  const absVariancePounds = (Math.abs(variancePence) / 100).toFixed(2);
  const isAssetsHigher = variancePence > 0;

  const handleConfirm = () => {
    onApply(selectedTarget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-title" className="text-base font-semibold tracking-tight text-white">
                Balance Sheet Reconciliation
              </h3>
              <p className="text-xs text-slate-300">
                Companies Act 2006 s396 / FRS 105 Section 4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variance Diagnosis Summary */}
        <div className="p-6 space-y-5">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Imbalance Detected: £{absVariancePounds}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[11px] font-mono">
                {isAssetsHigher ? 'Net Assets > Reserves' : 'Reserves > Net Assets'}
              </span>
            </div>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Companies House automated gateways strictly require <span className="font-semibold">Total Net Assets</span> to match <span className="font-semibold">Total Shareholders' Funds</span> to the exact penny.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <div className="bg-white/90 p-2 rounded-lg border border-amber-100">
                <span className="text-stone-500 text-[10px] block font-sans">Net Assets (A)</span>
                <span className="font-bold text-stone-900">£{(totalAssetsPence / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-white/90 p-2 rounded-lg border border-amber-100">
                <span className="text-stone-500 text-[10px] block font-sans">Shareholders' Funds (B)</span>
                <span className="font-bold text-stone-900">£{(totalFundsPence / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Statutory Options */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-800 block">
              Select statutory target to absorb the £{absVariancePounds} difference:
            </label>

            <div className="space-y-2 text-xs">
              {/* Option 1: Cash at bank */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedTarget === 'cash' 
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="reconcileTarget"
                  value="cash"
                  checked={selectedTarget === 'cash'}
                  onChange={() => setSelectedTarget('cash')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Cash at Bank &amp; in Hand</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">Common</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Adjusts current cash balance by {isAssetsHigher ? '-' : '+'}£{absVariancePounds} to reflect unposted petty cash or bank rounding.
                  </p>
                </div>
              </label>

              {/* Option 2: Opening Retained Earnings */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedTarget === 'retainedEarnings' 
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="reconcileTarget"
                  value="retainedEarnings"
                  checked={selectedTarget === 'retainedEarnings'}
                  onChange={() => setSelectedTarget('retainedEarnings')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Opening Retained Earnings</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">Prior-Period Effect</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Adjusts brought-forward accumulated profits by {isAssetsHigher ? '+' : '-'}£{absVariancePounds} if the variance stems from prior-year accounts discrepancies.
                  </p>
                  {selectedTarget === 'retainedEarnings' && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>Statutory Continuity Warning (FRS 105 Section 8)</span>
                      </div>
                      <p className="leading-relaxed text-amber-800">
                        Opening retained earnings must strictly equal the closing reserves filed in last year's statutory accounts. Modifying this figure represents a formal prior-period restatement under FRS 105 / CA 2006. If prior accounts were already accepted by Companies House, ensure this reflects a genuine prior-year adjustment.
                      </p>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 3: Other Creditors */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedTarget === 'creditors' 
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="reconcileTarget"
                  value="creditors"
                  checked={selectedTarget === 'creditors'}
                  onChange={() => setSelectedTarget('creditors')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">Creditors Due Within One Year</div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Adjusts short-term creditors and accruals if an unposted supplier invoice or expense explains the difference.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-200/60 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Reconcile to Exact Symmetry</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
