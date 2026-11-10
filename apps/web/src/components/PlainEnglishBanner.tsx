'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Sparkles } from 'lucide-react';

interface PlainEnglishBannerProps {
  title: string;
  summary: string;
  tips?: string[];
  onOpenGlossary?: () => void;
  defaultOpen?: boolean;
}

export function PlainEnglishBanner({
  title,
  summary,
  tips = [],
  onOpenGlossary,
  defaultOpen = false,
}: PlainEnglishBannerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden text-slate-800 transition shadow-2xs">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/60 transition gap-4"
      >
        <div className="flex items-center space-x-2.5">
          <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center font-bold text-xs">
            ?
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{title}</span>
              <span className="text-[10px] font-normal text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Director Guidance
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{summary}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline font-medium">
            {isOpen ? 'Hide guidance' : 'View director guidance'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="px-5 pb-4 pt-1 space-y-3 text-xs border-t border-slate-200/60 animate-in fade-in duration-150">
          <p className="text-slate-700 leading-relaxed font-normal">{summary}</p>

          {tips.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="font-bold text-slate-900 block text-[11px]">Key Principles & Helpful Tips:</span>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                {tips.map((tip, index) => (
                  <li key={index} className="leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {onOpenGlossary && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenGlossary();
                }}
                className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explore complete Director Guide & Key Definitions →</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const DirectorGuidanceBanner = PlainEnglishBanner;
