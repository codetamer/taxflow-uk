import Link from 'next/link';
import {
  Building2,
  Calendar,
  ShieldCheck,
  FileDown,
  ArrowRight,
  TrendingUp,
  CreditCard,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  const company = {
    name: 'DROPLOGICX LTD',
    crn: '15152081',
    utr: '1234567890',
    director: 'Muhammad Saif Raza',
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
    <div className="space-y-8">
      {/* Company Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{company.name}</h1>
              <p className="text-xs text-slate-500 font-mono">
                CRN: <span className="font-semibold text-slate-700">{company.crn}</span> | UTR: <span className="font-semibold text-slate-700">{company.utr}</span> | Director: <span className="font-semibold text-slate-700">{company.director}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-1 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Accounting Period: <strong>{company.periodStart}</strong> to <strong>{company.periodEnd}</strong> (365 days)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/filings/drop-logicx/wizard"
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition"
          >
            <span>Open Filing Wizard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/filings/drop-logicx/documents"
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Draft Documents</span>
          </Link>
        </div>
      </div>

      {/* Statutory Filing Deadlines */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <span>Statutory Deadlines & Status</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Companies House Accounts</p>
              <p className="text-lg font-bold text-slate-900">{company.accountsDueDate}</p>
              <p className="text-xs text-slate-400">9 months from period end</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
              On Track
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">HMRC Corporation Tax Payment</p>
              <p className="text-lg font-bold text-slate-900">{company.taxDueDate}</p>
              <p className="text-xs text-slate-400">9 months and 1 day</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
              On Track
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">HMRC CT600 Return Filing</p>
              <p className="text-lg font-bold text-slate-900">{company.ct600DueDate}</p>
              <p className="text-xs text-slate-400">12 months from period end</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
              On Track
            </span>
          </div>
        </div>
      </div>

      {/* Financial Core Numbers */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Accounting & Tax Baseline (DropLogicX Benchmark)</span>
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-xs font-medium text-slate-500">Gross Turnover</p>
            <p className="text-2xl font-black text-slate-900">{company.turnover}</p>
            <p className="text-xs text-emerald-600 font-medium">100% Trading Revenue</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-xs font-medium text-slate-500">Total Taxable Profits</p>
            <p className="text-2xl font-black text-slate-900">{company.operatingProfit}</p>
            <p className="text-xs text-slate-500">After disallowables & AIA</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-xs font-medium text-slate-500">Corporation Tax (19%)</p>
            <p className="text-2xl font-black text-sky-600">{company.taxPayable}</p>
            <p className="text-xs text-slate-500">Small Profits Rate (A ≤ £50k)</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-xs font-medium text-slate-500">Distributable Reserves</p>
            <p className="text-2xl font-black text-indigo-600">{company.retainedEarnings}</p>
            <p className="text-xs text-slate-500">Available for dividends</p>
          </div>
        </div>
      </div>

      {/* 40-Point Pre-Flight Shield Status Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold">40-Point Pre-Flight Rejection Shield</h3>
            <span className="bg-emerald-400/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-400/20">
              PASSED 40/40
            </span>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl">
            Mathematical balancing, Companies Act 2006 declarations, dated director loans, and HMRC iXBRL tags are 100% verified. Zero gateway errors detected.
          </p>
        </div>

        <Link
          href="/filings/drop-logicx/shield"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition whitespace-nowrap"
        >
          View Full 40 Rules Audit
        </Link>
      </div>

      {/* Free Draft Downloads & Document Center Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Statutory Full Accounts (FRS 105)</h3>
              <p className="text-xs text-slate-500">Multi-page PDF with Balance Sheet, P&L, Notes & s477 declarations</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Download your free watermarked draft PDF copy before submitting. Review all figures with your co-directors or accountant.
          </p>
          <div className="pt-2 flex items-center space-x-3">
            <a
              href="/api/documents/accounts-pdf?draft=true"
              target="_blank"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-lg transition"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Draft Accounts PDF</span>
            </a>
            <a
              href="/api/documents/ixbrl?draft=true"
              target="_blank"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-800 px-2 py-2 transition"
            >
              <span>View iXBRL Code</span>
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">HMRC CT600 Form & CT600A</h3>
              <p className="text-xs text-slate-500">Official HMRC box-numbered layout with s455 loan schedule</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Recreates the official HMRC return: Box 145 (Turnover), Box 235 (Profits), Box 440 (Tax @ 19%), and CT600A loan schedule.
          </p>
          <div className="pt-2 flex items-center space-x-3">
            <a
              href="/api/documents/ct600-pdf?draft=true"
              target="_blank"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Draft CT600 PDF</span>
            </a>
            <Link
              href="/filings/drop-logicx/documents"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-800 px-2 py-2 transition"
            >
              <span>Document Center</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

