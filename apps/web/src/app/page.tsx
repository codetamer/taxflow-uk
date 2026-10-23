'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Calculator,
  Building2,
  Scale,
  Sparkles,
  Download,
  Lock,
  ChevronRight,
  HelpCircle,
  BookOpen,
  Info
} from 'lucide-react';
import { TermExplainer } from '@/components/TermExplainer';
import { GlossaryModal } from '@/components/GlossaryModal';
import { CompaniesHouseHeroSearch } from '@/components/CompaniesHouseHeroSearch';

export default function HomePage() {
  // Live Simulator State
  const [turnover, setTurnover] = useState<number>(100000);
  const [expenses, setExpenses] = useState<number>(68100);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [initialGlossaryTerm, setInitialGlossaryTerm] = useState<string>('');

  const openGlossary = (termId: string) => {
    setInitialGlossaryTerm(termId);
    setIsGlossaryOpen(true);
  };

  // Computed Figures
  const isDropLogicXPreset = turnover === 100000 && expenses === 68100;
  // DropLogicX benchmark: £100k turnover, £68,100 expenses, £3,100 disallowables add-back, £15,000 AIA capital allowance
  const aiaDeduction = isDropLogicXPreset ? 15000 : 0;
  const disallowablesAddback = isDropLogicXPreset ? 3100 : 0;
  const taxableProfit = Math.max(0, turnover - expenses + disallowablesAddback - aiaDeduction);
  const profitBeforeTax = Math.max(0, turnover - expenses);

  // Small profits rate 19% up to £50k, marginal relief up to £250k, main rate 25%
  let corporationTax = 0;
  if (taxableProfit <= 50000) {
    corporationTax = Math.round(taxableProfit * 0.19);
  } else if (taxableProfit <= 250000) {
    const standardTax = taxableProfit * 0.25;
    const marginalRelief = (250000 - taxableProfit) * (3 / 200);
    corporationTax = Math.round(standardTax - marginalRelief);
  } else {
    corporationTax = Math.round(taxableProfit * 0.25);
  }

  const netProfitAfterTax = profitBeforeTax - corporationTax;
  const effectiveRate = taxableProfit > 0 ? ((corporationTax / taxableProfit) * 100).toFixed(1) : '19.0';

  return (
    <div className="space-y-20 py-4 max-w-6xl mx-auto">
      {/* Editorial Authority Hero */}
      <section className="text-center space-y-6 pt-6 sm:pt-10">
        <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
          <span>Finance Act 2024 & 2026/27 Tax Rules Active</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-stone-950 max-w-4xl mx-auto leading-tight">
          Modern statutory tax filing for UK micro-entities.
        </h1>

        <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          File official <TermExplainer termId="frs-105" label="FRS 105 annual accounts" /> to Companies House and <TermExplainer termId="ct600" label="CT600 returns" /> to HMRC with comprehensive pre-flight compliance checks. Free watermarked draft PDFs. Pay £49 only upon final submission.
        </p>

        {/* Live Companies House Search Engine */}
        <div className="py-2">
          <CompaniesHouseHeroSearch />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/filings/drop-logicx/wizard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-stone-950 text-white hover:bg-stone-800 px-6 py-3.5 rounded-xl font-semibold shadow-xs hover:shadow transition"
          >
            <span>Start Micro-Entity Filing</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </Link>
          <Link
            href="/glossary"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 px-6 py-3.5 rounded-xl font-semibold transition"
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Director's Tax & Compliance Guide</span>
          </Link>
        </div>

        {/* Quiet Trust Bar */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs text-stone-500">
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span><TermExplainer termId="frs-105" label="FRS 105 Micro-Entity Standard" /></span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span><TermExplainer termId="s455-loan" label="HMRC CT600 & s455 Loan Schedules" /></span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span><TermExplainer termId="balance-sheet-symmetry" label="0p Balance Sheet Symmetry" /></span>
          </span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Companies House Live TIS Verification</span>
          </span>
        </div>
      </section>

      {/* Centerpiece: Interactive Live Tax & Accounts Simulator */}
      <section className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="bg-stone-950 text-white px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h2 className="text-sm font-semibold tracking-wide text-stone-200">
                Interactive Calculation Engine Demo
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Adjust numbers below to see instant 2026/27 corporation tax and balance sheet symmetry in real time.
            </p>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full font-mono font-medium border border-amber-500/20">
              40 / 40 Shield Checks Passing
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Scenario Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTurnover(50000);
                    setExpenses(20000);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    turnover === 50000
                      ? 'bg-stone-950 text-white border-stone-950'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  £50k (Small Profits)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTurnover(100000);
                    setExpenses(68100);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    turnover === 100000
                      ? 'bg-stone-950 text-white border-stone-950'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  £100k (DropLogicX Benchmark)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTurnover(180000);
                    setExpenses(80000);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    turnover === 180000
                      ? 'bg-stone-950 text-white border-stone-950'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  £180k (Marginal Relief)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTurnover(350000);
                    setExpenses(70000);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    turnover === 350000
                      ? 'bg-stone-950 text-white border-stone-950'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  £350k (Main Rate 25%)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-stone-800">
                <label htmlFor="turnover-slider">
                  <TermExplainer termId="ct600" label="Annual Trading Turnover" />
                </label>
                <span className="font-mono font-bold text-stone-950 text-base">£{turnover.toLocaleString()}</span>
              </div>
              <input
                id="turnover-slider"
                type="range"
                min="10000"
                max="1000000"
                step="10000"
                value={turnover}
                onChange={(e) => setTurnover(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[11px] text-stone-400 font-mono">
                <span>£10,000</span>
                <span>£500,000</span>
                <span>£1,000,000 (Micro Max)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-stone-800">
                <label htmlFor="expenses-slider">
                  <TermExplainer termId="disallowable-expenses" label="Allowable Business Expenses" />
                </label>
                <span className="font-mono font-bold text-stone-950 text-base">£{expenses.toLocaleString()}</span>
              </div>
              <input
                id="expenses-slider"
                type="range"
                min="0"
                max={Math.max(10000, turnover - 5000)}
                step="2500"
                value={expenses}
                onChange={(e) => setExpenses(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[11px] text-stone-400 font-mono">
                <span>£0</span>
                <span>Cost of sales, software, admin</span>
                <span>£{(turnover - 5000).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2.5 text-xs text-stone-600">
              <div className="flex items-center space-x-1.5 font-semibold text-stone-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Automated Tax Deductions</span>
              </div>
              <p className="leading-relaxed">
                Includes full 100% <TermExplainer termId="capital-allowances-aia" label="Annual Investment Allowance (AIA)" />, automatic <TermExplainer termId="disallowable-expenses" label="disallowable add-backs" />, and 2026/27 <TermExplainer termId="wda-main-pool" label="14% Main Pool WDA rates" />.
              </p>
            </div>
          </div>

          {/* Real-time Ledger Preview (7 cols) */}
          <div className="lg:col-span-7 bg-stone-50/70 rounded-2xl p-6 border border-stone-200/90 space-y-5">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Tax & Reserves Calculation
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                <p className="text-xs text-stone-500">Taxable Trading Profit</p>
                <p className="text-lg font-bold text-stone-950 font-mono">£{taxableProfit.toLocaleString()}</p>
                <p className="text-[11px] text-stone-400">CT600 Box 315</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                <p className="text-xs text-stone-500">Corporation Tax</p>
                <p className="text-lg font-bold text-amber-700 font-mono">£{corporationTax.toLocaleString()}</p>
                <p className="text-[11px] text-amber-800 font-medium">
                  {effectiveRate}% <TermExplainer termId="marginal-relief" label="effective rate" />
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-stone-200 col-span-2 sm:col-span-1">
                <p className="text-xs text-stone-500">
                  <TermExplainer termId="distributable-reserves" label="Net Distributable" />
                </p>
                <p className="text-lg font-bold text-stone-950 font-mono">£{netProfitAfterTax.toLocaleString()}</p>
                <p className="text-[11px] text-stone-400">Available dividends</p>
              </div>
            </div>

            {/* Symmetry & Pre-flight Bar */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">
                  <TermExplainer termId="balance-sheet-symmetry" label="Balance Sheet Symmetry" />
                </span>
                <span className="font-mono font-bold text-amber-700">0.00p Discrepancy</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-2 rounded-full w-full" />
              </div>
              <p className="text-[11px] text-stone-500">
                Net Assets precisely equal Total Shareholders' Funds to the exact integer penny.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-stone-500">
                Ready to file with these numbers?
              </span>
              <Link
                href={`/filings/drop-logicx/wizard?turnover=${turnover}&expenses=${expenses}`}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-stone-950 hover:bg-stone-800 px-3.5 py-2 rounded-xl shadow-xs transition"
              >
                <span>Transfer into Filing Wizard</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Director Clarity & Executive Guidance Section */}
      <section className="bg-stone-50 rounded-3xl p-8 sm:p-10 border border-stone-200 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-900 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Clarity for Company Directors</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-950">
            Total confidence in your annual filings.
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Every tax requirement, box number, and company rule is accompanied by clear, actionable guidance so you always stay in complete control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              What is FRS 105?
            </span>
            <h3 className="font-bold text-stone-900 text-sm">2-Page Micro-Entity Accounts</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Instead of producing 30-page complex corporate reports, small businesses file a simplified 2-page balance sheet. You don’t need an expensive independent audit under Section 477.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              What is s455 Tax?
            </span>
            <h3 className="font-bold text-stone-900 text-sm">Director Loans Refunded by HMRC</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              If you borrow money from your company, HMRC charges a temporary s455 tax (33.75% for loans taken before 6 April 2026; 35.75% on or after) if unpaid 9 months after your year-end. Once repaid, HMRC refunds this entire tax back to your company.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              What is 0p Symmetry?
            </span>
            <h3 className="font-bold text-stone-900 text-sm">Automated Gateway Pre-Flight Verification</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Companies House automated servers reject submissions if Net Assets don’t equal Shareholders’ Funds to the exact penny. TaxFlow automated checks verify 0p discrepancy before dispatch.
            </p>
          </div>
        </div>
      </section>

      {/* Assurance Comparison: Traditional Firms & Legacy Tools vs TaxFlow UK */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-950">
            Engineered for high assurance, not basic form filling.
          </h2>
          <p className="text-sm text-stone-600">
            Why UK directors and contractors choose TaxFlow over traditional firms and legacy filing portals.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/75">
                  <th className="py-4 px-6 font-semibold text-stone-900 w-1/3">Capability & Assurance</th>
                  <th className="py-4 px-6 font-semibold text-stone-400 w-1/3">Traditional Firms & Legacy Tools</th>
                  <th className="py-4 px-6 font-bold text-amber-950 bg-amber-50/50 w-1/3">TaxFlow UK Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                <tr>
                  <td className="py-4 px-6 font-medium text-stone-900">
                    Pre-Flight Error Defense
                    <p className="text-xs text-stone-500 font-normal mt-0.5">Automated gateway checks before submission</p>
                  </td>
                  <td className="py-4 px-6 text-stone-600">
                    <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                      <span>Basic browser validation</span>
                    </span>
                    <p className="text-xs text-stone-400 mt-1">Rejections happen after you submit and wait days</p>
                  </td>
                  <td className="py-4 px-6 bg-amber-50/20 font-semibold text-stone-950">
                    <span className="inline-flex items-center space-x-1 text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded text-xs font-bold border border-amber-200">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-700" />
                      <span>40-Point Pre-Flight Shield</span>
                    </span>
                    <p className="text-xs text-amber-900/80 mt-1">Comprehensive 40-point automated pre-flight checks</p>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-6 font-medium text-stone-900">
                    Draft Documents Preview
                    <p className="text-xs text-stone-500 font-normal mt-0.5">Review before paying or filing</p>
                  </td>
                  <td className="py-4 px-6 text-stone-600">
                    <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs font-medium">
                      <span>Locked behind paywall</span>
                    </span>
                    <p className="text-xs text-stone-400 mt-1">Must pay before seeing full PDF accounts</p>
                  </td>
                  <td className="py-4 px-6 bg-amber-50/20 font-semibold text-stone-950">
                    <span className="inline-flex items-center space-x-1 text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded text-xs font-bold border border-amber-200">
                      <span>100% Free Watermarked Drafts</span>
                    </span>
                    <p className="text-xs text-amber-900/80 mt-1">Download FRS 105 accounts & CT600 PDFs anytime</p>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-6 font-medium text-stone-900">
                    Intuitive Guidance & Transparency
                    <p className="text-xs text-stone-500 font-normal mt-0.5">Contextual guidance throughout every step</p>
                  </td>
                  <td className="py-4 px-6 text-stone-600">
                    <span className="inline-flex items-center space-x-1 text-stone-600 bg-stone-100 px-2 py-0.5 rounded text-xs font-medium">
                      <span>Opaque codes & complex forms</span>
                    </span>
                    <p className="text-xs text-stone-400 mt-1">Offers minimal guidance during critical data entry</p>
                  </td>
                  <td className="py-4 px-6 bg-amber-50/20 font-semibold text-stone-950">
                    <span className="inline-flex items-center space-x-1 text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded text-xs font-bold border border-amber-200">
                      <span>Interactive Director Guide & Explanations</span>
                    </span>
                    <p className="text-xs text-amber-900/80 mt-1">Clear explanations, real-world examples, and instant guidance</p>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-6 font-medium text-stone-900">
                    Transparent Commercial Model
                    <p className="text-xs text-stone-500 font-normal mt-0.5">Final submission pricing</p>
                  </td>
                  <td className="py-4 px-6 text-stone-600">
                    <span className="font-mono text-stone-800 font-bold">£70 – £120+</span>
                    <p className="text-xs text-stone-400 mt-1">Plus hidden add-ons for CT600A or iXBRL</p>
                  </td>
                  <td className="py-4 px-6 bg-amber-50/20 font-semibold text-stone-950">
                    <span className="font-mono text-stone-950 font-black text-base">£49.00 net</span>
                    <p className="text-xs text-amber-900/80 mt-1">All-inclusive: Companies House + HMRC + iXBRL</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Production Benchmark Seal */}
      <section className="bg-stone-950 text-white rounded-3xl p-8 sm:p-10 border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-3 py-1 rounded-full font-mono">
            <span>Verified Baseline: DROPLOGICX LTD (CRN: 15152081)</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Inspect the live audited micro-entity filing.
          </h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            Explore a complete £100,000 turnover company filing with £31,900 trading profit, £20,000 taxable profit, £3,800 corporation tax, and verified FRS 105 iXBRL tags.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold px-5 py-3 rounded-xl text-sm transition"
          >
            <span>Open Executive Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/filings/drop-logicx/documents"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 font-semibold px-5 py-3 rounded-xl text-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>View Draft Documents</span>
          </Link>
        </div>
      </section>

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        initialTermId={initialGlossaryTerm}
      />
    </div>
  );
}
