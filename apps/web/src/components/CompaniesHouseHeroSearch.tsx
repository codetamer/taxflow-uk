'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  ArrowRight,
  X,
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface SearchResultItem {
  company_number: string;
  title: string;
  company_status: string;
  company_type: string;
  address_snippet?: string;
  date_of_creation?: string;
}

export function CompaniesHouseHeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<SearchResultItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/companies-house/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.items)) {
            setResults(data.items);
            setIsOpen(data.items.length > 0);
          } else {
            setResults([]);
          }
        }
      } catch (err) {
        console.error('Companies House search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (company: SearchResultItem) => {
    setSelectedCompany(company);
    setIsOpen(false);
    setQuery(company.title);
  };

  const handleClear = () => {
    setSelectedCompany(null);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleStartFiling = () => {
    if (!selectedCompany) return;
    // Route to wizard with CRN pre-populated
    router.push(`/filings/drop-logicx/wizard?crn=${encodeURIComponent(selectedCompany.company_number)}&name=${encodeURIComponent(selectedCompany.title)}`);
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto text-left relative z-30">
      {/* Search Input Box */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-amber-500 transition-colors">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedCompany) setSelectedCompany(null);
          }}
          onFocus={() => {
            if (results.length > 0 && !selectedCompany) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search Companies House by name or CRN (e.g. Droplogicx or 15152081)..."
          className="w-full pl-11 pr-24 py-4 rounded-2xl bg-white border-2 border-stone-200/90 shadow-lg text-stone-900 placeholder:text-stone-400 font-medium text-sm sm:text-base focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition"
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1.5">
          {query && (
            <button
              onClick={handleClear}
              type="button"
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-stone-100 text-stone-500 border border-stone-200">
            CH API
          </span>
        </div>
      </div>

      {/* Quick Search Chips */}
      {!selectedCompany && query.length === 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2.5 px-1 text-xs text-stone-500">
          <span className="font-medium text-stone-400">Quick lookup:</span>
          <button
            type="button"
            onClick={() => setQuery('DROPLOGICX LTD')}
            className="px-2.5 py-1 rounded-full bg-stone-100/90 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-stone-200 text-stone-700 transition"
          >
            DROPLOGICX LTD (15152081)
          </button>
          <button
            type="button"
            onClick={() => setQuery('TINYTAX ALTERNATIVE LTD')}
            className="px-2.5 py-1 rounded-full bg-stone-100/90 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-stone-200 text-stone-700 transition"
          >
            TINYTAX ALTERNATIVE LTD
          </button>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && !selectedCompany && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden divide-y divide-stone-100 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
          <div className="bg-stone-50 px-4 py-2 text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span>Companies House Live Registry Matches</span>
            <span>{results.length} results</span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {results.map((item, idx) => (
              <button
                key={item.company_number}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition ${
                  selectedIndex === idx ? 'bg-amber-50/70' : 'hover:bg-stone-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-mono font-medium">
                      CRN: {item.company_number}
                    </span>
                  </div>
                  {item.address_snippet && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-md">{item.address_snippet}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    item.company_status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.company_status}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
                    {item.company_type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Company Entity Card */}
      {selectedCompany && (
        <div className="mt-4 bg-gradient-to-b from-white to-stone-50/70 rounded-2xl border-2 border-amber-500/50 shadow-xl p-5 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Verified Legal Entity</span>
                </span>
                <span className="bg-stone-100 text-stone-700 text-xs px-2 py-0.5 rounded font-mono font-semibold">
                  CRN: {selectedCompany.company_number}
                </span>
              </div>
              <h3 className="text-xl font-bold text-stone-950 tracking-tight">
                {selectedCompany.title}
              </h3>
              {selectedCompany.address_snippet && (
                <div className="flex items-center space-x-1.5 text-xs text-stone-600">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{selectedCompany.address_snippet}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleClear}
              type="button"
              className="text-xs text-stone-400 hover:text-stone-600 underline font-medium"
            >
              Change
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-stone-900">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Eligible for FRS 105 Micro-Entity Standard:</strong> Simplified 2-page balance sheet with 0p rejection defense.</span>
            </div>
            <span className="font-mono font-bold text-amber-700">£49 Net</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleStartFiling}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold px-6 py-3.5 rounded-xl transition shadow-md"
            >
              <span>Start Micro-Entity Filing for {selectedCompany.title}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => router.push(`/auth/signup?crn=${selectedCompany.company_number}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-4 py-3.5 rounded-xl text-xs transition"
            >
              <span>Create Director Account First</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

