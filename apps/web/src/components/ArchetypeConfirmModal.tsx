'use client';

import React from 'react';
import { AlertTriangle, X, ShieldAlert, ArrowRight, PauseCircle } from 'lucide-react';

interface ArchetypeConfirmModalProps {
  isOpen: boolean;
  targetArchetype: 'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED' | null;
  activeFigures: {
    turnover?: number;
    costOfSales?: number;
    directorLoansTotal?: number;
    propertyIncome?: number;
  };
  onClose: () => void;
  onConfirm: () => void;
}

export function ArchetypeConfirmModal({
  isOpen,
  targetArchetype,
  activeFigures,
  onClose,
  onConfirm
}: ArchetypeConfirmModalProps) {
  if (!isOpen || !targetArchetype) return null;

  const isSwitchingToDormant = targetArchetype === 'DORMANT';
  const turnover = activeFigures.turnover || 0;
  const costOfSales = activeFigures.costOfSales || 0;
  const directorLoansTotal = activeFigures.directorLoansTotal || 0;
  const propertyIncome = activeFigures.propertyIncome || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archetype-modal-title"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {isSwitchingToDormant ? <PauseCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="archetype-modal-title" className="text-base font-semibold tracking-tight text-white">
                {isSwitchingToDormant ? 'Switch to Dormant Company?' : `Switch Archetype to ${targetArchetype}`}
              </h3>
              <p className="text-xs text-slate-300">
                Companies Act 2006 s1169 / Non-Destructive State Switch
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-start space-x-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Active Financial Activity Detected
                </p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Under <strong>Companies Act 2006 section 1169</strong>, a company is legally dormant only during a period in which <em>no significant accounting transactions</em> have occurred.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Currently Entered Figures:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {turnover > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Turnover:</span>
                  <span className="font-mono font-bold text-slate-900">£{turnover.toLocaleString()}</span>
                </div>
              )}
              {costOfSales > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Cost of Sales:</span>
                  <span className="font-mono font-bold text-slate-900">£{costOfSales.toLocaleString()}</span>
                </div>
              )}
              {directorLoansTotal > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Director Loans:</span>
                  <span className="font-mono font-bold text-slate-900">£{directorLoansTotal.toLocaleString()}</span>
                </div>
              )}
              {propertyIncome > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Property Income:</span>
                  <span className="font-mono font-bold text-slate-900">£{propertyIncome.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
            <p className="font-semibold text-slate-800">What happens if you proceed:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>The Profit &amp; Loss section is unmounted and employees are set to 0.</li>
              <li><strong>Zero data loss:</strong> Your entered figures remain safely preserved in LocalStorage and will instantly reappear if you switch back to Trading.</li>
              <li>Filing as Dormant with active transactions will trigger fatal pre-flight validation errors (RULE_19).</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel &amp; Keep Trading
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <span>Switch to Dormant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

