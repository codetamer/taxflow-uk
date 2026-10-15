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
    <div className="bg-stone-50 border border-stone-200/90 rounded-2xl overflow-hidden text-stone-800 transition shadow-2xs">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-stone-100/60 transition gap-4"
      >
        <div className="flex items-center space-x-2.5">
          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
            ?
          </span>
          <div>
            <h4 className="text-xs font-bold text-stone-900 tracking-tight flex items-center space-x-2">
              <span>{title}</span>
              <span className="text-[10px] font-normal text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Plain English Guide
              </span>
            </h4>
            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{summary}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-stone-500 hidden sm:inline font-medium">
            {isOpen ? 'Hide details' : 'What does this mean?'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="px-5 pb-4 pt-1 space-y-3 text-xs border-t border-stone-200/60 animate-in fade-in duration-150">
          <p className="text-stone-700 leading-relaxed font-normal">{summary}</p>

          {tips.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="font-bold text-stone-900 block text-[11px]">Key Rules in Plain English:</span>
              <ul className="space-y-1 text-stone-600 list-disc list-inside">
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
                className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-amber-800 hover:text-amber-950 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Search all tax definitions in Glossary →</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

