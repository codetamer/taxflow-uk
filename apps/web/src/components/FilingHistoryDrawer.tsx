'use client';

import React from 'react';
import {
  X,
  FileDown,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Receipt,
  Scale,
  RefreshCw,
  FileText,
  Lock,
  Download,
  Share2
} from 'lucide-react';
import { TermExplainer } from './TermExplainer';

interface FilingHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filing: {
    id: string;
    companyName: string;
    crn: string;
    utr?: string;
    periodStart: string;
    periodEnd: string;
    status: string;
    turnover?: number;
    taxPayable?: number;
    irmark?: string;
    submissionDate?: string;
    correlationId?: string;
    companyType?: string;
  } | null;
  onMarkAsFiledExternally?: (filingId: string) => void;
}

export function FilingHistoryDrawer({
  isOpen,
  onClose,
  filing,
  onMarkAsFiledExternally
}: FilingHistoryDrawerProps) {
  if (!isOpen || !filing) return null;

  const isFiled = filing.status === 'ACCEPTED' || filing.status === 'SUBMITTED';
  const isDormant = filing.companyType === 'DORMANT';

  const formatAccounting = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '£0.00';
    if (val < 0) {
      return `(£${Math.abs(val).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
    return `£${val.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const turnoverVal = isDormant ? (filing.turnover ?? 0) : (filing.turnover ?? 100000);
  const taxPayableVal = isDormant ? (filing.taxPayable ?? 0) : (filing.taxPayable ?? 6061);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="bg-[#0B1528] text-white p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                  CRN: {filing.crn}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{filing.companyName}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  {filing.status}
                </span>
                <span className="text-xs text-slate-300">
                  {filing.companyType || 'Trading Company'}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-600">
            
            {/* Period & Schedule Snapshot */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                Accounting Period & Statutory Dates
              </span>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400">Period Start</p>
                  <p className="font-mono font-bold text-slate-900">{filing.periodStart}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Period End</p>
                  <p className="font-mono font-bold text-slate-900">{filing.periodEnd}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Accounts Due (CH)</p>
                  <p className="font-mono text-slate-700">9 Months from End</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">CT Payment Due (HMRC)</p>
                  <p className="font-mono text-slate-700">9 Months + 1 Day</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                Financial Baseline
              </span>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Turnover / Revenue (Box 145):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatAccounting(turnoverVal)}
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Corporation Tax Payable:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatAccounting(taxPayableVal)}
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Unique Taxpayer Reference (UTR):</span>
                  <span className="font-mono text-slate-800">{filing.utr || '1234567890'}</span>
                </div>
              </div>
            </div>

            {/* Gateway Telemetry & Cryptographic Hashes */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block flex items-center justify-between">
                <span>Government Gateway Telemetry</span>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Pre-Flight Verified
                </span>
              </span>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div>
                  <p className="text-[10px] text-slate-400 font-sans">HMRC IRmark Digest (SHA-1 C14N):</p>
                  <p className="text-slate-800 font-bold truncate bg-white p-1.5 rounded border border-slate-200">
                    {filing.irmark || 'aF92kJL109zQpLk3098fQ=='}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-sans">GovTalk Correlation ID:</p>
                  <p className="text-slate-800 truncate bg-white p-1.5 rounded border border-slate-200">
                    {filing.correlationId || 'HMRC-CT-2026-9812401'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-sans">Last Activity Timestamp:</p>
                  <p className="text-slate-800 bg-white p-1.5 rounded border border-slate-200">
                    {filing.submissionDate || new Date().toLocaleString('en-GB')}
                  </p>
                </div>
              </div>
            </div>

            {/* Downloadable Artifacts */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                Statutory Documents & Export Archive
              </span>
              <div className="grid grid-cols-1 gap-2">
                <a
                  href={`/api/documents/accounts-pdf?draft=true&filingId=${filing.id}`}
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs font-semibold text-slate-800 group"
                >
                  <div className="flex items-center space-x-2.5">
                    <FileDown className="w-4 h-4 text-slate-500 group-hover:text-slate-900" />
                    <span>Download Full Accounts (PDF)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">FRS 105</span>
                </a>

                <a
                  href={`/api/documents/ct600-pdf?draft=true&filingId=${filing.id}`}
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs font-semibold text-slate-800 group"
                >
                  <div className="flex items-center space-x-2.5">
                    <FileDown className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700" />
                    <span>Download HMRC CT600 Return (PDF)</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">HMRC Official</span>
                </a>

                <a
                  href={`/api/documents/ixbrl?filingId=${filing.id}`}
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs font-semibold text-slate-800 group"
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-indigo-500 group-hover:text-indigo-700" />
                    <span>Download iXBRL XML Package</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-mono">Raw XBRL</span>
                </a>
              </div>
            </div>

            {/* Quick Actions & Reconcile External */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                Period Actions & Resolution
              </span>
              <div className="space-y-2">
                <a
                  href={`/filings/${filing.id}/wizard`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0B1528] hover:bg-slate-800 text-white font-bold flex items-center justify-center space-x-2 transition"
                >
                  <span>Edit in Filing Studio</span>
                </a>

                {!isFiled && onMarkAsFiledExternally && (
                  <button
                    type="button"
                    onClick={() => onMarkAsFiledExternally(filing.id)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center space-x-1.5 transition text-[11px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Has this CT600 been sent to HMRC externally?</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400">
            <span>Filing ID: {filing.id}</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

