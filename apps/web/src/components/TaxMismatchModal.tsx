'use client';

import React from 'react';
import { Scale, Check, AlertCircle, X, ArrowRight, BookOpen } from 'lucide-react';

export interface TaxMismatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: 'pnlTax' | 'ctCreditor';
  calculatedTax: number;
  enteredTax: number;
  onSelect: (choice: 'use_calculated' | 'keep_override' | 'not_sure') => void;
}

export function TaxMismatchModal({
  isOpen,
  onClose,
  field,
  calculatedTax,
  enteredTax,
  onSelect
}: TaxMismatchModalProps) {
  if (!isOpen) return null;

  const diff = enteredTax - calculatedTax;
  const isHigher = diff > 0;
  const fieldName = field === 'pnlTax' ? 'P&L Tax on Profit' : 'Corporation Tax Payable Creditor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mismatch-modal-title"
      >
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 id="mismatch-modal-title" className="text-base font-bold text-white">
                Accounts Tax Differs from CT600 Calculation
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                HMRC Form CT600 Box 440 Parity Check
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

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Variance: £{Math.abs(diff).toLocaleString()}</span>
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                {isHigher ? 'Entered > CT600' : 'Entered < CT600'}
              </span>
            </div>
            <p className="text-amber-950 leading-relaxed text-[11px]">
              You entered <strong className="font-semibold">£{enteredTax.toLocaleString()}</strong> for {fieldName}, but the official CT600 calculation for this period is <strong className="font-semibold font-mono">£{calculatedTax.toLocaleString()}</strong>.
            </p>
          </div>

          <p className="text-slate-600 leading-relaxed">
            In standard UK micro-entities (FRS 105), the accounts tax charge and balance sheet creditor match the CT600 tax payable. How would you like to proceed?
          </p>

          {/* Three Choices (as observed on TinyTax) */}
          <div className="space-y-2.5">
            {/* Option 1: Use calculated */}
            <button
              type="button"
              onClick={() => {
                onSelect('use_calculated');
                onClose();
              }}
              className="w-full text-left p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 transition group space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Use the calculated £{calculatedTax.toLocaleString()} (Recommended)</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Zero Mismatch
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 pl-5 leading-relaxed">
                Resets {fieldName} to match CT600 Box 440 automatically. Guarantees 100% gateway parity between HMRC and Companies House.
              </p>
            </button>

            {/* Option 2: Keep estimate */}
            <button
              type="button"
              onClick={() => {
                onSelect('keep_override');
                onClose();
              }}
              className="w-full text-left p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">
                  Keep £{enteredTax.toLocaleString()} as a deliberate estimate
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                  Manual Override
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Preserves your manual figure. Permitted when specific timing differences or non-standard provisions apply under FRS 102/105.
              </p>
            </button>

            {/* Option 3: Not sure */}
            <button
              type="button"
              onClick={() => {
                onSelect('not_sure');
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-slate-800 block text-xs">
                  Not sure yet
                </span>
                <span className="text-[11px] text-slate-500">
                  Revert to calculated £{calculatedTax.toLocaleString()} and read the tax guidance.
                </span>
              </div>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
