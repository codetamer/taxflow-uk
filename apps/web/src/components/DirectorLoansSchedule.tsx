'use client';

import React from 'react';
import { Plus, Trash2, Calendar, AlertCircle, Info, Landmark } from 'lucide-react';

export interface DirectorLoanItem {
  id: string;
  directorName: string;
  advanceDate: string;
  advanceAmount: number;
  repaidAmount: number;
  repaidDate?: string;
}

interface DirectorLoansScheduleProps {
  loans: DirectorLoanItem[];
  onChange: (loans: DirectorLoanItem[]) => void;
  periodEnd: string;
  paymentDueDate: string;
  registeredDirectors?: string[];
}

export function DirectorLoansSchedule({
  loans,
  onChange,
  periodEnd,
  paymentDueDate,
  registeredDirectors = []
}: DirectorLoansScheduleProps) {
  const handleAddLoan = () => {
    const newLoan: DirectorLoanItem = {
      id: `loan_${Date.now()}`,
      directorName: registeredDirectors[0] || 'Director',
      advanceDate: periodEnd ? `${periodEnd.slice(0, 4)}-05-01` : '2026-05-01',
      advanceAmount: 10000,
      repaidAmount: 0,
      repaidDate: ''
    };
    onChange([...loans, newLoan]);
  };

  const handleRemoveLoan = (id: string) => {
    onChange(loans.filter((l) => l.id !== id));
  };

  const handleUpdateLoan = (id: string, updates: Partial<DirectorLoanItem>) => {
    onChange(
      loans.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  // Compute individual loan stats
  const computedLines = loans.map((loan) => {
    const isRepaidInWindow =
      loan.repaidAmount >= loan.advanceAmount &&
      (!loan.repaidDate || !paymentDueDate || loan.repaidDate <= paymentDueDate);

    const outstanding = isRepaidInWindow ? 0 : Math.max(0, loan.advanceAmount - (loan.repaidAmount || 0));
    const ratePct = loan.advanceDate && loan.advanceDate >= '2026-04-06' ? 35.75 : 33.75;
    const taxPence = Math.round(outstanding * 100 * (ratePct / 100));

    return {
      ...loan,
      outstanding,
      ratePct,
      taxPence,
      isRepaidInWindow
    };
  });

  const totalOutstanding = computedLines.reduce((acc, l) => acc + l.outstanding, 0);
  const totalTaxPence = computedLines.reduce((acc, l) => acc + l.taxPence, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-slate-500" />
            <span>Director Loans &amp; Participator Advances (CTA 2010 s455)</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Loans to directors not repaid within 9 months &amp; 1 day of year end are subject to temporary s455 tax.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddLoan}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Loan Advance</span>
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
          <p className="text-xs text-slate-500">No director loans or overdrawn balances reported for this period.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            If the company lent money to a director or participator, click "Add Loan Advance" above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="min-w-[760px] w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] text-slate-500 font-semibold">
                <th className="py-2.5 px-3 w-[190px] min-w-[170px]">Director Name</th>
                <th className="py-2.5 px-3 w-[140px] min-w-[130px]">Advance Date</th>
                <th className="py-2.5 px-3 w-[110px] min-w-[100px]">Advance (£)</th>
                <th className="py-2.5 px-3 w-[110px] min-w-[100px]">Repaid (£)</th>
                <th className="py-2.5 px-3 w-[140px] min-w-[130px]">Repaid Date</th>
                <th className="py-2.5 px-3 w-[70px] min-w-[65px]">Rate</th>
                <th className="py-2.5 px-3 w-[110px] min-w-[100px] text-right">Tax Due (£)</th>
                <th className="py-2.5 px-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {computedLines.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-2.5 px-3">
                    {registeredDirectors.length > 0 ? (
                      <select
                        value={line.directorName}
                        onChange={(e) => handleUpdateLoan(line.id, { directorName: e.target.value })}
                        className="w-full min-w-[150px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 focus:bg-white truncate"
                      >
                        {registeredDirectors.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={line.directorName}
                        onChange={(e) => handleUpdateLoan(line.id, { directorName: e.target.value })}
                        className="w-full min-w-[150px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 focus:bg-white"
                      />
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="date"
                      value={line.advanceDate}
                      onChange={(e) => handleUpdateLoan(line.id, { advanceDate: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white font-mono"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={line.advanceAmount || ''}
                      onChange={(e) => handleUpdateLoan(line.id, { advanceAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono tabular-nums text-right focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={line.repaidAmount || ''}
                      onChange={(e) => handleUpdateLoan(line.id, { repaidAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono tabular-nums text-right focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="date"
                      value={line.repaidDate || ''}
                      onChange={(e) => handleUpdateLoan(line.id, { repaidDate: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white font-mono"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    <span className={`px-1.5 py-0.5 rounded ${line.ratePct === 35.75 ? 'bg-amber-100 text-amber-900 font-semibold' : 'bg-slate-100 text-slate-700'}`}>
                      {line.ratePct}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    £{(line.taxPence / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLoan(line.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                      aria-label="Remove loan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-xs">
                <td colSpan={2} className="py-2.5 px-3 text-slate-600">
                  Total CTA 2010 s455 Tax Liability (CT600 Box A30)
                </td>
                <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-900">
                  £{loans.reduce((acc, l) => acc + (l.advanceAmount || 0), 0).toLocaleString()}
                </td>
                <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-900">
                  £{loans.reduce((acc, l) => acc + (l.repaidAmount || 0), 0).toLocaleString()}
                </td>
                <td colSpan={2}></td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm text-slate-950 font-bold">
                  £{(totalTaxPence / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {totalTaxPence > 0 && (
        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
          <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <span className="font-semibold">Section 458 Repayment Relief:</span> If any outstanding loan balance is repaid within 9 months and 1 day of your accounting period end ({paymentDueDate}), the s455 tax is relieved and not payable to HMRC.
          </p>
        </div>
      )}
    </div>
  );
}
