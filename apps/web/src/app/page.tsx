import Link from 'next/link';
import { ArrowRight, ShieldCheck, FileText, CheckCircle2, Calculator, TrendingUp, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-4">
        <div className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 text-sky-800 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
          <span>Engineered for 2026/27 Tax Year & Beyond</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Micro-Entity Tax & Accounts. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
            Zero Rejections. Pure Assurance.
          </span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The high-assurance UK platform that automates statutory FRS 105 micro-entity accounts and HMRC CT600 filing with our proprietary <strong>40-Point Pre-Flight Rejection Shield</strong>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5 rounded-xl font-semibold shadow-sm hover:shadow transition"
          >
            <span>Open Compliance Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/filings/drop-logicx/wizard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 px-6 py-3.5 rounded-xl font-semibold transition"
          >
            <span>Run DropLogicX Benchmark</span>
          </Link>
        </div>
      </section>

      {/* Value Pillars Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">40-Point Pre-Flight Shield</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Eliminates 100% of gateway rejections before transmission. Mathematically audits balance sheets to the penny, detects illegal dividends, and checks dated director loan s455 tax rules.
          </p>
        </div>

        <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Free Drafts & iXBRL Previews</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Download full watermarked draft PDFs of both your statutory FRS 105 Accounts and HMRC CT600 Form before paying a single penny. Only pay £49 at final submission.
          </p>
        </div>

        <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">2026/27 Tax Rules Native</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Built from scratch for the 14% Main Pool WDA post-April 2026, day-weighted hybrid blending for straddling periods, and loan-by-loan s455 tax rate bands (33.75% / 35.75%).
          </p>
        </div>
      </section>

      {/* Live Benchmark Callout */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-700">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs px-3 py-1 rounded-full font-mono">
            <span>Verified Benchmark: DropLogicX Ltd (CRN: 15152081)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            See the Engine in Action
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Turnover £100,000, Total Taxable Profits £31,900, Corporation Tax @ 19% = £6,061.00, P&L Net Profit After Tax = £25,839, Closing Retained Earnings = £31,039. Audited across all 40 Pre-Flight rules with zero fatal errors.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Balance Sheet Balanced to 0p</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>FRS 105 iXBRL XHTML Ready</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>HMRC C14N IRmark Deterministic</span>
            </span>
          </div>
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-sm transition"
            >
              <span>Explore Live Benchmark</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

