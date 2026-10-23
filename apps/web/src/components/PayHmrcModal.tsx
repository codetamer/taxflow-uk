'use client';

import React, { useState } from 'react';
import { Landmark, Copy, Check, ExternalLink, X, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

interface PayHmrcModalProps {
  isOpen: boolean;
  onClose: () => void;
  utr: string;
  taxAmount: number;
  paymentDueDate: string;
  companyName: string;
  accountingPeriodEnd: string;
}

export function PayHmrcModal({
  isOpen,
  onClose,
  utr,
  taxAmount,
  paymentDueDate,
  companyName,
  accountingPeriodEnd
}: PayHmrcModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  // HMRC 17-Character Corporation Tax Payment Reference:
  // Format: 10-digit UTR + 'A001' + 2-digit Period Counter + 'X'
  const cleanUtr = (utr || '1234567890').replace(/\s+/g, '');
  const apYear = accountingPeriodEnd ? accountingPeriodEnd.slice(2, 4) : '26';
  const paymentReference = `${cleanUtr}A001${apYear}X`;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-white">
                How to Pay HMRC Corporation Tax
              </h3>
              <p className="text-xs text-slate-300">
                Official UK Government Payment Instructions
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

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Statutory Due Date Warning */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-amber-800 text-xs">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Statutory Payment Due Date: {paymentDueDate}</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-200/80 px-2 py-0.5 rounded text-amber-900">
                TMA 1970 s59D
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <span className="font-semibold">Critical timing rule:</span> Corporation Tax must be paid <span className="font-semibold">9 months and 1 day</span> after the end of your accounting period—exactly 3 months <span className="underline">before</span> the return filing deadline.
            </p>
          </div>

          {/* Amount Due Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-[11px]">Corporation Tax &amp; s455 Due</p>
              <p className="text-xl font-bold font-mono text-slate-950 mt-0.5">
                £{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-400">{companyName} (CRN)</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Computed</span>
              </span>
            </div>
          </div>

          {/* 17-Character Payment Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>Your Official 17-Digit Payment Reference</span>
              <span className="text-[10px] text-slate-500 font-normal">Must be included in bank transfer</span>
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-300 bg-slate-100/70 font-mono text-sm tracking-wider text-slate-900 font-bold">
              <span>{paymentReference}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(paymentReference, 'reference')}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-950 text-xs font-sans font-medium transition shadow-sm"
              >
                {copiedField === 'reference' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Using the correct reference ensures HMRC allocates your payment automatically without delay or interest penalties.
            </p>
          </div>

          {/* Official HMRC Bank Account Details */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              HMRC Bank Transfer Details (Faster Payments / BACS)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs bg-white">
              <div className="flex items-center justify-between py-2 px-3">
                <span className="text-slate-500">Account Name</span>
                <span className="font-semibold text-slate-900">HMRC Cumbernauld</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3">
                <span className="text-slate-500">Sort Code</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900">08-32-10</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('083210', 'sortCode')}
                    className="text-slate-400 hover:text-slate-700"
                    title="Copy Sort Code"
                  >
                    {copiedField === 'sortCode' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 px-3">
                <span className="text-slate-500">Account Number</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900">12001039</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('12001039', 'accountNumber')}
                    className="text-slate-400 hover:text-slate-700"
                    title="Copy Account Number"
                  >
                    {copiedField === 'accountNumber' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-200/60 transition"
          >
            Close
          </button>
          <a
            href="https://www.gov.uk/pay-corporation-tax"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition hover:scale-[1.01]"
          >
            <span>Pay on GOV.UK</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
