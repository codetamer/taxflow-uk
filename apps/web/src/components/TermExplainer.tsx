'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ExternalLink, BookOpen, Check } from 'lucide-react';
import { getGlossaryTerm } from './taxGlossary';

interface TermExplainerProps {
  termId: string;
  label?: string; // custom display text if different from term name
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function TermExplainer({ termId, label, children, showIcon = true }: TermExplainerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const termData = getGlossaryTerm(termId);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!termData) {
    return <span>{children || label}</span>;
  }

  const displayText = children || label || termData.term;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center space-x-1 text-stone-800 hover:text-amber-700 underline decoration-stone-300 underline-offset-2 decoration-dotted font-medium transition cursor-help focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
        title={`Click to read plain-English explanation for ${termData.term}`}
        aria-label={`What does ${termData.term} mean?`}
      >
        <span>{displayText}</span>
        {showIcon && <HelpCircle className="w-3.5 h-3.5 text-stone-400 hover:text-amber-600 shrink-0" />}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 p-5 text-left text-stone-900 animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-2 border-b border-stone-100 gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {termData.category}
              </span>
              <h4 className="text-sm font-bold text-stone-950 mt-1">{termData.term}</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition"
              aria-label="Close explanation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-3 pt-3 text-xs">
            <p className="font-semibold text-stone-800 leading-snug">
              {termData.shortSummary}
            </p>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-1 text-stone-600 leading-relaxed">
              <span className="font-bold text-stone-900 block">In Plain English:</span>
              <p className="whitespace-pre-line">{termData.plainEnglish}</p>
            </div>

            {termData.example && (
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-1 text-stone-900 leading-relaxed">
                <span className="font-bold block text-amber-950">Real-World Example:</span>
                <p>{termData.example}</p>
              </div>
            )}

            <div className="space-y-1 text-stone-600 leading-relaxed">
              <span className="font-bold text-stone-900 block">Why HMRC & Companies House Care:</span>
              <p>{termData.whyItMatters}</p>
            </div>

            {termData.statutoryRef && (
              <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-mono">
                Statutory Reference: {termData.statutoryRef}
              </div>
            )}
          </div>

          {/* Footer Dismiss Button */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
            >
              Got it, thanks
            </button>
          </div>
        </div>
      )}
    </span>
  );
}

