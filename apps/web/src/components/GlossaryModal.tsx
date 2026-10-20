'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  X,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { TAX_GLOSSARY, searchGlossary, type GlossaryTerm } from './taxGlossary';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermId?: string;
}

export function GlossaryModal({ isOpen, onClose, initialTermId }: GlossaryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedTermId, setExpandedTermId] = useState<string | null>(initialTermId || 'frs-105');

  // Sync initialTermId if changed
  useEffect(() => {
    if (initialTermId) {
      setExpandedTermId(initialTermId);
    }
  }, [initialTermId]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const categories = ['All', 'Accounts', 'Corporation Tax', 'Director Compliance', 'Technical'];

  const filteredTerms = useMemo(() => {
    let results = searchGlossary(searchQuery);
    if (selectedCategory !== 'All') {
      results = results.filter((t) => t.category === selectedCategory);
    }
    return results;
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-title"
      >
        {/* Header */}
        <div className="bg-[#1C1917] text-white p-6 sm:px-8 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="glossary-title" className="text-xl font-bold tracking-tight">
                Director's Statutory Tax & Compliance Guide
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Clear statutory context, practical director guidance, and real-world compliance insights.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-stone-800 transition"
            aria-label="Close glossary modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 sm:p-6 bg-stone-50 border-b border-stone-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search any tax term, box number, or concept (e.g. s455, balance sheet, AIA, FRS 105)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="text-xs text-slate-400 ml-auto font-mono">
              {filteredTerms.length} {filteredTerms.length === 1 ? 'term' : 'terms'} found
            </span>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 space-y-4">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No definitions found matching your search</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for broader keywords like "tax", "loan", "dividends", "accounts", or "rules".
              </p>
            </div>
          ) : (
            filteredTerms.map((item) => {
              const isExpanded = expandedTermId === item.id;

              return (
                <div
                  key={item.id}
                  className={`pt-4 first:pt-0 rounded-2xl transition ${
                    isExpanded ? 'bg-slate-50/70 p-4 border border-slate-200/80 mb-3' : 'hover:bg-slate-50/50 p-2'
                  }`}
                >
                  <button
                    onClick={() => setExpandedTermId(isExpanded ? null : item.id)}
                    className="w-full text-left flex items-start justify-between gap-4 focus:outline-none group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {item.category}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-amber-700 transition">
                          {item.term}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-600 font-medium">{item.shortSummary}</p>
                    </div>

                    <div className="text-stone-400 group-hover:text-stone-700 pt-1 shrink-0">
                      <ChevronRight
                        className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-stone-200 space-y-3 text-xs animate-in fade-in duration-150">
                      <div className="space-y-1">
                        <span className="font-bold text-stone-900 block text-xs">Practical Director Guidance:</span>
                        <p className="text-stone-700 leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-stone-200">
                          {item.plainEnglish}
                        </p>
                      </div>

                      {item.example && (
                        <div className="space-y-1">
                          <span className="font-bold text-amber-950 block text-xs">Real-World Scenario:</span>
                          <p className="text-stone-900 leading-relaxed bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                            {item.example}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="font-bold text-stone-900 block text-xs">Why Companies House / HMRC Care:</span>
                        <p className="text-stone-600 leading-relaxed">{item.whyItMatters}</p>
                      </div>

                      {item.statutoryRef && (
                        <div className="text-[11px] text-stone-400 font-mono pt-1">
                          Statute: {item.statutoryRef}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>TaxFlow Pre-Flight Shield audits all these rules automatically before you submit.</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}

