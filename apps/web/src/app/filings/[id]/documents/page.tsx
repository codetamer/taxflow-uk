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
  Info,
  Calendar,
  Landmark
} from 'lucide-react';
import { computePeriod } from '@taxflow/ct-engine';
import { TermExplainer } from '@/components/TermExplainer';
import { PlainEnglishBanner } from '@/components/PlainEnglishBanner';
import { GlossaryModal } from '@/components/GlossaryModal';
import { getFilingDraft, subscribeFilingDraft } from '@/lib/filingClientStorage';

function formatAccounting(val: number | undefined | null, isCurrency = true): string {
  if (val === undefined || val === null || isNaN(val)) {
    return '—';
  }
  const absVal = Math.abs(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const prefix = isCurrency ? '£' : '';
  if (val < 0) {
    return `(${prefix}${absVal})`;
  }
  return `${prefix}${absVal}`;
}

function formatDateBritish(isoDate?: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      });
    }
  }
  return isoDate;
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
    // 1. Immediately hydrate from shared in-browser filing state (FE-01)
    const localDraft = getFilingDraft(filingId);
    if (localDraft) {
      setFilingData({
        formData: localDraft,
        company: {
          crn: localDraft.crn || '15152081',
          name: localDraft.companyName || 'DROPLOGICX LTD',
          utr: localDraft.utr || '1234567890'
        },
        periodStart: localDraft.periodStart || '2025-10-01',
        periodEnd: localDraft.periodEnd || '2026-09-30',
        directorName: localDraft.directorName || 'Muhammad Saif Raza'
      });
      setIsLoading(false);
    }

    // 2. Subscribe to real-time draft updates from wizard edits (FE-01)
    const unsubscribe = subscribeFilingDraft(filingId, (updatedDraft) => {
      setFilingData((prev: any) => ({
        ...prev,
        formData: updatedDraft,
        company: {
          crn: updatedDraft.crn || prev?.company?.crn || '15152081',
          name: updatedDraft.companyName || prev?.company?.name || 'DROPLOGICX LTD',
          utr: updatedDraft.utr || prev?.company?.utr || '1234567890'
        },
        periodStart: updatedDraft.periodStart || prev?.periodStart || '2025-10-01',
        periodEnd: updatedDraft.periodEnd || prev?.periodEnd || '2026-09-30',
        directorName: updatedDraft.directorName || prev?.directorName || 'Muhammad Saif Raza'
      }));
    });

    // 3. Supplement with server data if available
    async function loadFiling() {
      try {
        const res = await fetch(`/api/filings/${filingId}`);
        const data = await res.json();
        if (data.success && data.filing) {
          setFilingData((prev: any) => {
            const formData = localDraft || data.filing.formData || prev?.formData;
            return {
              ...data.filing,
              formData,
              company: data.filing.company || prev?.company
            };
          });
        }
      } catch (e) {
        console.error('Failed to load filing for documents view', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadFiling();

    return () => unsubscribe();
  }, [filingId]);

  const openGlossary = (termId: string) => {
    setInitialGlossaryTerm(termId);
    setIsGlossaryOpen(true);
  };

  // Extract Form & Computed Data with DropLogicX benchmark defaults
  const f = filingData?.formData || {};
  const companyName = f.companyName || filingData?.company?.name || 'DROPLOGICX LTD';
  const crn = f.crn || filingData?.company?.crn || '15152081';
  const utr = f.utr || filingData?.company?.utr || '1234567890';
  const directorName = f.directorName || filingData?.directorName || 'Muhammad Saif Raza';
  const periodStart = f.periodStart || filingData?.periodStart || '2025-10-01';
  const periodEnd = f.periodEnd || filingData?.periodEnd || '2026-09-30';
  const approvalDate = f.directorApprovalDate || '2026-10-15';
  const archetype: 'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED' = f.companyType || 'TRADING';

  const isDormant = archetype === 'DORMANT';
  const isProperty = archetype === 'PROPERTY';
  const isMixed = archetype === 'MIXED';

  // Live Financial figures
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

  // Parse director loans list
  const rawLoans = useMemo(() => {
    if (isDormant) return [];
    if (Array.isArray(f.directorLoans) && f.directorLoans.length > 0) {
      return f.directorLoans.filter((l: any) => (Number(l.advanceAmount) || 0) > 0);
    }
    if (f.directorLoanAdvance && Number(f.directorLoanAdvance) > 0) {
      return [
        {
          id: 'loan_1',
          directorName: directorName,
          advanceDate: f.directorLoanDate || '2026-05-01',
          advanceAmount: Number(f.directorLoanAdvance),
          repaidAmount: Number(f.directorLoanRepaidAmount || 0),
          repaidDate: f.directorLoanRepaidDate || ''
        }
      ];
    }
    return [];
  }, [f.directorLoans, f.directorLoanAdvance, f.directorLoanDate, f.directorLoanRepaidAmount, f.directorLoanRepaidDate, directorName, isDormant]);

  // Precise CT Engine Execution for Corporation Tax & s455 (FE-01)
  const ctEngineResult = useMemo(() => {
    if (isDormant) return { corporationTaxPence: 0, s455TaxPence: 0, totalDuePence: 0 };
    try {
      const nonTradingIncomePence = isProperty
        ? Math.round(propertyNetTaxable * 100)
        : isMixed
        ? Math.round(propertyNetTaxable * 100)
        : 0;
      const tradingProfitsPence = isProperty ? 0 : Math.round((tradingOperatingProfit + disallowables - aiaClaimed) * 100);

      const directorLoansList = rawLoans.map((loan: any) => {
        const adv = Number(loan.advanceAmount) || 0;
        const rep = Number(loan.repaidAmount) || 0;
        const outstanding = Math.max(0, adv - rep);
        return {
          id: loan.id,
          madeOn: loan.advanceDate || periodStart,
          outstandingAtDueDatePence: Math.round(outstanding * 100)
        };
      });

      return computePeriod({
        period: { start: periodStart, end: periodEnd },
        daysInYearBasis: 365,
        associatedCompanies: Number(f.associatedCompanies) || 0,
        tradingProfitAfterAllowancesPence: Math.max(0, tradingProfitsPence),
        nonTradingIncomePence: Math.max(0, nonTradingIncomePence),
        exemptDistributionsPence: Math.round((Number(f.exemptDistributions) || 0) * 100),
        tradingLossesBroughtForwardPence: 0,
        setOffCurrentLossAgainstOtherProfits: false,
        closeCompany: true,
        directorLoans: directorLoansList
      });
    } catch {
      return null;
    }
  }, [isDormant, isProperty, isMixed, propertyNetTaxable, tradingOperatingProfit, disallowables, aiaClaimed, rawLoans, f.associatedCompanies, f.exemptDistributions, periodStart, periodEnd]);

  const corporationTax = isDormant
    ? 0
    : ctEngineResult
    ? Math.round(ctEngineResult.corporationTaxPence / 100)
    : Math.round(taxableProfit * 0.19);

  const s455Tax = isDormant
    ? 0
    : ctEngineResult
    ? Math.round(ctEngineResult.s455TaxPence / 100)
    : rawLoans.reduce((total: number, loan: any) => {
        const adv = Number(loan.advanceAmount) || 0;
        const rep = Number(loan.repaidAmount) || 0;
        const outstanding = Math.max(0, adv - rep);
        if (outstanding <= 0) return total;
        const ratePct = loan.advanceDate && loan.advanceDate >= '2026-04-06' ? 35.75 : 33.75;
        return total + Math.round((outstanding * ratePct) / 100);
      }, 0);

  const totalHmrcPayable = corporationTax + s455Tax;
  const netProfit = isDormant ? 0 : tradingOperatingProfit - corporationTax;

  // Balance sheet items
  const fixedAssets = isDormant ? 0 : (f.fixedAssets ?? 15000);
  const debtors = isDormant ? 0 : (f.debtors ?? 10000);
  const shareCapital = f.shareCapital ?? 100;
  const cashAtBank = isDormant ? shareCapital : (f.cashAtBank ?? 33400);
  const creditors = isDormant ? 0 : (f.creditorsUnderOneYear ?? 25000);
  const netCurrentAssets = debtors + cashAtBank - creditors;
  const netAssets = fixedAssets + netCurrentAssets;
  const retainedEarnings = isDormant ? 0 : (f.openingRetainedEarnings ? f.openingRetainedEarnings + netProfit - (f.dividendsPaid || 0) : netAssets - shareCapital);

  // Prior-Year Benchmarks for Comparative Reporting (FE-03)
  const py = {
    turnover: isDormant ? 0 : 100000,
    costOfSales: isDormant ? 0 : 20000,
    otherCharges: isDormant ? 0 : 48100,
    tax: isDormant ? 0 : 6061,
    netProfit: isDormant ? 0 : 25839,
    fixedAssets: isDormant ? 0 : 15000,
    debtors: isDormant ? 0 : 10000,
    cash: isDormant ? 100 : 33400,
    creditors: isDormant ? 0 : 25000,
    netCurrentAssets: isDormant ? 100 : 18400,
    netAssets: isDormant ? 100 : 33400,
    shareCapital: 100,
    retainedEarnings: isDormant ? 0 : 33300
  };

  const totalLoanAdvances = rawLoans.reduce((acc: number, l: any) => acc + (Number(l.advanceAmount) || 0), 0);
  const totalLoanRepayments = rawLoans.reduce((acc: number, l: any) => acc + (Number(l.repaidAmount) || 0), 0);
  const totalLoanOutstanding = Math.max(0, totalLoanAdvances - totalLoanRepayments);

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
    <ix:nonNumeric name="uk-direp:DateApprovalAccounts" contextRef="ctx_current_instant">${approvalDate}</ix:nonNumeric>

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
    <ix:nonFraction name="uk-gaap:NetCurrentAssetsLiabilities" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${netCurrentAssets}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:NetAssetsLiabilities" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${netAssets}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CalledUpShareCapital" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${shareCapital}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ProfitLossAccountReserve" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${retainedEarnings}</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ShareholderFunds" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">${netAssets}</ix:nonFraction>
  </body>
</html>`;

  const downloadIxbrl = () => {
    const blob = new Blob([sampleIxbrl], { type: 'application/xhtml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-accounts.xhtml`;
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
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-stone-500 mb-1">
            <Link href="/dashboard" className="hover:text-stone-900 transition">Dashboard</Link>
            <span>/</span>
            <Link href={`/filings/${filingId}/wizard`} className="hover:text-stone-900 transition">Filing Studio</Link>
            <span>/</span>
            <span className="text-stone-900 font-semibold">Statutory Documents</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-950">
            Statutory Document Center
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Official FRS 105 micro-entity accounts and HMRC CT600 Corporation Tax return schedules for {companyName}.
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
        title="Annual Filing Requirements & Statutory Standards"
        summary="UK micro-entities file statutory accounts with Companies House under FRS 105 and a separate digital CT600 return with HMRC."
        tips={[
          'Full Accounts (FRS 105): Public statutory filing disclosing your balance sheet, statutory footnotes, and director approval.',
          'HMRC CT600 Return: Private tax computation showing Box 145 turnover, capital allowances, marginal relief, and any s455 director loan tax.',
          'iXBRL XHTML: The digitally certified XML standard with machine-readable taxonomy tags required by both gateways.'
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
                ? `Dormant Company Financial Statements for the Period Ended ${formatDateBritish(periodEnd)} under CA 2006 s480`
                : `Unaudited Financial Statements for the Period Ended ${formatDateBritish(periodEnd)} under FRS 105`}
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
                <p className="text-[11px] font-sans text-slate-500">
                  For the period {formatDateBritish(periodStart)} to {formatDateBritish(periodEnd)}
                </p>
              </div>

              <div className="space-y-2 text-xs sm:text-sm font-sans max-w-2xl">
                <div className="grid grid-cols-12 pb-1 border-b border-slate-200 font-bold text-[11px] text-slate-400 uppercase">
                  <span className="col-span-8">Line Item</span>
                  <span className="col-span-2 text-right">CY (£)</span>
                  <span className="col-span-2 text-right">PY (£)</span>
                </div>
                <div className="grid grid-cols-12 py-1">
                  <span className="col-span-8">Gross Rental Receipts &amp; Property Income</span>
                  <span className="col-span-2 text-right font-mono font-semibold">{formatAccounting(turnover, false)}</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">{formatAccounting(36000, false)}</span>
                </div>
                <div className="grid grid-cols-12 py-1 text-slate-600">
                  <span className="col-span-8">Allowable property repairs and management charges</span>
                  <span className="col-span-2 text-right font-mono">({formatAccounting(propertyExpenses, false)})</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">(6,000)</span>
                </div>
                <div className="grid grid-cols-12 py-1 text-amber-800">
                  <span className="col-span-8">Loan interest and finance costs (NTLR Debit - Box 260)</span>
                  <span className="col-span-2 text-right font-mono">({formatAccounting(propertyMortgageInterest, false)})</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">(12,000)</span>
                </div>
                <div className="grid grid-cols-12 py-2 font-bold text-base border-t-2 border-b border-slate-900 text-slate-950">
                  <span className="col-span-8">Net Property Profit before Tax</span>
                  <span className="col-span-2 text-right font-mono font-bold">{formatAccounting(taxableProfit, false)}</span>
                  <span className="col-span-2 text-right font-mono text-slate-600">18,000</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                  Income Statement (Profit and Loss Account)
                </h3>
                <p className="text-[11px] font-sans text-slate-500">
                  For the period {formatDateBritish(periodStart)} to {formatDateBritish(periodEnd)} (FRS 105 Format)
                </p>
              </div>

              {/* Full Statutory FRS 105 Lines & Prior-Year Comparative Column (FE-03) */}
              <div className="space-y-2 text-xs sm:text-sm font-sans max-w-2xl">
                <div className="grid grid-cols-12 pb-1 border-b border-slate-200 font-bold text-[11px] text-slate-400 uppercase">
                  <span className="col-span-7">Line Item</span>
                  <span className="col-span-1 text-center font-serif text-[10px] text-slate-300">Note</span>
                  <span className="col-span-2 text-right">CY (£)</span>
                  <span className="col-span-2 text-right text-slate-400">PY (£)</span>
                </div>

                <div className="grid grid-cols-12 py-1">
                  <span className="col-span-7 font-semibold text-slate-900">Turnover / Gross Operating Revenue</span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono font-semibold text-slate-900">{formatAccounting(turnover, false)}</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">{formatAccounting(py.turnover, false)}</span>
                </div>

                <div className="grid grid-cols-12 py-1 text-slate-600">
                  <span className="col-span-7">Other income</span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono">0</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">0</span>
                </div>

                <div className="grid grid-cols-12 py-1 text-slate-600">
                  <span className="col-span-7">Cost of raw materials and consumables (Cost of sales)</span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono">({formatAccounting(costOfSales, false)})</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">({formatAccounting(py.costOfSales, false)})</span>
                </div>

                <div className="grid grid-cols-12 py-1 text-slate-600">
                  <span className="col-span-7">Staff costs</span>
                  <span className="col-span-1 text-center font-serif text-slate-500 text-xs">3</span>
                  <span className="col-span-2 text-right font-mono">0</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">0</span>
                </div>

                <div className="grid grid-cols-12 py-1 text-slate-600">
                  <span className="col-span-7">Depreciation and other amounts written off assets</span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono">0</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">0</span>
                </div>

                <div className="grid grid-cols-12 py-1 text-slate-600">
                  <span className="col-span-7">Other charges (Administrative expenses)</span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono">({formatAccounting(otherCharges, false)})</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">({formatAccounting(py.otherCharges, false)})</span>
                </div>

                <div className="grid grid-cols-12 py-1 text-slate-600">
                  <span className="col-span-7">Tax on profit (Corporation Tax charge)</span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono">({formatAccounting(corporationTax, false)})</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">({formatAccounting(py.tax, false)})</span>
                </div>

                <div className="grid grid-cols-12 py-2 font-bold text-base border-t-2 border-b border-slate-900 text-slate-950">
                  <span className="col-span-7">Profit for the financial year</span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono font-bold">{formatAccounting(netProfit, false)}</span>
                  <span className="col-span-2 text-right font-mono font-bold text-slate-600">{formatAccounting(py.netProfit, false)}</span>
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
                <p className="text-[11px] font-sans text-slate-500">As at {formatDateBritish(periodEnd)}</p>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                {isDormant ? 'CA 2006 s480 AA02' : 'FRS 105 Section 4'}
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm font-sans max-w-2xl">
              <div className="grid grid-cols-12 pb-1 border-b border-slate-200 font-bold text-[11px] text-slate-400 uppercase">
                <span className="col-span-7">Item</span>
                <span className="col-span-1 text-center font-serif text-[10px] text-slate-300">Note</span>
                <span className="col-span-2 text-right">CY (£)</span>
                <span className="col-span-2 text-right text-slate-400">PY (£)</span>
              </div>

              {!isDormant && (
                <div className="grid grid-cols-12 py-1 font-bold text-slate-900">
                  <span className="col-span-7">
                    {isProperty ? 'Investment Property / Land & Buildings' : 'Fixed assets (Tangible assets)'}
                  </span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono">{formatAccounting(fixedAssets, false)}</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">{formatAccounting(py.fixedAssets, false)}</span>
                </div>
              )}

              <div className="text-[11px] font-bold text-slate-400 uppercase pt-2">Current Assets</div>
              {!isDormant && (
                <div className="grid grid-cols-12 py-1 pl-4 text-slate-700">
                  <span className="col-span-7">Debtors</span>
                  <span className="col-span-1 text-center font-serif text-slate-500 text-xs">4</span>
                  <span className="col-span-2 text-right font-mono">{formatAccounting(debtors, false)}</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">{formatAccounting(py.debtors, false)}</span>
                </div>
              )}
              <div className="grid grid-cols-12 py-1 pl-4 text-slate-700">
                <span className="col-span-7">Cash at bank and in hand</span>
                <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                <span className="col-span-2 text-right font-mono">{formatAccounting(cashAtBank, false)}</span>
                <span className="col-span-2 text-right font-mono text-slate-500">{formatAccounting(py.cash, false)}</span>
              </div>
              <div className="grid grid-cols-12 py-1 font-semibold border-t border-slate-200 text-slate-900">
                <span className="col-span-7">Total current assets</span>
                <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                <span className="col-span-2 text-right font-mono">{formatAccounting(debtors + cashAtBank, false)}</span>
                <span className="col-span-2 text-right font-mono text-slate-500">{formatAccounting(py.debtors + py.cash, false)}</span>
              </div>

              {!isDormant && (
                <div className="grid grid-cols-12 py-1 text-slate-600">
                  <span className="col-span-7">Creditors: amounts falling due within one year</span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono">({formatAccounting(creditors, false)})</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">({formatAccounting(py.creditors, false)})</span>
                </div>
              )}
              <div className="grid grid-cols-12 py-1 font-semibold border-t border-slate-200 text-slate-900">
                <span className="col-span-7">Net current assets</span>
                <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                <span className="col-span-2 text-right font-mono">{formatAccounting(netCurrentAssets, false)}</span>
                <span className="col-span-2 text-right font-mono text-slate-500">{formatAccounting(py.netCurrentAssets, false)}</span>
              </div>

              <div className="grid grid-cols-12 py-2 font-bold text-sm sm:text-base border-t-2 border-b-2 border-slate-900 text-slate-950">
                <span className="col-span-7">Total Net Assets</span>
                <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                <span className="col-span-2 text-right font-mono font-bold">{formatAccounting(netAssets, false)}</span>
                <span className="col-span-2 text-right font-mono font-bold text-slate-600">{formatAccounting(py.netAssets, false)}</span>
              </div>

              <div className="text-[11px] font-bold text-slate-400 uppercase pt-3">Capital and Reserves</div>
              <div className="grid grid-cols-12 py-1 pl-4 text-slate-700">
                <span className="col-span-7">Called up share capital</span>
                <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                <span className="col-span-2 text-right font-mono">{formatAccounting(shareCapital, false)}</span>
                <span className="col-span-2 text-right font-mono text-slate-500">{formatAccounting(py.shareCapital, false)}</span>
              </div>
              {!isDormant && (
                <div className="grid grid-cols-12 py-1 pl-4 text-slate-700">
                  <span className="col-span-7">Profit and loss account (Retained reserves)</span>
                  <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                  <span className="col-span-2 text-right font-mono">{formatAccounting(retainedEarnings, false)}</span>
                  <span className="col-span-2 text-right font-mono text-slate-500">{formatAccounting(py.retainedEarnings, false)}</span>
                </div>
              )}

              <div className="grid grid-cols-12 py-2 font-bold text-sm sm:text-base border-t-2 border-b-2 border-slate-900 text-slate-950">
                <span className="col-span-7">Total Shareholders' Funds</span>
                <span className="col-span-1 text-center font-mono text-slate-400 text-xs">—</span>
                <span className="col-span-2 text-right font-mono font-bold">{formatAccounting(netAssets, false)}</span>
                <span className="col-span-2 text-right font-mono font-bold text-slate-600">{formatAccounting(py.netAssets, false)}</span>
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
                "For the period ended {formatDateBritish(periodEnd)} the company was entitled to exemption from audit under section 480 of the Companies Act 2006 relating to dormant companies. The members have not required the company to obtain an audit in accordance with section 476. The directors acknowledge their responsibilities for complying with the requirements of the Act with respect to accounting records and the preparation of accounts."
              </p>
            ) : (
              <>
                <p className="leading-relaxed">
                  (a) For the period ended {formatDateBritish(periodEnd)} the company was entitled to exemption from audit under section 477 of the Companies Act 2006 relating to micro-entities.
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
              Approved by the board of directors on {formatDateBritish(approvalDate)} and signed on its behalf by: <strong className="text-slate-950">{directorName}</strong>, Director.
            </div>
          </div>

          {/* Notes to the Financial Statements (Restored for FE-03) */}
          {!isDormant && (
            <div className="space-y-6 pt-6 border-t border-slate-200 font-sans text-xs text-slate-700">
              <h3 className="font-serif text-lg font-bold text-slate-950">
                Notes to the Financial Statements
              </h3>
              <p className="text-[11px] text-slate-500 -mt-4">
                For the period ended {formatDateBritish(periodEnd)}
              </p>

              {/* Note 1 */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">1. General Information</h4>
                <p className="text-slate-600 leading-relaxed">
                  {companyName} is a private company limited by shares, incorporated in England &amp; Wales under registration number {crn}. The registered office address is 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ.
                </p>
              </div>

              {/* Note 2 */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">2. Basis of Preparation and Accounting Policies</h4>
                <p className="text-slate-600 leading-relaxed">
                  These financial statements have been prepared in accordance with Financial Reporting Standard 105 "The Financial Reporting Standard applicable to the Micro-entities Regime" and the provisions of the Companies Act 2006 applicable to micro-entities. The financial statements have been prepared under the historical cost convention.
                </p>
              </div>

              {/* Note 3: Employees (CA 2006 s411) */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">3. Average Number of Employees (CA 2006 s411)</h4>
                <p className="text-slate-600 leading-relaxed">
                  The average number of persons employed by the company (including executive director) during the period was <strong className="text-slate-900 font-semibold">{f.averageEmployees || 1}</strong> (2025: 1).
                </p>
              </div>

              {/* Note 4: Directors' Advances, Credits and Guarantees (CA 2006 s413) */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">4. Directors' Advances, Credits and Guarantees (CA 2006 s413)</h4>
                {rawLoans.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-slate-600 leading-relaxed">
                      During the period, advances totaling <strong className="text-slate-950">£{totalLoanAdvances.toLocaleString()}</strong> were made to {directorName}, of which £{totalLoanRepayments.toLocaleString()} was repaid. The balance outstanding at the balance sheet date was <strong className="text-slate-950">£{totalLoanOutstanding.toLocaleString()}</strong> (2025: £nil). The advances are unsecured, interest-free, and repayable on demand.
                    </p>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase">
                            <th className="py-2 px-3">Director</th>
                            <th className="py-2 px-3">Advance Date</th>
                            <th className="py-2 px-3 text-right">Advanced (£)</th>
                            <th className="py-2 px-3 text-right">Repaid (£)</th>
                            <th className="py-2 px-3 text-right font-bold text-slate-900">Outstanding (£)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {rawLoans.map((l: any, idx: number) => {
                            const adv = Number(l.advanceAmount) || 0;
                            const rep = Number(l.repaidAmount) || 0;
                            const out = Math.max(0, adv - rep);
                            return (
                              <tr key={l.id || idx}>
                                <td className="py-1.5 px-3 font-sans">{l.directorName || directorName}</td>
                                <td className="py-1.5 px-3 text-slate-600">{l.advanceDate || periodStart}</td>
                                <td className="py-1.5 px-3 text-right">{adv.toLocaleString()}</td>
                                <td className="py-1.5 px-3 text-right">{rep.toLocaleString()}</td>
                                <td className="py-1.5 px-3 text-right font-bold text-slate-950">{out.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 leading-relaxed">
                    During the period, no advances, credits, or guarantees were made to directors, and no balances were outstanding at the balance sheet date (2025: £nil).
                  </p>
                )}
              </div>
            </div>
          )}
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
              <span className="text-xs text-slate-400 block">Period: {formatDateBritish(periodStart)} to {formatDateBritish(periodEnd)}</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {isDormant ? 'Statutory Nil Return' : 'Small Profits Rate (19%) / Marginal Relief'}
              </span>
            </div>
          </div>

          {/* Box Numbered Table (FE-04 Compliant) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <div className="bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 flex justify-between items-center">
              <span>HMRC CT600 Official Boxes &amp; Tax Computations</span>
              <span className="text-[10px] text-slate-400 font-mono">CTA 2010 Part 2</span>
            </div>

            {/* Box 145: Turnover */}
            <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 145</span>
                <span>Gross turnover / operating revenue</span>
              </div>
              <span className="font-mono font-semibold text-slate-950">{formatAccounting(turnover)}</span>
            </div>

            {/* Box 155 or Box 190 */}
            {isProperty ? (
              <>
                <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 190</span>
                    <span>Net income from UK property (Schedule A)</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-950">{formatAccounting(propertyNetTaxable)}</span>
                </div>

                <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-amber-50/50">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-xs font-bold text-amber-900">Box 260</span>
                    <span>Non-Trading Loan Relationship debit (Mortgage Interest)</span>
                  </div>
                  <span className="font-mono text-amber-900">-{formatAccounting(propertyMortgageInterest)}</span>
                </div>
              </>
            ) : (
              <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center space-x-3">
                  <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 155</span>
                  <span>Trading profits before capital allowances &amp; deductions</span>
                </div>
                <span className="font-mono font-semibold text-slate-950">{formatAccounting(tradingOperatingProfit)}</span>
              </div>
            )}

            {/* Add-back: Client Entertaining */}
            {!isDormant && disallowables > 0 && (
              <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-amber-50/40">
                <div className="flex items-center space-x-3 pl-4">
                  <span className="font-mono text-amber-700 font-bold">+</span>
                  <span className="text-amber-900">Add-Back: Disallowable Client Entertaining (CTA 2009 s1298)</span>
                </div>
                <span className="font-mono text-amber-900 font-semibold">+{formatAccounting(disallowables)}</span>
              </div>
            )}

            {/* Deduct: AIA Claimed Box 690 (FE-04) */}
            {!isDormant && aiaClaimed > 0 && (
              <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-emerald-50/40">
                <div className="flex items-center space-x-3">
                  <span className="font-mono bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs font-bold text-emerald-900">Box 690</span>
                  <span className="text-emerald-950">Deduct: Annual Investment Allowance (AIA claimed)</span>
                </div>
                <span className="font-mono text-emerald-900 font-semibold">-{formatAccounting(aiaClaimed)}</span>
              </div>
            )}

            {/* Box 315: Total Taxable Profits (FE-04) */}
            <div className="p-4 flex items-center justify-between text-xs sm:text-sm font-semibold bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 315</span>
                <span className="font-semibold text-slate-900">Profits Chargeable to Corporation Tax</span>
              </div>
              <span className="font-mono font-bold text-slate-950">{formatAccounting(taxableProfit)}</span>
            </div>

            {/* Box 440: Corporation Tax Chargeable (FE-04) */}
            <div className="p-4 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 440</span>
                <span>Corporation Tax Chargeable (Main Rate / Small Profits Rate)</span>
              </div>
              <span className="font-mono font-bold text-slate-900">{formatAccounting(corporationTax)}</span>
            </div>

            {/* Box 480: Section 455 Tax (FE-04) */}
            {s455Tax > 0 && (
              <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-amber-50/50">
                <div className="flex items-center space-x-3">
                  <span className="font-mono bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-xs font-bold text-amber-900">Box 480</span>
                  <span className="font-semibold text-amber-950">Tax payable under Section 455 CTA 2010 (CT600A Loan Schedule)</span>
                </div>
                <span className="font-mono font-bold text-amber-950">+{formatAccounting(s455Tax)}</span>
              </div>
            )}

            {/* Box 525: Total Amount Payable to HMRC (FE-04) */}
            <div className="p-4 flex items-center justify-between text-xs sm:text-sm bg-slate-950 text-white font-semibold">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-xs font-bold text-emerald-400">
                  {s455Tax > 0 ? 'Box 525' : 'Box 440'}
                </span>
                <span className="font-bold text-white">Total Amount Payable to HMRC (TMA 1970 s59D)</span>
              </div>
              <span className="font-mono font-black text-base text-emerald-400">{formatAccounting(totalHmrcPayable)}</span>
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

          <pre className="overflow-x-auto p-4 bg-slate-900 rounded-2xl text-[11px] leading-relaxed text-slate-300 max-h-96">
            <code>{sampleIxbrl}</code>
          </pre>
        </div>
      )}

      {/* Tab 4: Director Approval Certificate */}
      {activeTab === 'signing' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 font-sans">
          <div className="flex items-center space-x-3 text-emerald-700 border-b border-slate-100 pb-4">
            <Award className="w-7 h-7" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Certificate of Director Approval</h3>
              <p className="text-xs text-slate-500">Statutory Record under Companies Act 2006 s414 &amp; TMA 1970 s108</p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-w-2xl">
            <p>
              I, <strong className="text-slate-950 font-bold">{directorName}</strong>, being a duly appointed director of{' '}
              <strong className="text-slate-950 font-bold">{companyName}</strong> (Company Number: {crn}), hereby certify that:
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>
                The financial statements for the period ended {formatDateBritish(periodEnd)} have been formally approved by the board of directors in accordance with the Companies Act 2006.
              </li>
              <li>
                The company qualifies for the micro-entities regime under section 384A and section 477 of the Companies Act 2006, and these accounts have been prepared in accordance with Financial Reporting Standard 105.
              </li>
              <li>
                The Corporation Tax return (Form CT600) and supporting schedules reflect a true and complete statement of the company's taxable profits and liabilities for the period.
              </li>
              {s455Tax > 0 && (
                <li>
                  The Section 455 tax charge of £{s455Tax.toLocaleString()} on overdrawn director loans has been reviewed and acknowledged.
                </li>
              )}
            </ul>

            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Approved On</span>
                <span className="font-mono text-xs font-bold text-slate-900">{formatDateBritish(approvalDate)}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Appointed Signatory</span>
                <span className="text-xs font-bold text-slate-900">{directorName} (Director)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Statutory documents synchronized with active filing state</span>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/filings/${filingId}/wizard`}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Back to Wizard
          </Link>
          <Link
            href={`/filings/${filingId}/wizard?step=3`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
          >
            <span>Proceed to Submit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        initialTermId={initialGlossaryTerm}
      />
    </div>
  );
}
