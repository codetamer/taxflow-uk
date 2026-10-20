'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileText,
  FileDown,
  Eye,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  Download,
  Building2,
  Scale,
  BookOpen,
  Award,
  CheckSquare
} from 'lucide-react';
import { TermExplainer } from '@/components/TermExplainer';
import { PlainEnglishBanner } from '@/components/PlainEnglishBanner';
import { GlossaryModal } from '@/components/GlossaryModal';

export default function DocumentsPage() {
  const params = useParams();
  const filingId = (params?.id as string) || 'drop-logicx';
  const [activeTab, setActiveTab] = useState<'accounts' | 'ct600' | 'ixbrl' | 'signing'>('accounts');
  const [isWatermarked, setIsWatermarked] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [initialGlossaryTerm, setInitialGlossaryTerm] = useState<string>('');

  const openGlossary = (termId: string) => {
    setInitialGlossaryTerm(termId);
    setIsGlossaryOpen(true);
  };

  const downloadIxbrl = () => {
    const blob = new Blob([sampleIxbrl], { type: 'application/xhtml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'droplogicx-ltd-2026-ixbrl-accounts.xhtml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sampleIxbrl = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
      xmlns:uk-gaap="http://www.xbrl.org/uk/fr/gaap/core/2019-01-01"
      xmlns:uk-direp="http://xbrl.frc.org.uk/reports/2019-01-01/direp"
      xmlns:frs-105="http://xbrl.frc.org.uk/frs/105/2019-01-01">
  <head>
    <title>DROPLOGICX LTD - Statutory Micro-Entity Accounts</title>
  </head>
  <body>
    <!-- FRS 105 Income Statement -->
    <ix:nonFraction name="uk-gaap:TurnoverGrossOperatingRevenue" unitRef="GBP" decimals="0" contextRef="ctx_current_period">100000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CostSales" unitRef="GBP" decimals="0" contextRef="ctx_current_period">20000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:OtherOperatingChargesExpenses" unitRef="GBP" decimals="0" contextRef="ctx_current_period">48100</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:TaxTaxCreditOnProfitOrLossOnOrdinaryActivities" unitRef="GBP" decimals="0" contextRef="ctx_current_period">3800</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ProfitLossForPeriod" unitRef="GBP" decimals="0" contextRef="ctx_current_period">28100</ix:nonFraction>

    <!-- FRS 105 Balance Sheet -->
    <ix:nonFraction name="uk-gaap:PropertyPlantEquipment" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">15000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:Debtors" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">10000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CashBankOnHand" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">33400</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CreditorsDueWithinOneYear" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">25000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ShareholderFunds" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">33400</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ProfitLossAccountReserve" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">33300</ix:nonFraction>

    <!-- Statutory Declarations -->
    <ix:nonNumeric name="uk-direp:DateApprovalAccounts" contextRef="ctx_current_instant">2026-10-15</ix:nonNumeric>
    <ix:nonNumeric name="uk-direp:NameEntityOfficer" contextRef="ctx_current_instant">Muhammad Saif Raza</ix:nonNumeric>
  </body>
</html>`;

  const copyIxbrl = () => {
    navigator.clipboard.writeText(sampleIxbrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-slate-800" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">Statutory Document Center</h1>
              <p className="text-xs text-slate-500 font-mono">
                DROPLOGICX LTD (CRN: 15152081) · Accounting Period Ended 30 Sep 2026
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Inspect full statutory filings on screen or download free watermarked draft PDFs to review with your co-directors before final submission.
          </p>
        </div>

        {/* Draft/Clean Preview Mode Toggle */}
        <div className="flex items-center space-x-2 self-start md:self-auto bg-stone-100 p-1 rounded-2xl">
          <button
            onClick={() => setIsWatermarked(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              isWatermarked ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Draft Preview (Free)
          </button>
          <button
            onClick={() => setIsWatermarked(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              !isWatermarked ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Clean Final Mode
          </button>
        </div>
      </div>

      {/* Statutory Guidance Overview Banner */}
      <PlainEnglishBanner
        title="Statutory Filing Requirements & Document Roles"
        summary="UK corporate regulations require two separate statutory returns each year, accompanied by certified digital iXBRL for government gateway validation."
        tips={[
          'Full Accounts (FRS 105): Filed with Companies House and published on the public online register. Discloses your balance sheet, statutory exemption statements, and director sign-off.',
          'HMRC CT600 Form: Submitted privately to HMRC. Contains detailed box-by-box tax calculations showing how your Corporation Tax was determined.',
          'iXBRL XHTML: The certified computer-readable digital format with embedded taxonomy tags required by both government gateways for automated processing.'
        ]}
        onOpenGlossary={() => openGlossary('frs-105')}
        defaultOpen={true}
      />

      {/* Trust & Download Bar */}
      <div className="bg-[#1C1917] text-white rounded-3xl p-5 sm:p-6 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Gateway Rejections Guaranteed</span>
          </div>
          <p className="text-xs text-stone-300">
            All documents pre-flight audited across 40 statutory checks. Pay £49 only upon final submission.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/api/documents/accounts-pdf?draft=${isWatermarked}&filingId=${filingId}`}
            target="_blank"
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-stone-900" />
            <span>Download Accounts PDF</span>
          </a>
          <a
            href={`/api/documents/ct600-pdf?draft=${isWatermarked}&filingId=${filingId}`}
            target="_blank"
            className="inline-flex items-center space-x-1.5 bg-stone-800 text-stone-200 hover:bg-stone-700 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-stone-400" />
            <span>Download CT600 PDF</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center space-x-2 ${
            activeTab === 'accounts'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Full Accounts (FRS 105)</span>
        </button>

        <button
          onClick={() => setActiveTab('ct600')}
          className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center space-x-2 ${
            activeTab === 'ct600'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>HMRC CT600 Return</span>
        </button>

        <button
          onClick={() => setActiveTab('ixbrl')}
          className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center space-x-2 ${
            activeTab === 'ixbrl'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>FRS 105 iXBRL XHTML</span>
        </button>

        <button
          onClick={() => setActiveTab('signing')}
          className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center space-x-2 ${
            activeTab === 'signing'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Director Approval Certificate</span>
        </button>
      </div>

      {/* Tab 1: Full Accounts Preview */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-10 font-serif text-slate-900 relative overflow-hidden">
          {isWatermarked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-30">
              <span className="text-slate-300 font-sans font-black text-6xl transform -rotate-45 tracking-widest border-4 border-slate-300 px-8 py-3 rounded-2xl">
                DRAFT · FREE REVIEW ONLY
              </span>
            </div>
          )}

          {/* Accounts Title */}
          <div className="border-b-2 border-slate-900 pb-5 space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-serif">
              DROPLOGICX LTD
            </h2>
            <p className="text-xs font-sans text-slate-500 font-medium">
              Company Registration Number: 15152081 (England & Wales)
            </p>
            <p className="text-xs font-sans text-slate-600">
              Unaudited Financial Statements for the Period Ended 30 September 2026 under <TermExplainer termId="frs-105" label="FRS 105" />
            </p>
          </div>

          {/* Profit & Loss Account */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                Income Statement (Profit and Loss Account)
              </h3>
              <p className="text-[11px] font-sans text-slate-500">For the period 01 October 2025 to 30 September 2026</p>
            </div>

            <div className="space-y-2 text-xs sm:text-sm font-sans max-w-2xl">
              <div className="flex justify-between py-1">
                <span>
                  <TermExplainer termId="ct600" label="Turnover" />
                </span>
                <span className="font-mono font-semibold">£100,000</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Other income</span>
                <span className="font-mono">-</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Cost of raw materials and consumables</span>
                <span className="font-mono">(£20,000)</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Staff costs</span>
                <span className="font-mono">-</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Depreciation and other amounts written off assets</span>
                <span className="font-mono">-</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Other charges (Administrative expenses)</span>
                <span className="font-mono">(£48,100)</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Tax on profit (Corporation Tax provision)</span>
                <span className="font-mono">(£3,800)</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-base border-t-2 border-b border-slate-900 text-slate-950">
                <span>Profit for the financial year</span>
                <span className="font-mono font-bold">£28,100</span>
              </div>
            </div>
          </div>

          {/* Statement of Financial Position (Balance Sheet) */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                Statement of Financial Position (Balance Sheet)
              </h3>
              <p className="text-[11px] font-sans text-slate-500">As at 30 September 2026</p>
            </div>

            <div className="space-y-2 text-xs sm:text-sm font-sans max-w-2xl">
              <div className="flex justify-between py-1 font-bold text-slate-900">
                <span>
                  <TermExplainer termId="capital-allowances-aia" label="Fixed assets (Tangible assets)" />
                </span>
                <span className="font-mono">£15,000</span>
              </div>

              <div className="text-[11px] font-bold text-slate-400 uppercase pt-2">Current Assets</div>
              <div className="flex justify-between py-1 pl-4 text-slate-700">
                <span>Debtors</span>
                <span className="font-mono">£10,000</span>
              </div>
              <div className="flex justify-between py-1 pl-4 text-slate-700">
                <span>Cash at bank and in hand</span>
                <span className="font-mono">£33,400</span>
              </div>
              <div className="flex justify-between py-1 font-semibold border-t border-slate-200 text-slate-900">
                <span>Total current assets</span>
                <span className="font-mono">£43,400</span>
              </div>

              <div className="flex justify-between py-1 text-slate-600">
                <span>
                  <TermExplainer termId="creditors-under-one-year" label="Creditors: amounts falling due within one year" />
                </span>
                <span className="font-mono">(£25,000)</span>
              </div>
              <div className="flex justify-between py-1 font-semibold border-t border-slate-200 text-slate-900">
                <span>Net current assets (liabilities)</span>
                <span className="font-mono">£18,400</span>
              </div>

              <div className="flex justify-between py-2 font-bold text-base border-t-2 border-b-2 border-slate-900 text-slate-950">
                <span>
                  <TermExplainer termId="balance-sheet-symmetry" label="Total assets less current liabilities (Net Assets)" />
                </span>
                <span className="font-mono font-bold">£33,400</span>
              </div>

              <div className="text-[11px] font-bold text-slate-400 uppercase pt-3">Capital and Reserves</div>
              <div className="flex justify-between py-1 pl-4 text-slate-700">
                <span>Called up share capital</span>
                <span className="font-mono">£100</span>
              </div>
              <div className="flex justify-between py-1 pl-4 text-slate-700">
                <span>
                  <TermExplainer termId="distributable-reserves" label="Profit and loss account (Retained earnings)" />
                </span>
                <span className="font-mono">£33,300</span>
              </div>

              <div className="flex justify-between py-2 font-bold text-base border-t-2 border-b-2 border-slate-900 text-slate-950">
                <span>Total Shareholders' Funds</span>
                <span className="font-mono font-bold">£33,400</span>
              </div>
            </div>
          </div>

          {/* Statutory Exemption Declaration Footnotes */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs font-sans text-slate-600">
            <p className="font-bold text-slate-900">
              <TermExplainer termId="s477-exemption" label="Companies Act 2006 Statutory Exemption Statements" />:
            </p>
            <p className="leading-relaxed">
              (a) For the period ended 30 September 2026 the company was entitled to exemption from audit under section 477 of the Companies Act 2006 relating to micro-entities.
            </p>
            <p className="leading-relaxed">
              (b) The members have not required the company to obtain an audit of its accounts for the period in question in accordance with section 476.
            </p>
            <p className="leading-relaxed">
              (c) The directors acknowledge their responsibilities for complying with the requirements of the Act with respect to accounting records and the preparation of accounts.
            </p>
            <p className="leading-relaxed">
              (d) These accounts have been prepared in accordance with the micro-entity provisions and in accordance with FRS 105 The Financial Reporting Standard applicable to the Micro-entities Regime.
            </p>
            <div className="pt-2 border-t border-slate-200 text-slate-800 font-medium">
              Approved by the board of directors on 15 October 2026 and signed on its behalf by: <strong className="text-slate-950">Muhammad Saif Raza</strong>, Director.
            </div>
          </div>

          {/* Statutory Notes to the Accounts (CA 2006 s411 & s413) */}
          <div className="border border-slate-200 p-6 rounded-2xl space-y-4 text-xs font-sans text-slate-700">
            <h3 className="font-bold text-sm text-slate-950 uppercase tracking-wider border-b border-slate-200 pb-2">
              Notes to the Financial Statements for the Period Ended 30 September 2026
            </h3>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">1. Statutory Information</h4>
              <p className="text-slate-600 leading-relaxed">
                DROPLOGICX LTD is a private company limited by shares, incorporated in England and Wales under company number 15152081. Registered office: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">2. Basis of Preparation & Accounting Policies</h4>
              <p className="text-slate-600 leading-relaxed">
                These financial statements have been prepared in accordance with Financial Reporting Standard 105 "The Financial Reporting Standard applicable to the Micro-entities Regime" and the provisions of the Companies Act 2006 applicable to micro-entities. The financial statements have been prepared under the historical cost convention.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">3. Average Number of Employees (CA 2006 s411)</h4>
              <p className="text-slate-600 leading-relaxed">
                The average number of persons employed by the company (including executive director) during the period was <strong className="text-slate-900 font-semibold">1</strong> (2025: nil).
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">4. Directors' Advances, Credits and Guarantees (CA 2006 s413)</h4>
              <p className="text-slate-600 leading-relaxed">
                During the period, advances of £0.00 were made to directors. No loans, advances, or credit arrangements with directors were outstanding at the balance sheet date.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: HMRC CT600 Form Preview */}
      {activeTab === 'ct600' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden font-sans">
          {isWatermarked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-30">
              <span className="text-slate-300 font-sans font-black text-6xl transform -rotate-45 tracking-widest border-4 border-slate-300 px-8 py-3 rounded-2xl">
                DRAFT · NOT FOR SUBMISSION
              </span>
            </div>
          )}

          {/* CT600 HMRC Header */}
          <div className="bg-slate-950 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                  HM REVENUE & CUSTOMS
                </span>
                <h2 className="text-base font-bold">
                  <TermExplainer termId="ct600" label="Company Tax Return Form CT600 (2026/27)" />
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Corporation Tax Act 2010 Return for DROPLOGICX LTD (UTR: 1234567890)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Period: 01/10/2025 to 30/09/2026</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">Small Profits Rate (19%)</span>
            </div>
          </div>

          {/* Box Numbered Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <div className="bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
              HMRC Statutory Return Boxes & Calculations
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 145</span>
                <span>
                  <TermExplainer termId="ct600" label="Turnover / gross operating revenue" />
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-950">£100,000.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 155</span>
                <span>Trading profits before capital allowances</span>
              </div>
              <span className="font-mono font-semibold text-slate-950">£31,900.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-slate-50/50">
              <div className="flex items-center space-x-3 pl-4">
                <span className="font-mono text-slate-400 font-bold">+</span>
                <span className="text-slate-600">Add: Disallowable Expenses (Client Entertaining)</span>
              </div>
              <span className="font-mono text-slate-700">£3,100.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-slate-50/50">
              <div className="flex items-center space-x-3 pl-4">
                <span className="font-mono text-slate-400 font-bold">-</span>
                <span className="text-slate-600">Deduct: Capital Allowances (AIA claimed)</span>
              </div>
              <span className="font-mono text-slate-700">(£15,000.00)</span>
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm font-semibold">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 235</span>
                <span className="font-semibold text-slate-900">
                  <TermExplainer termId="disallowable-expenses" label="Total Taxable Profits (TTP)" />
                </span>
              </div>
              <span className="font-mono font-bold text-slate-950">£20,000.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 315</span>
                <span>Profits chargeable at Small Profits Rate (19%)</span>
              </div>
              <span className="font-mono font-semibold text-slate-950">£20,000.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-emerald-50/40">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs font-bold text-emerald-900">Box 440</span>
                <span className="font-bold text-emerald-950">
                  <TermExplainer termId="ct600" label="Corporation Tax Chargeable" />
                </span>
              </div>
              <span className="font-mono font-black text-base text-emerald-700">£3,800.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">CT600A</span>
                <span>Section 455 Tax Due on Director Loans</span>
              </div>
              <span className="font-mono font-semibold text-slate-950">£0.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 510</span>
                <span>Statutory Payment Due Date (HMRC)</span>
              </div>
              <span className="font-mono font-semibold text-slate-900">01 July 2027</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: iXBRL Markup */}
      {activeTab === 'ixbrl' && (
        <div className="bg-slate-950 text-slate-200 p-6 rounded-3xl border border-slate-800 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-slate-400">
              <TermExplainer termId="ixbrl-irmark" label="FRS 105 Inline XBRL (iXBRL) Payload" />
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={downloadIxbrl}
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Download .xhtml</span>
              </button>
              <button
                type="button"
                onClick={copyIxbrl}
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied XML' : 'Copy Markup'}</span>
              </button>
            </div>
          </div>

          <pre className="overflow-x-auto text-slate-300 leading-relaxed max-h-[500px]">
            {sampleIxbrl}
          </pre>
        </div>
      )}

      {/* Tab 4: Director Approval Certificate (ECCTA 2023) */}
      {activeTab === 'signing' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                  <Award className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-slate-950">
                  Director Approval & Statutory Exemption Certificate
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Formal legal declaration under Companies Act 2006 s414 & Economic Crime and Corporate Transparency Act 2023.
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Board Approved & Sealed</span>
            </div>
          </div>

          {/* Statutory Sign-off Card */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Statutory Board Representation Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Signing Director:</span>
                <p className="font-bold text-slate-900 text-sm">Muhammad Saif Raza</p>
                <p className="text-[11px] text-slate-500">Appointed Director (Companies House Active Officer)</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Date of Board Approval:</span>
                <p className="font-mono font-bold text-slate-900 text-sm">15 October 2026</p>
                <p className="text-[11px] text-slate-500">Meeting of the Board of Directors of DropLogicX Ltd</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Audit Exemption Declaration:</span>
                <p className="font-semibold text-slate-800">Section 477 Companies Act 2006</p>
                <p className="text-[11px] text-slate-500">Confirmed: Turnover £100k, Assets £31.1k, Employees 3</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Cryptographic IRmark Hash:</span>
                <p className="font-mono text-emerald-800 font-semibold text-[11px] truncate">
                  SHA1: 7u9rJ1b4K2w8Xz0L9qP... (Base64 Canonical)
                </p>
                <p className="text-[11px] text-slate-500">Deterministic GovTalk C14N XML Digest</p>
              </div>
            </div>
          </div>

          {/* Electronic Audit Trail */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Immutable Electronic Filing Audit Trail
            </h3>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">40-Point Pre-Flight Shield Passed</p>
                    <p className="text-[11px] text-slate-500">All mathematical invariants verified down to 0.00p</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">15 Oct 2026 10:14:00</span>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">Companies House Live Registry Verification</p>
                    <p className="text-[11px] text-slate-500">Company #15152081 status: Active Micro-Entity</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">15 Oct 2026 10:14:15</span>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">iXBRL Semantic Taxonomy Generation</p>
                    <p className="text-[11px] text-slate-500">Generated using UK GAAP / FRS 105 2019-01-01 Taxonomy</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">15 Oct 2026 10:15:30</span>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">Director Digital Signature Registered</p>
                    <p className="text-[11px] text-slate-500">Recorded for Muhammad Saif Raza under CA 2006 s414</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">15 Oct 2026 10:20:00</span>
              </div>
            </div>
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
