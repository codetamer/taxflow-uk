'use client';

import React, { useState } from 'react';
import { Calendar, AlertCircle, X, ArrowRight, HelpCircle, Info } from 'lucide-react';
import { daysInclusive } from '@taxflow/ct-engine';

interface CustomDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStart: string;
  defaultEnd: string;
  onApply: (start: string, end: string, reason: string) => void;
}

export function CustomDatesModal({
  isOpen,
  onClose,
  defaultStart,
  defaultEnd,
  onApply
}: CustomDatesModalProps) {
  const [start, setStart] = useState(defaultStart || '2025-10-01');
  const [end, setEnd] = useState(defaultEnd || '2026-09-30');
  const [reason, setReason] = useState<string>('hmrc_ct603_differs');
  const [customExplanation, setCustomExplanation] = useState<string>('');

  if (!isOpen) return null;

  const durationDays = daysInclusive(start, end);
  const isTooLong = durationDays > 366;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(start, end, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-dates-title"
      >
        {/* Header */}
        <div className="bg-[#0B1528] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 id="custom-dates-title" className="text-base font-semibold tracking-tight text-white">
                File with Custom Accounting Dates
              </h3>
              <p className="text-xs text-slate-300">
                Match HMRC CT603 Notice or Companies House ARD Changes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-5 text-xs text-slate-600">
          
          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">
              Why do you need to file for different dates?
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="hmrc_ct603_differs">
                HMRC CT603 notice commencement date differs from Companies House ARD
              </option>
              <option value="first_year_extended">
                Company's first accounting period exceeds 12 months (First year split return)
              </option>
              <option value="ard_change">
                Accounting Reference Date (ARD) was extended or shortened at Companies House
              </option>
              <option value="dormant_reactivation">
                Company reactivated trading mid-financial year
              </option>
              <option value="other">
                Other statutory date alignment
              </option>
            </select>
          </div>

          {/* Date Range Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Accounting Period Start</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Accounting Period End</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>
          </div>

          {/* Statutory 366-Day Guardrail Banner */}
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
            isTooLong ? 'bg-red-50 border-red-200 text-red-900' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center space-x-1.5 font-bold">
              <Info className={`w-4 h-4 ${isTooLong ? 'text-red-600' : 'text-slate-500'}`} />
              <span>Period Duration: {durationDays} Days</span>
            </div>
            {isTooLong ? (
              <p className="text-[11px] text-red-700">
                Statutory Limitation: A single CT600 return cannot exceed 12 months (366 days) under CTA 2009 s10.
                TaxFlow UK will automatically split this into two consecutive filings (first 365 days + remaining {durationDays - 365} days).
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Valid statutory single-period length conforming with Corporation Tax Act 2009 rules.
              </p>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0B1528] hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
            >
              <span>Apply & Launch Filing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

