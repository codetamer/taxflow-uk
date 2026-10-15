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
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Building2,
  AlertCircle
} from 'lucide-react';
import { TAX_GLOSSARY, GlossaryTerm } from '@/components/taxGlossary';

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Check URL hash on mount or hash change
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setHighlightedId(hash);
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

  const copyTermLink = (id: string) => {
    const url = `${window.location.origin}/glossary#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCitation = (term: GlossaryTerm) => {
    if (!term.statutoryRef) return;
    navigator.clipboard.writeText(term.statutoryRef);
    setCopiedCitationId(term.id);
    setTimeout(() => setCopiedCitationId(null), 2000);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-4">
      {/* Editorial Header */}
      <section className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>Statutory Tax & Accounting Encyclopedia</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-950">
              Plain-English Tax & Audit Guide
            </h1>
            <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
              Every UK statutory accounting term, Companies Act regulation, and HMRC CT600 code explained with everyday analogies, statutory citations, and practical guidance for company directors.
            </p>
          </div>

          <Link
            href="/filings/drop-logicx/wizard"
            className="inline-flex items-center justify-center space-x-2 bg-stone-950 text-white hover:bg-stone-800 px-5 py-3 rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
          >
            <span>Start Filing Return</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
      </section>

      {/* Search and Category Filter Toolbar */}
      <section className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs space-y-5">
        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by term name, keyword, or statute (e.g. s455, FRS 105, AIA, balance sheet, dividends)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400 hover:text-stone-700 px-2 py-1 bg-stone-200/70 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-stone-100">
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
                      ? 'bg-stone-950 text-white shadow-xs'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  {cat === 'ALL' ? 'All Terms' : cat} ({count})
                </button>
              );
            })}
          </div>

          <div className="text-xs text-stone-500 font-medium">
            Showing <span className="font-bold text-stone-900">{filteredTerms.length}</span> of {TAX_GLOSSARY.length} terms
          </div>
        </div>
      </section>

      {/* Terms Grid */}
      <section className="space-y-6">
        {filteredTerms.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900">No matching tax terms found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try searching for a different phrase like "dividends", "loan", "CT600", or "balance sheet".
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline"
            >
              Reset search filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredTerms.map((item) => {
              const isHighlighted = highlightedId === item.id;

              return (
                <article
                  key={item.id}
                  id={item.id}
                  className={`bg-white rounded-3xl p-6 sm:p-8 border transition-all duration-300 space-y-6 ${
                    isHighlighted
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                      : 'border-stone-200 hover:border-stone-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Top Bar: Category & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-mono text-stone-400">
                        #{item.id}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => copyTermLink(item.id)}
                        className="inline-flex items-center space-x-1 text-xs text-stone-500 hover:text-stone-900 px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
                        title="Copy direct link to this term"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-amber-700 font-semibold">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Share Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Term Heading & Short Summary */}
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-950">
                      {item.term}
                    </h2>
                    <p className="text-sm font-medium text-amber-950 bg-amber-50/70 border border-amber-200/60 px-3.5 py-2 rounded-xl">
                      {item.shortSummary}
                    </p>
                  </div>

                  {/* Plain English Core Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Plain-English Breakdown
                    </h3>
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                      {item.plainEnglish}
                    </p>
                  </div>

                  {/* Why It Matters Callout */}
                  <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-stone-900">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Why It Matters To Your Company</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {item.whyItMatters}
                    </p>
                  </div>

                  {/* Concrete Example / Real Scenario */}
                  {item.example && (
                    <div className="bg-amber-50/40 rounded-2xl p-5 border border-amber-200/60 space-y-1.5 text-xs text-stone-900">
                      <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>Real-World Scenario</span>
                      </div>
                      <p className="leading-relaxed">
                        {item.example}
                      </p>
                    </div>
                  )}

                  {/* Statutory Reference Footer */}
                  {item.statutoryRef && (
                    <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-stone-500">Statute:</span>
                        <span className="font-mono text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                          {item.statutoryRef}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyCitation(item)}
                        className="text-stone-500 hover:text-stone-900 font-semibold self-start sm:self-auto flex items-center space-x-1"
                      >
                        {copiedCitationId === item.id ? (
                          <span className="text-amber-700 font-bold flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Citation Copied</span>
                          </span>
                        ) : (
                          <span>Copy Citation</span>
                        )}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom CTA Card */}
      <section className="bg-stone-950 text-white rounded-3xl p-8 sm:p-10 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-2xl font-bold tracking-tight">Ready to test these rules on your company?</h2>
          <p className="text-xs sm:text-sm text-stone-400 max-w-lg">
            Use our interactive tax simulator or open the Filing Wizard to generate free watermarked draft accounts in minutes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/filings/drop-logicx/wizard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold px-6 py-3 rounded-xl text-xs transition"
          >
            <span>Open Filing Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 font-semibold px-6 py-3 rounded-xl text-xs transition"
          >
            <span>Back to Calculator</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
