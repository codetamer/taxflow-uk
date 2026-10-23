'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, X, Loader2, Sparkles } from 'lucide-react';

interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFigures: (figures: {
    turnover?: number;
    costOfSales?: number;
    otherCharges?: number;
    capitalAdditions?: number;
    cash?: number;
  }) => void;
}

export function ImportStatementModal({
  isOpen,
  onClose,
  onApplyFigures
}: ImportStatementModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedSummary, setParsedSummary] = useState<{
    format: 'pdf' | 'csv';
    bankOrType: string;
    transactionCount: number;
    pageCount?: number;
    turnoverPence: number;
    expensesPence: number;
    capitalAdditionsPence: number;
    netCashPence: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setParsedSummary(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse financial document');
      }

      if (data.type === 'trial_balance') {
        const tb = data.result;
        const s = tb.frs105Summary || tb;
        setParsedSummary({
          format: data.format || 'csv',
          bankOrType: data.format === 'pdf' ? 'Trial Balance (PDF Nominal Ledger)' : 'Trial Balance (CSV)',
          transactionCount: tb.lines?.length || tb.rows?.length || 0,
          pageCount: data.pageCount,
          turnoverPence: s.turnoverPence || 0,
          expensesPence: (s.costOfSalesPence || 0) + (s.otherChargesPence || 0),
          capitalAdditionsPence: s.tangibleFixedAssetsPence || 0,
          netCashPence: s.cashAtBankPence || 0
        });
      } else {
        const norm = data.result;
        const txCount = norm.importedTransactions?.length ?? (norm.transactions?.length || 0);
        const turnover = norm.totalInflowPence ?? (norm.totalCreditsPence || 0);
        const expenses = norm.totalOutflowPence ?? (norm.totalDebitsPence || 0);
        const capital = norm.capitalAssetTotalPence || 0;
        const netCash = norm.netCashFlowPence ?? (norm.netMovementPence || (turnover - expenses));

        setParsedSummary({
          format: data.format || 'pdf',
          bankOrType: `${data.detectedBank || norm.detectedBank || 'UK'} Bank Statement (${data.format?.toUpperCase() || 'PDF'})`,
          transactionCount: txCount,
          pageCount: data.pageCount,
          turnoverPence: turnover,
          expensesPence: expenses,
          capitalAdditionsPence: capital,
          netCashPence: netCash
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error processing statement file');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmApply = () => {
    if (!parsedSummary) return;

    onApplyFigures({
      turnover: Math.round(parsedSummary.turnoverPence / 100),
      costOfSales: Math.round((parsedSummary.expensesPence * 0.3) / 100), // estimated standard split if single pool
      otherCharges: Math.round((parsedSummary.expensesPence * 0.7) / 100),
      capitalAdditions: Math.round(parsedSummary.capitalAdditionsPence / 100),
      cash: Math.max(0, Math.round(parsedSummary.netCashPence / 100))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-white">
                Import Bank Statement or Trial Balance
              </h3>
              <p className="text-xs text-slate-300">
                Supports Monzo, Starling, Revolut, Barclays, Lloyds, HSBC, NatWest &amp; Xero / QuickBooks PDFs &amp; CSVs
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
        <div className="p-6 space-y-5">
          {!parsedSummary && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' 
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.txt"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="mx-auto w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 mb-3">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {loading ? 'Analyzing PDF / CSV & Categorizing Transactions...' : 'Click to upload or drag & drop PDF or CSV export'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Automatic optical text extraction, SHA-256 deduplication, and tax-disallowable expense tagging.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Summary Preview */}
          {parsedSummary && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Successfully Ingested: {parsedSummary.bankOrType}</span>
                </span>
                <span className="font-mono text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                  {parsedSummary.transactionCount} items {parsedSummary.pageCount ? `(${parsedSummary.pageCount} page${parsedSummary.pageCount > 1 ? 's' : ''})` : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-slate-500 text-[11px]">Gross Turnover (Income)</p>
                  <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    £{(parsedSummary.turnoverPence / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400">Maps to CT600 Box 145</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-slate-500 text-[11px]">Operating Expenses</p>
                  <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    £{(parsedSummary.expensesPence / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400">Cost of Sales &amp; Admin</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-slate-500 text-[11px]">Qualifying Capital Additions</p>
                  <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    £{(parsedSummary.capitalAdditionsPence / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400">Eligible for 100% AIA</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-slate-500 text-[11px]">Computed Net Balance</p>
                  <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    £{(parsedSummary.netCashPence / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400">Closing Cash at Bank</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setParsedSummary(null)}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline block mx-auto pt-1"
              >
                Upload a different file
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
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
            disabled={!parsedSummary}
            onClick={handleConfirmApply}
            className={`inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition ${
              parsedSummary
                ? 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Apply Figures to Filing</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
