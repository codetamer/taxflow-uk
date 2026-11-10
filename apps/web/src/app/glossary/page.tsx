'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Scale,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { TAX_GLOSSARY, GlossaryTerm } from '@/components/taxGlossary';

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Check URL hash on mount or hash change
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setHighlightedId(hash);
        setExpandedIds((prev) => new Set(prev).add(hash));
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const categories = useMemo(() => {
    return ['ALL', 'Accounts', 'Corporation Tax', 'Director Compliance', 'Technical'];
  }, []);

  const filteredTerms = useMemo(() => {
    let terms = TAX_GLOSSARY;

    if (selectedCategory !== 'ALL') {
      terms = terms.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.shortSummary.toLowerCase().includes(q) ||
          t.plainEnglish.toLowerCase().includes(q) ||
          t.whyItMatters.toLowerCase().includes(q) ||
          (t.statutoryRef && t.statutoryRef.toLowerCase().includes(q)) ||
          (t.example && t.example.toLowerCase().includes(q))
      );
    }

    return terms;
  }, [searchQuery, selectedCategory]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedIds.size >= filteredTerms.length / 2) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredTerms.map((t) => t.id)));
    }
  };

  const copyTermLink = (id: string) => {
    const url = `${window.location.origin}/glossary#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyCitation = (term: GlossaryTerm) => {
    if (!term.statutoryRef) return;
    navigator.clipboard.writeText(term.statutoryRef);
    setCopiedCitationId(term.id);
    setTimeout(() => setCopiedCitationId(null), 2500);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-4">
      {/* Editorial Header */}
      <section className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
          <span>Director's Tax & Accounting Encyclopedia</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950">
              Director's Tax & Compliance Guide
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Comprehensive UK accounting principles, Companies Act regulations, and HMRC CT600 codes explained with practical examples, official citations, and actionable guidance for company directors.
            </p>
          </div>

          <Link
            href="/filings/drop-logicx/wizard"
            className="inline-flex items-center justify-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-3 rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
          >
            <span>Start Filing Return</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
        </div>
      </section>

      {/* Search and Category Filter Toolbar */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by term name, keyword, or statute (e.g. s455, FRS 105, AIA, balance sheet, dividends)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 bg-slate-200/70 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'ALL'
                  ? TAX_GLOSSARY.length
                  : TAX_GLOSSARY.filter((t) => t.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {cat === 'ALL' ? 'All Terms' : cat} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredTerms.length}</span> of {TAX_GLOSSARY.length} terms
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition flex items-center space-x-1"
            >
              <span>{expandedIds.size >= filteredTerms.length / 2 && filteredTerms.length > 0 ? 'Collapse All' : 'Expand All'}</span>
              {expandedIds.size >= filteredTerms.length / 2 && filteredTerms.length > 0 ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Terms Grid */}
      <section className="space-y-6">
        {filteredTerms.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No matching tax terms found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for a different phrase like "dividends", "loan", "CT600", or "balance sheet".
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
            >
              Reset search filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {filteredTerms.map((item) => {
              const isHighlighted = highlightedId === item.id;
              const isExpanded = expandedIds.has(item.id);

              return (
                <article
                  key={item.id}
                  id={item.id}
                  className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
                    isHighlighted
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Card Header (clickable accordion) */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-5 sm:p-6 cursor-pointer hover:bg-slate-50/60 transition space-y-3 select-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          #{item.id}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => copyTermLink(item.id)}
                          className={`inline-flex items-center space-x-1 text-[11px] px-2.5 py-1 rounded-lg border transition ${
                            copiedId === item.id
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                              : 'text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Copy direct link to this term"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>✓ Link Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Share Link</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 flex items-center justify-between">
                        <span>{item.term}</span>
                      </h2>
                      <p className="text-xs font-medium text-slate-800 bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-xl">
                        {item.shortSummary}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 space-y-4 animate-in fade-in-50">
                      {/* Practical Guidance Core Section */}
                      <div className="space-y-2 pt-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Practical Guidance & Overview
                        </h3>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {item.plainEnglish}
                        </p>
                      </div>

                      {/* Why It Matters Callout */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Why It Matters To Your Company</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.whyItMatters}
                        </p>
                      </div>

                      {/* Concrete Example / Real Scenario */}
                      {item.example && (
                        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/60 space-y-1 text-xs text-slate-900">
                          <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Real-World Scenario</span>
                          </div>
                          <p className="leading-relaxed text-[11px] text-slate-700">
                            {item.example}
                          </p>
                        </div>
                      )}

                      {/* Official Reference Footer */}
                      {item.statutoryRef && (
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center space-x-1.5 overflow-x-auto">
                            <span className="font-semibold text-slate-400 text-[11px]">Statute:</span>
                            <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {item.statutoryRef}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyCitation(item)}
                            className="text-slate-500 hover:text-slate-900 font-semibold self-start sm:self-auto flex items-center space-x-1 text-[11px]"
                          >
                            {copiedCitationId === item.id ? (
                              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>✓ Citation Copied</span>
                              </span>
                            ) : (
                              <span>Copy Citation</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom CTA Card */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-2xl font-bold tracking-tight">Ready to test these rules on your company?</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            Use our interactive tax simulator or open the Filing Wizard to generate free watermarked draft accounts in minutes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/filings/drop-logicx/wizard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow-xs"
          >
            <span>Open Filing Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold px-6 py-3 rounded-xl text-xs transition"
          >
            <span>Back to Calculator</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
