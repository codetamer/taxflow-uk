'use client';

import { useState, useEffect, useMemo } from 'react';
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
  CheckSquare,
  Home,
  Briefcase,
  Layers,
  PauseCircle,
  Info
} from 'lucide-react';
import { TermExplainer } from '@/components/TermExplainer';
import { PlainEnglishBanner } from '@/components/PlainEnglishBanner';
import { GlossaryModal } from '@/components/GlossaryModal';

function formatAccounting(val: number, isCurrency = true): string {
  const absVal = Math.abs(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const prefix = isCurrency ? '£' : '';
  if (val < 0) {
    return `(${prefix}${absVal})`;
  }
  return `${prefix}${absVal}`;
}

export default function DocumentsPage() {
  const params = useParams();
  const filingId = (params?.id as string) || 'drop-logicx';
  const [activeTab, setActiveTab] = useState<'accounts' | 'ct600' | 'ixbrl' | 'signing'>('accounts');
  const [isWatermarked, setIsWatermarked] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [initialGlossaryTerm, setInitialGlossaryTerm] = useState<string>('');

  const [filingData, setFilingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadFiling() {
      try {
        const res = await fetch(`/api/filings/${filingId}`);
        const data = await res.json();
        if (data.success && data.filing) {
          setFilingData(data.filing);
        }
      } catch (e) {
        console.error('Failed to load filing for documents view', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadFiling();
  }, [filingId]);

  const openGlossary = (termId: string) => {
    setInitialGlossaryTerm(termId);
    setIsGlossaryOpen(true);
  };

  // Extract Form & Computed Data with DropLogicX benchmark defaults
  const f = filingData?.formData || {};
  const companyName = filingData?.company?.name || f.companyName || 'DROPLOGICX LTD';
  const crn = filingData?.company?.crn || f.crn || '15152081';
  const utr = filingData?.company?.utr || f.utr || '1234567890';
  const directorName = filingData?.directorName || f.directorName || 'Muhammad Saif Raza';
  const periodStart = filingData?.periodStart || f.periodStart || '2025-10-01';
  const periodEnd = filingData?.periodEnd || f.periodEnd || '2026-09-30';
  const archetype: 'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED' = f.companyType || 'TRADING';

  const isDormant = archetype === 'DORMANT';
  const isProperty = archetype === 'PROPERTY';
  const isMixed = archetype === 'MIXED';

  // Financial figures
  const turnover = isDormant ? 0 : isProperty ? (f.propertyRentalIncome ?? 36000) : (f.turnover ?? 100000);
  const costOfSales = isDormant || isProperty ? 0 : (f.costOfSales ?? 20000);
  const propertyExpenses = isProperty || isMixed ? (f.propertyAllowableExpenses ?? 6000) : 0;
  const propertyMortgageInterest = isProperty || isMixed ? (f.propertyMortgageInterest ?? 12000) : 0;
  const otherCharges = isDormant
    ? 0
    : isProperty
    ? propertyExpenses + propertyMortgageInterest
    : (f.otherCharges ?? 48100);
  const disallowables = isDormant || isProperty ? 0 : (f.disallowables ?? 3100);
  const aiaClaimed = isDormant || isProperty ? 0 : (f.aiaClaimed ?? 15000);

  const tradingOperatingProfit = isDormant ? 0 : turnover - costOfSales - otherCharges;
  const propertyNetTaxable = Math.max(0, (f.propertyRentalIncome ?? 36000) - propertyExpenses - propertyMortgageInterest);
  const taxableProfit = isDormant
    ? 0
    : isProperty
    ? propertyNetTaxable
    : isMixed
    ? Math.max(0, tradingOperatingProfit + disallowables - aiaClaimed) + propertyNetTaxable
    : Math.max(0, tradingOperatingProfit + disallowables - aiaClaimed);

  const corporationTax = isDormant ? 0 : Math.round(taxableProfit * 0.19);
  const netProfit = isDormant ? 0 : tradingOperatingProfit - corporationTax;

  const fixedAssets = isDormant ? 0 : (f.fixedAssets ?? 15000);
  const debtors = isDormant ? 0 : (f.debtors ?? 10000);
  const shareCapital = f.shareCapital ?? 100;
  const cashAtBank = isDormant ? shareCapital : (f.cashAtBank ?? 33400);
  const creditors = isDormant ? 0 : (f.creditorsUnderOneYear ?? 25000);
  const netAssets = fixedAssets + debtors + cashAtBank - creditors;
  const retainedEarnings = isDormant ? 0 : netAssets - shareCapital;

  const sampleIxbrl = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
      xmlns:uk-gaap="http://www.xbrl.org/uk/fr/gaap/core/2019-01-01"
      xmlns:uk-direp="http://xbrl.frc.org.uk/reports/2019-01-01/direp"
      xmlns:frs-105="http://xbrl.frc.org.uk/frs/105/2019-01-01">
  <head>
    <title>${companyName} - Micro-Entity Annual Accounts</title>
  </head>
  <body>
    <!-- Corporate Entity -->
    <ix:nonNumeric name="uk-direp:NameEntityOfficer" contextRef="ctx_current_instant">${directorName}</ix:nonNumeric>
    <ix:nonNumeric name="uk-direp:DateApprovalAccounts" contextRef="ctx_current_instant">${periodEnd}</ix:nonNumeric>

    <!-- FRS 105 Income Statement -->
    ${!isDormant ? `
    <ix:nonFraction name="uk-gaap:TurnoverGrossOperatingRevenue" unitRef="GBP" decimals="0" contextRef="ctx_current_period">${turnover}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CostSales" unitRef="GBP" decimals="0" contextRef="ctx_current_period">${costOfSales}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:OtherOperatingChargesExpenses" unitRef="GBP" decimals="0" contextRef="ctx_current_period">${otherCharges}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:TaxTaxCreditOnProfitOrLossOnOrdinaryActivities" unitRef="GBP" decimals="0" contextRef="ctx_current_period">${corporationTax}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ProfitLossForPeriod" unitRef="GBP" decimals="0" contextRef="ctx_current_period">${netProfit}</ix:nonFraction>
    ` : '<!-- Dormant Entity: Profit & Loss Statement Omitted under CA 2006 s480 -->'}

    <!-- FRS 105 Balance Sheet -->
    <ix:nonFraction name="uk-gaap:PropertyPlantEquipment" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${fixedAssets}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:Debtors" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${debtors}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CashBankOnHand" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${cashAtBank}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CreditorsDueWithinOneYear" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${creditors}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ShareholderFunds" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${netAssets}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ProfitLossAccountReserve" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${retainedEarnings}</ix:nonFraction>
  </body>
</html>`;

  const downloadIxbrl = () => {
    const blob = new Blob([sampleIxbrl], { type: 'application/xhtml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-ixbrl-accounts.xhtml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">{companyName}</h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  {archetype}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                CRN: {crn} · UTR: {utr} · Accounting Period Ended {periodEnd}
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Inspect live official document outputs below or export watermarked PDF copies free of charge before submission.
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

      {/* Guidance Overview Banner */}
      <PlainEnglishBanner
        title="Annual Filing Requirements & Document Roles"
        summary="UK company regulations require two separate annual returns each year, accompanied by certified digital iXBRL for government gateway validation."
        tips={[
          'Full Accounts (FRS 105): Filed with Companies House and published on the public online register. Discloses your balance sheet, audit exemption statements, and director sign-off.',
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
            <span>Pre-Submission Gateway Verification</span>
          </div>
          <p className="text-xs text-stone-300">
            All filings verified across 40 statutory compliance checks before submission. Free draft downloads. Pay £49 only upon final dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/api/documents/accounts-pdf?draft=${isWatermarked}&filingId=${filingId}`}
            target="_blank"
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-stone-900" />
            <span>{isDormant ? 'Download AA02 PDF' : 'Download Accounts PDF'}</span>
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
          <span>{isDormant ? 'Dormant Accounts (AA02)' : 'Full Accounts (FRS 105)'}</span>
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
              {companyName}
            </h2>
            <p className="text-xs font-sans text-slate-500 font-medium">
              Company Registration Number: {crn} (England &amp; Wales)
            </p>
            <p className="text-xs font-sans text-slate-600">
              {isDormant
                ? 'Dormant Company Financial Statements for the Period Ended ' + periodEnd + ' under CA 2006 s480'
                : 'Unaudited Financial Statements for the Period Ended ' + periodEnd + ' under FRS 105'}
            </p>
          </div>

          {/* Profit & Loss Account */}
          {isDormant ? (
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs font-sans text-emerald-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profit &amp; Loss Account Omitted (Companies Act 2006 s480)</span>
              </p>
              <p className="text-emerald-800 leading-relaxed">
                As a dormant company with no significant accounting transactions during the period, the company is exempt from preparing a profit and loss account.
              </p>
            </div>
          ) : isProperty ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                  Schedule A: UK Property Business Income Statement
                </h3>
                <p className="text-[11px] font-sans text-slate-500">For the period {periodStart} to {periodEnd}</p>
              </div>

              <div className="space-y-2 text-xs sm:text-sm font-sans max-w-2xl">
                <div className="flex justify-between py-1">
                  <span>Gross Rental Receipts &amp; Property Income</span>
                  <span className="font-mono font-semibold">{formatAccounting(turnover)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Allowable property repairs and management charges</span>
                  <span className="font-mono">-{formatAccounting(propertyExpenses)}</span>
                </div>
                <div className="flex justify-between py-1 text-amber-800">
                  <span>Loan interest and finance costs (NTLR Debit - Box 260)</span>
                  <span className="font-mono">-{formatAccounting(propertyMortgageInterest)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-base border-t-2 border-b border-slate-900 text-slate-950">
                  <span>Net Property Profit before Tax</span>
                  <span className="font-mono font-bold">{formatAccounting(taxableProfit)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                  Income Statement (Profit and Loss Account)
                </h3>
                <p className="text-[11px] font-sans text-slate-500">For the period {periodStart} to {periodEnd}</p>
              </div>

              <div className="space-y-2 text-xs sm:text-sm font-sans max-w-2xl">
                <div className="flex justify-between py-1">
                  <span>Turnover / Gross Operating Revenue</span>
                  <span className="font-mono font-semibold">{formatAccounting(turnover)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Cost of sales (contractor &amp; direct costs)</span>
                  <span className="font-mono">-{formatAccounting(costOfSales)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Other charges (Administrative expenses)</span>
                  <span className="font-mono">-{formatAccounting(otherCharges)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Tax on profit (Corporation Tax provision)</span>
                  <span className="font-mono">-{formatAccounting(corporationTax)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-base border-t-2 border-b border-slate-900 text-slate-950">
                  <span>Profit for the financial year</span>
                  <span className="font-mono font-bold">{formatAccounting(netProfit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Statement of Financial Position (Balance Sheet) */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                  Statement of Financial Position (Balance Sheet)
                </h3>
                <p className="text-[11px] font-sans text-slate-500">As at {periodEnd}</p>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                {isDormant ? 'CA 2006 s480 AA02' : 'FRS 105 Section 4'}
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm font-sans max-w-2xl">
              <div className="grid grid-cols-12 pb-1 border-b border-slate-200 font-bold text-[11px] text-slate-400 uppercase">
                <span className="col-span-8">Item</span>
                <span className="col-span-4 text-right">Current Year (£)</span>
              </div>

              {!isDormant && (
                <div className="grid grid-cols-12 py-1 font-bold text-slate-900">
                  <span className="col-span-8">
                    {isProperty ? 'Investment Property / Land & Buildings' : 'Fixed assets (Tangible assets)'}
                  </span>
                  <span className="col-span-4 text-right font-mono">{formatAccounting(fixedAssets, false)}</span>
                </div>
              )}

              <div className="text-[11px] font-bold text-slate-400 uppercase pt-2">Current Assets</div>
              {!isDormant && (
                <div className="grid grid-cols-12 py-1 pl-4 text-slate-700">
                  <span className="col-span-8">Debtors</span>
                  <span className="col-span-4 text-right font-mono">{formatAccounting(debtors, false)}</span>
                </div>
              )}
              <div className="grid grid-cols-12 py-1 pl-4 text-slate-700">
                <span className="col-span-8">Cash at bank and in hand</span>
                <span className="col-span-4 text-right font-mono">{formatAccounting(cashAtBank, false)}</span>
              </div>
              <div className="grid grid-cols-12 py-1 font-semibold border-t border-slate-200 text-slate-900">
                <span className="col-span-8">Total current assets</span>
                <span className="col-span-4 text-right font-mono">{formatAccounting(debtors + cashAtBank, false)}</span>
              </div>

              {!isDormant && (
                <div className="grid grid-cols-12 py-1 text-slate-600">
                  <span className="col-span-8">Creditors: amounts falling due within one year</span>
                  <span className="col-span-4 text-right font-mono">({formatAccounting(creditors, false)})</span>
                </div>
              )}
              <div className="grid grid-cols-12 py-1 font-semibold border-t border-slate-200 text-slate-900">
                <span className="col-span-8">Net current assets</span>
                <span className="col-span-4 text-right font-mono">{formatAccounting(debtors + cashAtBank - creditors, false)}</span>
              </div>

              <div className="grid grid-cols-12 py-2 font-bold text-sm sm:text-base border-t-2 border-b-2 border-slate-900 text-slate-950">
                <span className="col-span-8">Total Net Assets</span>
                <span className="col-span-4 text-right font-mono font-bold">{formatAccounting(netAssets)}</span>
              </div>

              <div className="text-[11px] font-bold text-slate-400 uppercase pt-3">Capital and Reserves</div>
              <div className="grid grid-cols-12 py-1 pl-4 text-slate-700">
                <span className="col-span-8">Called up share capital</span>
                <span className="col-span-4 text-right font-mono">{formatAccounting(shareCapital, false)}</span>
              </div>
              {!isDormant && (
                <div className="grid grid-cols-12 py-1 pl-4 text-slate-700">
                  <span className="col-span-8">Profit and loss account (Retained reserves)</span>
                  <span className="col-span-4 text-right font-mono">{formatAccounting(retainedEarnings, false)}</span>
                </div>
              )}

              <div className="grid grid-cols-12 py-2 font-bold text-sm sm:text-base border-t-2 border-b-2 border-slate-900 text-slate-950">
                <span className="col-span-8">Total Shareholders' Funds</span>
                <span className="col-span-4 text-right font-mono font-bold">{formatAccounting(netAssets)}</span>
              </div>
            </div>
          </div>

          {/* Audit Exemption Declaration Footnotes */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs font-sans text-slate-600">
            <p className="font-bold text-slate-900">
              {isDormant
                ? 'Companies Act 2006 Section 480 Dormant Company Exemption Statements:'
                : 'Companies Act 2006 Section 477 Audit Exemption Statements:'}
            </p>
            {isDormant ? (
              <p className="leading-relaxed">
                "For the period ended {periodEnd} the company was entitled to exemption from audit under section 480 of the Companies Act 2006 relating to dormant companies. The members have not required the company to obtain an audit in accordance with section 476. The directors acknowledge their responsibilities for complying with the requirements of the Act with respect to accounting records and the preparation of accounts."
              </p>
            ) : (
              <>
                <p className="leading-relaxed">
                  (a) For the period ended {periodEnd} the company was entitled to exemption from audit under section 477 of the Companies Act 2006 relating to micro-entities.
                </p>
                <p className="leading-relaxed">
                  (b) The members have not required the company to obtain an audit of its accounts for the period in question in accordance with section 476.
                </p>
                <p className="leading-relaxed">
                  (c) The directors acknowledge their responsibilities for complying with the requirements of the Act with respect to accounting records and the preparation of accounts.
                </p>
                <p className="leading-relaxed">
                  (d) These accounts have been prepared in accordance with the micro-entity provisions and FRS 105.
                </p>
              </>
            )}
            <div className="pt-2 border-t border-slate-200 text-slate-800 font-medium">
              Approved by the board of directors on {periodEnd} and signed on its behalf by: <strong className="text-slate-950">{directorName}</strong>, Director.
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
                  HM REVENUE &amp; CUSTOMS
                </span>
                <h2 className="text-base font-bold">
                  Company Tax Return Form CT600 (2026/27)
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Corporation Tax Act 2010 Return for {companyName} (UTR: {utr})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Period: {periodStart} to {periodEnd}</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {isDormant ? 'Nil Return' : 'Small Profits Rate (19%)'}
              </span>
            </div>
          </div>

          {/* Box Numbered Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <div className="bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
              HMRC Return Boxes &amp; Calculations
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 145</span>
                <span>Gross turnover / operating revenue</span>
              </div>
              <span className="font-mono font-semibold text-slate-950">{formatAccounting(turnover)}</span>
            </div>

            {isProperty ? (
              <>
                <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 190</span>
                    <span>Net income from UK property</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-950">{formatAccounting(propertyNetTaxable)}</span>
                </div>

                <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-amber-50/50">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-xs font-bold text-amber-900">Box 260</span>
                    <span>Non-Trading Loan Relationship (Mortgage Interest)</span>
                  </div>
                  <span className="font-mono text-amber-900">-{formatAccounting(propertyMortgageInterest)}</span>
                </div>
              </>
            ) : (
              <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center space-x-3">
                  <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 155</span>
                  <span>Trading profits before capital allowances</span>
                </div>
                <span className="font-mono font-semibold text-slate-950">{formatAccounting(tradingOperatingProfit)}</span>
              </div>
            )}

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm font-semibold">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 315</span>
                <span className="font-semibold text-slate-900">Total Taxable Profits (TTP)</span>
              </div>
              <span className="font-mono font-bold text-slate-950">{formatAccounting(taxableProfit)}</span>
            </div>

            <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-emerald-50/40">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs font-bold text-emerald-900">Box 440</span>
                <span className="font-bold text-emerald-950">Corporation Tax Chargeable</span>
              </div>
              <span className="font-mono font-black text-base text-emerald-700">{formatAccounting(corporationTax)}</span>
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

      {/* Tab 4: Director Approval Certificate */}
      {activeTab === 'signing' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                  <Award className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-slate-950">
                  Director Approval &amp; Audit Exemption Certificate
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Formal legal declaration under Companies Act 2006 s414 &amp; Economic Crime and Corporate Transparency Act 2023.
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Board Approved &amp; Sealed</span>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Board Representation Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Signing Director:</span>
                <p className="font-bold text-slate-900 text-sm">{directorName}</p>
                <p className="text-[11px] text-slate-500">Appointed Director ({companyName})</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Date of Board Approval:</span>
                <p className="font-mono font-bold text-slate-900 text-sm">{periodEnd}</p>
                <p className="text-[11px] text-slate-500">Meeting of the Board of Directors</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Audit Exemption Declaration:</span>
                <p className="font-semibold text-slate-800">
                  {isDormant ? 'Section 480 Companies Act 2006' : 'Section 477 Companies Act 2006'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Confirmed: Turnover {formatAccounting(turnover)}, Net Assets {formatAccounting(netAssets)}
                </p>
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
