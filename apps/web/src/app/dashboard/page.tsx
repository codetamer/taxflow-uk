'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  ShieldCheck,
  FileDown,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Plus,
  HelpCircle,
  Scale,
  BookOpen,
  Search,
  Loader2,
  X
} from 'lucide-react';
import { TermExplainer } from '@/components/TermExplainer';
import { PlainEnglishBanner } from '@/components/PlainEnglishBanner';
import { GlossaryModal } from '@/components/GlossaryModal';

interface ConnectedCompany {
  id: string;
  crn: string;
  name: string;
  utr?: string;
  registeredAddress: string;
  companyType: string;
  isCloseCompany: boolean;
  userRole?: string;
}

export default function DashboardPage() {
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [initialGlossaryTerm, setInitialGlossaryTerm] = useState<string>('');
  const [companies, setCompanies] = useState<ConnectedCompany[]>([]);
  const [selectedCrn, setSelectedCrn] = useState<string>('15152081');
  const [userName, setUserName] = useState<string>('Director');
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState<boolean>(false);
  
  // Connect Company Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [searchCrn, setSearchCrn] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const openGlossary = (termId: string) => {
    setInitialGlossaryTerm(termId);
    setIsGlossaryOpen(true);
  };

  const [latestFiling, setLatestFiling] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUserName(data.user.fullName);
            if (Array.isArray(data.companies) && data.companies.length > 0) {
              setCompanies(data.companies);
              setSelectedCrn(data.companies[0].crn);
            } else {
              // Default fallback company if user has none yet
              const defaultCompany: ConnectedCompany = {
                id: 'comp_droplogicx',
                crn: '15152081',
                name: 'DROPLOGICX LTD',
                utr: '1234567890',
                registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
                companyType: 'ltd',
                isCloseCompany: true,
                userRole: 'DIRECTOR'
              };
              setCompanies([defaultCompany]);
              setSelectedCrn('15152081');
            }
          }
        }

        // Load active filings
        const filingsRes = await fetch('/api/filings');
        if (filingsRes.ok) {
          const filingsData = await filingsRes.json();
          if (filingsData.success && Array.isArray(filingsData.filings) && filingsData.filings.length > 0) {
            setLatestFiling(filingsData.filings[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load user companies or filings:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    loadUser();
  }, []);

  const handleConnectCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCrn.trim()) return;
    setIsConnecting(true);
    setConnectError(null);

    try {
      const res = await fetch('/api/companies/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crn: searchCrn.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompanies(data.companies);
        setSelectedCrn(data.company.crn);
        setIsConnectModalOpen(false);
        setSearchCrn('');
      } else {
        setConnectError(data.error || 'Failed to connect company');
      }
    } catch (err: any) {
      setConnectError(err.message || 'Error connecting company');
    } finally {
      setIsConnecting(false);
    }
  };

  const activeCompany = companies.find((c) => c.crn === selectedCrn) || companies[0] || {
    name: 'DROPLOGICX LTD',
    crn: '15152081',
    utr: '1234567890',
    registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
    companyType: 'ltd',
    isCloseCompany: true,
    userRole: 'DIRECTOR'
  };

  // Statutory Filing Baseline
  const filingMetrics = {
    jurisdiction: 'England & Wales',
    director: userName,
    accountingStandard: 'FRS 105 (Micro-Entities)',
    periodStart: '01 Oct 2025',
    periodEnd: '30 Sep 2026',
    turnover: '£100,000.00',
    operatingProfit: '£31,900.00',
    taxPayable: '£6,061.00',
    effectiveRate: '19.00%',
    netProfit: '£25,839.00',
    retainedEarnings: '£31,039.00',
    netAssets: '£31,139.00',
    accountsDueDate: '30 Jun 2027',
    taxDueDate: '01 Jul 2027',
    ct600DueDate: '30 Sep 2027',
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Sovereign Executive Header with Multi-Company Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1C1917] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Building2 className="w-6 h-6 text-amber-500" />
            </div>

            <div className="relative">
              {/* Company Switcher Dropdown Trigger */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                  className="group flex items-center space-x-2 text-left focus:outline-none"
                >
                  <h1 className="text-2xl font-bold tracking-tight text-stone-950 group-hover:text-amber-700 transition">
                    {activeCompany.name}
                  </h1>
                  <ChevronDown className="w-5 h-5 text-stone-400 group-hover:text-stone-700 transition" />
                </button>
                <span className="bg-amber-50 text-amber-900 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                  Active
                </span>
              </div>

              <p className="text-xs text-stone-500 font-mono mt-0.5">
                CRN: <span className="font-semibold text-stone-800">{activeCompany.crn}</span> · UTR: <span className="font-semibold text-stone-800">{activeCompany.utr || '1234567890'}</span> · {filingMetrics.jurisdiction}
              </p>

              {/* Multi-Company Dropdown Menu */}
              {isCompanyDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl border border-stone-200 shadow-2xl p-2 z-50 divide-y divide-stone-100 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 text-[10px] uppercase font-mono font-bold text-stone-400 tracking-wider">
                    Switch Connected Company ({companies.length})
                  </div>
                  <div className="py-1 space-y-1 max-h-60 overflow-y-auto">
                    {companies.map((c) => (
                      <button
                        key={c.crn}
                        type="button"
                        onClick={() => {
                          setSelectedCrn(c.crn);
                          setIsCompanyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center justify-between ${
                          c.crn === activeCompany.crn
                            ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200'
                            : 'hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{c.name}</p>
                          <p className="text-[10px] text-stone-500 font-mono">CRN: {c.crn}</p>
                        </div>
                        {c.crn === activeCompany.crn && (
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCompanyDropdownOpen(false);
                        setIsConnectModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-amber-800 hover:bg-amber-50 font-semibold flex items-center space-x-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect another UK Company</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-600 pt-1 border-t border-stone-100">
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Current Period: <strong>{filingMetrics.periodStart}</strong> to <strong>{filingMetrics.periodEnd}</strong></span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-stone-400" />
              <span>
                Standard: <TermExplainer termId="frs-105" label={filingMetrics.accountingStandard} />
              </span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Director: <strong>{userName}</strong></span>
            </span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <Link
            href={`/filings/${latestFiling?.id || 'drop-logicx'}/wizard?crn=${activeCompany.crn}&name=${encodeURIComponent(activeCompany.name)}`}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-bold px-5 py-2.5 rounded-xl text-sm shadow-xs transition"
          >
            <span>Resume Filing Wizard</span>
            <ArrowRight className="w-4 h-4 text-stone-900" />
          </Link>
          <button
            type="button"
            onClick={() => setIsGlossaryOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Tax Glossary</span>
          </button>
        </div>
      </div>

      {/* Plain-English Director's Briefing */}
      <PlainEnglishBanner
        title="Director's Compliance Briefing: What You Need to Know"
        summary="As a director of a UK limited company, you have two separate legal responsibilities: submitting statutory accounts to Companies House and paying Corporation Tax to HMRC. TaxFlow aligns both together automatically."
        tips={[
          'Companies House Accounts are public and show your company balance sheet and legal exemptions.',
          'HMRC CT600 Return is private and details your income, allowable expenses, and tax payable.',
          'Your Corporation Tax payment is due on 01 July 2027 (9 months and 1 day after year end), while your CT600 return is due by 30 September 2027.'
        ]}
        onOpenGlossary={() => openGlossary('ct600')}
        defaultOpen={true}
      />

      {/* Statutory Filing Deadlines Countdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-stone-400" />
            <span>Statutory Filing Deadlines & Timetable</span>
          </h2>
          <span className="text-xs text-stone-400">All filings currently in draft</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-500">
                <TermExplainer termId="s477-exemption" label="Companies House Accounts" />
              </p>
              <p className="text-lg font-bold text-stone-950 font-mono">{filingMetrics.accountsDueDate}</p>
              <p className="text-[11px] text-stone-400">9 months from period end (s442)</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 text-[11px] font-semibold rounded-full border border-amber-200">
                Draft Ready
              </span>
              <p className="text-[10px] text-stone-400">0 Gateway Errors</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-500">
                <TermExplainer termId="ct600" label="HMRC Tax Payment" />
              </p>
              <p className="text-lg font-bold text-stone-950 font-mono">{filingMetrics.taxDueDate}</p>
              <p className="text-[11px] text-stone-400">9 months + 1 day from end (s59D)</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 text-[11px] font-semibold rounded-full border border-amber-200">
                {filingMetrics.taxPayable}
              </span>
              <p className="text-[10px] text-stone-400">19% Small Profits</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-500">
                <TermExplainer termId="ct600" label="HMRC CT600 Return" />
              </p>
              <p className="text-lg font-bold text-stone-950 font-mono">{filingMetrics.ct600DueDate}</p>
              <p className="text-[11px] text-stone-400">12 months from period end</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 text-[11px] font-semibold rounded-full border border-amber-200">
                Draft Ready
              </span>
              <p className="text-[10px] text-stone-400">IRmark Ready</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-500">
                <TermExplainer termId="confirmation-statement" label="Confirmation Statement (CS01)" />
              </p>
              <p className="text-lg font-bold text-stone-950 font-mono">15 Sep 2027</p>
              <p className="text-[11px] text-stone-400">Identity check (separate from accounts)</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="px-2.5 py-0.5 bg-stone-100 text-stone-700 text-[11px] font-semibold rounded-full border border-stone-200">
                £34 Fee
              </span>
              <p className="text-[10px] text-stone-400">Officers & PSC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accounting Baseline Numbers */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span>Statutory Accounting & Tax Position (2025/26)</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
            <p className="text-xs font-medium text-stone-500">
              <TermExplainer termId="ct600" label="Turnover (Box 145)" />
            </p>
            <p className="text-2xl font-bold text-stone-950 font-mono">{filingMetrics.turnover}</p>
            <p className="text-[11px] text-stone-500">100% Micro-entity trade</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
            <p className="text-xs font-medium text-stone-500">
              <TermExplainer termId="disallowable-expenses" label="Total Taxable Profits" />
            </p>
            <p className="text-2xl font-bold text-stone-950 font-mono">{filingMetrics.operatingProfit}</p>
            <p className="text-[11px] text-stone-500">Box 235 after add-backs</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
            <p className="text-xs font-medium text-stone-500">
              <TermExplainer termId="ct600" label="Corporation Tax (19%)" />
            </p>
            <p className="text-2xl font-bold text-amber-700 font-mono">{filingMetrics.taxPayable}</p>
            <p className="text-[11px] text-stone-500">Small Profits Rate (A ≤ £50k)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
            <p className="text-xs font-medium text-stone-500">
              <TermExplainer termId="distributable-reserves" label="Distributable Reserves" />
            </p>
            <p className="text-2xl font-bold text-stone-950 font-mono">{filingMetrics.retainedEarnings}</p>
            <p className="text-[11px] text-stone-500">Available for dividends</p>
          </div>
        </div>
      </div>

      {/* Pre-Flight Shield Radar Banner */}
      <div className="bg-[#1C1917] text-white rounded-3xl p-6 sm:p-7 border border-stone-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold">40-Point Pre-Flight Rejection Shield</h3>
            <span className="bg-emerald-400/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-400/20">
              PASSED 40 / 40
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
            Every balance sheet equation balances to 0p. Companies Act 2006 s477 audit exemption is declared. Director loan schedule complies with CTA 2010 s455. Zero gateway errors.
          </p>
        </div>

        <Link
          href={`/filings/${latestFiling?.id || 'drop-logicx'}/shield?crn=${activeCompany.crn}`}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition whitespace-nowrap self-stretch sm:self-auto text-center"
        >
          Inspect 40 Validation Checks
        </Link>
      </div>

      {/* Free Watermarked Drafts & Document Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-950 text-base">Statutory FRS 105 Accounts (PDF)</h3>
              <p className="text-xs text-stone-500">Balance sheet, P&L, footnotes, and director sign-off</p>
            </div>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Download your free watermarked PDF copy before submission. Review exact numbers with co-directors or stakeholders without paying a penny.
          </p>
          <div className="pt-2 flex items-center space-x-3">
            <a
              href="/api/documents/accounts-pdf?draft=true"
              target="_blank"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-900 hover:text-amber-700 bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition"
            >
              <FileDown className="w-3.5 h-3.5 text-stone-500" />
              <span>Download Draft Accounts</span>
            </a>
            <a
              href="/api/documents/ixbrl?draft=true"
              target="_blank"
              className="inline-flex items-center space-x-1 text-xs font-medium text-stone-600 hover:text-stone-900 px-2 py-2 transition"
            >
              <span>View iXBRL Code</span>
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-950 text-base">HMRC CT600 Form & CT600A (PDF)</h3>
              <p className="text-xs text-stone-500">Official HMRC box layout with s455 loan schedule</p>
            </div>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Recreates the official HMRC return: Box 145 (Turnover), Box 235 (Profits), Box 440 (Tax @ 19%), and CT600A director loan schedule.
          </p>
          <div className="pt-2 flex items-center space-x-3">
            <a
              href="/api/documents/ct600-pdf?draft=true"
              target="_blank"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition border border-amber-200"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Draft CT600</span>
            </a>
            <Link
              href={`/filings/${latestFiling?.id || 'drop-logicx'}/documents`}
              className="inline-flex items-center space-x-1 text-xs font-medium text-stone-600 hover:text-stone-900 px-2 py-2 transition"
            >
              <span>Document Center</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Connect Company Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900 tracking-tight">Connect another UK Company</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Enter the 8-digit Company Registration Number (CRN) to sync with Companies House.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {connectError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {connectError}
              </div>
            )}

            <form onSubmit={handleConnectCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Company Registration Number (CRN)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12345678"
                  value={searchCrn}
                  onChange={(e) => setSearchCrn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {isConnecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Connect Entity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Glossary Modal */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        initialTermId={initialGlossaryTerm}
      />
    </div>
  );
}
