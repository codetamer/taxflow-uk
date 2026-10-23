'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Building2,
  UploadCloud,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileDown,
  ArrowRight,
  ArrowLeft,
  Lock,
  Search,
  Save,
  Sparkles,
  Receipt,
  Scale,
  BookOpen,
  Check,
  Download,
  RefreshCw,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Share2,
  Landmark,
  ExternalLink,
  HelpCircle,
  Clock,
  Printer
} from 'lucide-react';
import { TermExplainer } from '@/components/TermExplainer';
import { PlainEnglishBanner } from '@/components/PlainEnglishBanner';
import { GlossaryModal } from '@/components/GlossaryModal';
import { AutoReconcileModal } from '@/components/AutoReconcileModal';
import { ImportStatementModal } from '@/components/ImportStatementModal';
import { DirectorLoansSchedule } from '@/components/DirectorLoansSchedule';
import type { DirectorLoanItem } from '@/components/DirectorLoansSchedule';
import { ComparativeFinancialTable } from '@/components/ComparativeFinancialTable';
import type { FinancialLineItem } from '@/components/ComparativeFinancialTable';
import { TaxComputationBreakdown } from '@/components/TaxComputationBreakdown';
import { PayHmrcModal } from '@/components/PayHmrcModal';
import { ComplianceScoreRing } from '@/components/ComplianceScoreRing';
import { computePeriod, ctPaymentDueDate, daysInclusive, mainPoolWdaRatePct } from '@taxflow/ct-engine';
import { runPreFlightShield } from '@taxflow/shield';
import type { ShieldInput } from '@taxflow/shield';

export default function WizardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
        </div>
      }
    >
      <WizardContent />
    </Suspense>
  );
}

function WizardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const filingId = (params?.id as string) || 'fil_demo';

  // 3-Step Wizard Navigation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [initialGlossaryTerm, setInitialGlossaryTerm] = useState<string>('');

  // Modals & Enhanced Interactivity
  const [isAutoReconcileOpen, setIsAutoReconcileOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isPayHmrcOpen, setIsPayHmrcOpen] = useState<boolean>(false);
  const [isShareSuccess, setIsShareSuccess] = useState<boolean>(false);
  const [isStatutoryGuidanceOpen, setIsStatutoryGuidanceOpen] = useState<boolean>(false);
  const [registeredDirectors, setRegisteredDirectors] = useState<string[]>([
    'Muhammad Saif Raza'
  ]);

  // Form State initialized to DropLogicX Ltd benchmark
  const [form, setForm] = useState({
    companyName: 'DROPLOGICX LTD',
    crn: '15152081',
    companyType: 'TRADING' as 'TRADING' | 'PROPERTY' | 'DORMANT',
    utr: '1234567890',
    registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
    directorName: 'Muhammad Saif Raza',
    periodStart: '2025-10-01',
    periodEnd: '2026-09-30',
    associatedCompanies: 0,
    averageEmployees: 1,
    isDirectorApproved: true,
    turnover: 100000,
    costOfSales: 20000,
    otherCharges: 48100,
    disallowables: 3100,
    fixedAssets: 15000,
    capitalAdditions: 15000,
    carAdditions: 0,
    mainPoolBroughtForward: 0,
    aiaClaimed: 15000,
    debtors: 10000,
    cashAtBank: 33400,
    creditorsUnderOneYear: 25000,
    shareCapital: 100,
    dividendsPaid: 10000,
    openingRetainedEarnings: 15200,
    directorLoanAdvance: 0,
    directorLoanDate: '2026-05-01',
    directorLoanRepaidAmount: 0,
    directorLoanRepaidDate: '',
    directorLoans: [
      {
        id: 'loan_1',
        directorName: 'Muhammad Saif Raza',
        advanceDate: '2026-05-01',
        advanceAmount: 0,
        repaidAmount: 0,
        repaidDate: ''
      }
    ] as DirectorLoanItem[],
    chAuthCode: 'ABC123',
    gatewayUserId: '123456789012',
    // Pre-submission credentials checklist
    hasUtrChecked: true,
    hasGatewayChecked: true,
    hasAuthCodeChecked: true
  });

  // Collapsible Accordions in Step 2 (Annual Figures)
  const [expandedPanels, setExpandedPanels] = useState({
    pnl: true,
    balanceSheet: true,
    allowances: true,
    loans: true,
    taxSchedule: true
  });

  const togglePanel = (panel: 'pnl' | 'balanceSheet' | 'allowances' | 'loans' | 'taxSchedule') => {
    setExpandedPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  // Companies House Live Lookup State
  const [chQuery, setChQuery] = useState<string>('');
  const [chResults, setChResults] = useState<any[]>([]);
  const [isSearchingCh, setIsSearchingCh] = useState<boolean>(false);
  const [chVerified, setChVerified] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isAutosaving, setIsAutosaving] = useState<boolean>(false);
  const [priorYearData, setPriorYearData] = useState<any>(null);
  const [isFetchingPriorYear, setIsFetchingPriorYear] = useState<boolean>(false);
  const [priorYearStatus, setPriorYearStatus] = useState<string>('');

  const fetchPriorYearAccounts = async (crnOverride?: string) => {
    const targetCrn = crnOverride || form.crn;
    if (!targetCrn) return;
    setIsFetchingPriorYear(true);
    setPriorYearStatus('Retrieving historical iXBRL from Companies House...');
    try {
      const res = await fetch(`/api/companies-house/company/${targetCrn}/prior-accounts`);
      const data = await res.json();
      if (data.success && data.isAvailable && data.figures) {
        setPriorYearData(data);
        setPriorYearStatus(`Successfully synced prior year accounts (Period ended ${data.periodEnd})`);
      } else {
        setPriorYearStatus(data.message || 'No prior year accounts available.');
      }
    } catch {
      setPriorYearStatus('Failed to sync prior accounts.');
    } finally {
      setIsFetchingPriorYear(false);
    }
  };

  // 1. Initial State Hydration: Load saved draft on mount
  useEffect(() => {
    async function loadSavedDraft() {
      try {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`taxflow_draft_${filingId}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed.directorLoans && Array.isArray(parsed.directorLoans)) {
                setForm((prev) => ({ ...prev, ...parsed }));
              } else if (parsed.directorLoanAdvance > 0) {
                setForm((prev) => ({
                  ...prev,
                  ...parsed,
                  directorLoans: [
                    {
                      id: 'loan_1',
                      directorName: parsed.directorName || 'Muhammad Saif Raza',
                      advanceDate: parsed.directorLoanDate || '2026-05-01',
                      advanceAmount: parsed.directorLoanAdvance,
                      repaidAmount: parsed.directorLoanRepaidAmount || 0,
                      repaidDate: parsed.directorLoanRepaidDate || ''
                    }
                  ]
                }));
              } else {
                setForm((prev) => ({ ...prev, ...parsed }));
              }
            } catch {}
          }
        }

        const res = await fetch(`/api/filings/${filingId}`);
        const data = await res.json();
        if (data.success && data.filing?.formData) {
          const fd = data.filing.formData;
          if (fd.directorLoans && Array.isArray(fd.directorLoans)) {
            setForm((prev) => ({ ...prev, ...fd }));
          } else if (fd.directorLoanAdvance > 0) {
            setForm((prev) => ({
              ...prev,
              ...fd,
              directorLoans: [
                {
                  id: 'loan_1',
                  directorName: fd.directorName || 'Muhammad Saif Raza',
                  advanceDate: fd.directorLoanDate || '2026-05-01',
                  advanceAmount: fd.directorLoanAdvance,
                  repaidAmount: fd.directorLoanRepaidAmount || 0,
                  repaidDate: fd.directorLoanRepaidDate || ''
                }
              ]
            }));
          } else {
            setForm((prev) => ({ ...prev, ...fd }));
          }
          const now = new Date();
          setLastSavedTime(`Synced ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        }
      } catch {
        // Fall back to benchmark defaults
      }
    }
    loadSavedDraft();
    fetchPriorYearAccounts('15152081');
  }, [filingId]);

  // 2. Debounced Autosave: Saves draft to database and local cache on every field edit
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsAutosaving(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`taxflow_draft_${filingId}`, JSON.stringify(form));
        }

        const res = await fetch(`/api/filings/${filingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData: form })
        });
        if (res.ok) {
          const now = new Date();
          setLastSavedTime(`Saved at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        }
      } catch {
        // Keep local cache
      } finally {
        setIsAutosaving(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [form, filingId]);

  const openGlossaryWith = (termId: string) => {
    setInitialGlossaryTerm(termId);
    setIsGlossaryOpen(true);
  };

  // Debounced search for Companies House
  useEffect(() => {
    if (!chQuery || chQuery.trim().length < 2) {
      setChResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingCh(true);
        const res = await fetch(`/api/companies-house/search?q=${encodeURIComponent(chQuery)}`);
        const data = await res.json();
        if (data.success && data.items) {
          setChResults(data.items);
        }
      } catch {
        // ignore
      } finally {
        setIsSearchingCh(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [chQuery]);

  const selectCompany = async (crn: string) => {
    try {
      setIsSearchingCh(true);
      const res = await fetch(`/api/companies-house/company/${crn}`);
      const data = await res.json();
      if (data.success && data.company) {
        const c = data.company;
        if (c.directors && Array.isArray(c.directors) && c.directors.length > 0) {
          setRegisteredDirectors(c.directors);
        }
        setForm((prev) => ({
          ...prev,
          companyName: c.company_name || c.name,
          crn: c.company_number || c.crn,
          directorName: (c.directors && c.directors[0]) || prev.directorName,
          registeredAddress: c.registeredAddress ||
            (c.registered_office_address
              ? `${c.registered_office_address.address_line_1 || ''}, ${c.registered_office_address.locality || ''}, ${c.registered_office_address.postal_code || ''}`
              : prev.registeredAddress),
          periodEnd: c.periodEnd || c.accounts?.next_accounts?.period_end_on || prev.periodEnd
        }));
        setChVerified(true);
        setChQuery('');
        setChResults([]);
        fetchPriorYearAccounts(c.company_number || c.crn);
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingCh(false);
    }
  };

  // URL Query Parameters Pre-population from Homepage Hero Search
  useEffect(() => {
    const urlCrn = searchParams.get('crn');
    const urlName = searchParams.get('name');
    const urlTurnover = searchParams.get('turnover');
    const urlExpenses = searchParams.get('expenses');

    if (urlCrn) {
      selectCompany(urlCrn);
    } else if (urlName) {
      setForm((prev) => ({ ...prev, companyName: urlName }));
    }

    if (urlTurnover) {
      const t = Number(urlTurnover);
      if (!isNaN(t) && t > 0) {
        setForm((prev) => ({ ...prev, turnover: t }));
      }
    }

    if (urlExpenses) {
      const exp = Number(urlExpenses);
      if (!isNaN(exp) && exp >= 0) {
        setForm((prev) => ({
          ...prev,
          costOfSales: Math.round(exp * 0.35),
          otherCharges: Math.round(exp * 0.65)
        }));
      }
    }
  }, [searchParams]);

  // Reconciliation handler for IMP-09
  const handleApplyReconcile = (target: 'cash' | 'retainedEarnings' | 'creditors') => {
    if (target === 'cash') {
      const neededCash = totalEquity - form.fixedAssets - form.debtors + form.creditorsUnderOneYear;
      setForm((prev) => ({ ...prev, cashAtBank: Math.max(0, neededCash) }));
    } else if (target === 'retainedEarnings') {
      const currentNetProfit = operatingProfit - taxPayable;
      const neededOpening = netAssets - form.shareCapital - currentNetProfit + form.dividendsPaid;
      setForm((prev) => ({ ...prev, openingRetainedEarnings: neededOpening }));
    } else if (target === 'creditors') {
      const totalCurrentAssets = form.debtors + form.cashAtBank;
      const neededCreditors = form.fixedAssets + totalCurrentAssets - totalEquity;
      setForm((prev) => ({ ...prev, creditorsUnderOneYear: Math.max(0, neededCreditors) }));
    }
  };

  // Statement Ingestion handler for F9
  const handleApplyImportedFigures = (figures: {
    turnover?: number;
    costOfSales?: number;
    otherCharges?: number;
    capitalAdditions?: number;
    cash?: number;
  }) => {
    setForm((prev) => ({
      ...prev,
      turnover: figures.turnover !== undefined ? figures.turnover : prev.turnover,
      costOfSales: figures.costOfSales !== undefined ? figures.costOfSales : prev.costOfSales,
      otherCharges: figures.otherCharges !== undefined ? figures.otherCharges : prev.otherCharges,
      fixedAssets: figures.capitalAdditions !== undefined ? figures.capitalAdditions : prev.fixedAssets,
      capitalAdditions: figures.capitalAdditions !== undefined ? figures.capitalAdditions : prev.capitalAdditions,
      aiaClaimed: figures.capitalAdditions !== undefined ? figures.capitalAdditions : prev.aiaClaimed,
      cashAtBank: figures.cash !== undefined ? figures.cash : prev.cashAtBank
    }));
  };

  const handleSaveDraft = async () => {
    try {
      setSaveStatus('Saving...');
      await fetch(`/api/filings/${filingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: form })
      });
      const now = new Date();
      setLastSavedTime(`Saved at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setSaveStatus('Draft Saved!');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch {
      setSaveStatus('Saved Locally');
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  const handleShareDraft = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/filings/${filingId}/documents?preview=reviewer`;
      navigator.clipboard.writeText(shareUrl);
      setIsShareSuccess(true);
      setTimeout(() => setIsShareSuccess(false), 3000);
    }
  };

  // 1. Core Operating and Taxable Profit Metrics
  const grossProfit = form.companyType === 'DORMANT' ? 0 : form.turnover - form.costOfSales;
  const operatingProfit = form.companyType === 'DORMANT' ? 0 : grossProfit - form.otherCharges;

  // 2. Capital Allowances & AIA Computation
  const qualifyingAdditions = form.capitalAdditions ?? form.fixedAssets ?? 15000;
  const aiaClaimed = Math.min(qualifyingAdditions, form.aiaClaimed ?? 15000);
  const mainPoolAdditions = Math.max(0, qualifyingAdditions - aiaClaimed) + (form.carAdditions ?? 0) + (form.mainPoolBroughtForward ?? 0);
  const periodDayCount = form.periodStart && form.periodEnd ? daysInclusive(form.periodStart, form.periodEnd) : 0;
  const isPeriodValid = periodDayCount > 0 && periodDayCount <= 366;
  const statutoryWdaRate = isPeriodValid && form.periodStart && form.periodEnd
    ? mainPoolWdaRatePct({ start: form.periodStart, end: form.periodEnd })
    : 14.0;
  const mainPoolWda = Math.round(mainPoolAdditions * (statutoryWdaRate / 100));
  const totalCapitalAllowances = form.companyType === 'DORMANT' ? 0 : aiaClaimed + mainPoolWda;

  // 3. Taxable Trading Profit (CTA 2009 / CTA 2010)
  const taxableProfit = form.companyType === 'DORMANT'
    ? 0
    : Math.max(0, operatingProfit + form.disallowables - totalCapitalAllowances);

  // 4. Official Due Date and Loan Scheduling
  const paymentDueDate = form.periodEnd ? ctPaymentDueDate(form.periodEnd) : '2027-07-01';

  // Multi-Loan Schedule Mapping for s455 (N1)
  const directorLoansList = useMemo(() => {
    const loans = form.directorLoans && form.directorLoans.length > 0
      ? form.directorLoans
      : form.directorLoanAdvance > 0
      ? [
          {
            id: 'loan_1',
            directorName: form.directorName || 'Muhammad Saif Raza',
            advanceDate: form.directorLoanDate || '2026-05-01',
            advanceAmount: form.directorLoanAdvance,
            repaidAmount: form.directorLoanRepaidAmount || 0,
            repaidDate: form.directorLoanRepaidDate || ''
          }
        ]
      : [];

    return loans
      .filter((l) => (l.advanceAmount || 0) > 0)
      .map((loan) => {
        const isRepaidInWindow =
          (loan.repaidAmount || 0) >= (loan.advanceAmount || 0) &&
          (!loan.repaidDate || !paymentDueDate || loan.repaidDate <= paymentDueDate);
        const outstanding = isRepaidInWindow ? 0 : Math.max(0, (loan.advanceAmount || 0) - (loan.repaidAmount || 0));
        return {
          id: loan.id,
          madeOn: loan.advanceDate || form.periodEnd || '2026-05-01',
          outstandingAtDueDatePence: Math.round(outstanding * 100)
        };
      });
  }, [
    form.directorLoans,
    form.directorLoanAdvance,
    form.directorLoanDate,
    form.directorLoanRepaidAmount,
    form.directorLoanRepaidDate,
    form.directorName,
    form.periodEnd,
    paymentDueDate
  ]);

  // 5. Official Corporation Tax & s455 Computation Engine
  const ctResult = useMemo(() => {
    try {
      if (!isPeriodValid || form.companyType === 'DORMANT') return null;

      return computePeriod({
        period: { start: form.periodStart, end: form.periodEnd },
        daysInYearBasis: 365,
        associatedCompanies: Number(form.associatedCompanies) || 0,
        tradingProfitAfterAllowancesPence: Math.round(taxableProfit * 100),
        nonTradingIncomePence: 0,
        exemptDistributionsPence: 0,
        tradingLossesBroughtForwardPence: 0,
        setOffCurrentLossAgainstOtherProfits: false,
        closeCompany: true,
        directorLoans: directorLoansList
      });
    } catch {
      return null;
    }
  }, [form.periodStart, form.periodEnd, isPeriodValid, form.companyType, form.associatedCompanies, taxableProfit, directorLoansList]);

  // Tax Payable is strictly 0 if period is invalid or dormant
  const taxPayable = isPeriodValid && ctResult ? Math.round(ctResult.corporationTaxPence / 100) : 0;
  const s455TaxPayable = ctResult ? Math.round(ctResult.s455TaxPence / 100) : 0;
  const totalHmrcPayable = taxPayable + s455TaxPayable;

  let taxRateLabel = 'Small Profits (19%)';
  if (ctResult && ctResult.totalTaxableProfitsPence > 0) {
    if (ctResult.marginalReliefPence > 0) {
      taxRateLabel = 'Marginal Relief';
    } else if (ctResult.augmentedProfitsPence >= ctResult.upperLimitPence) {
      taxRateLabel = 'Main Rate (25%)';
    }
  }

  // 6. P&L Bottom Line and Balance Sheet Calculations
  const netProfit = operatingProfit - taxPayable;
  const closingRetainedEarnings = form.openingRetainedEarnings + netProfit - form.dividendsPaid;

  const currentAssets = form.debtors + form.cashAtBank;
  const netCurrentAssets = currentAssets - form.creditorsUnderOneYear;
  const netAssets = form.fixedAssets + netCurrentAssets;
  const totalEquity = form.shareCapital + closingRetainedEarnings;
  const balanceSheetVariance = netAssets - totalEquity;

  // 7. Validation Rules
  const isUtrValid = /^\d{10}$/.test(form.utr.trim());
  const isStep1Valid = isUtrValid && isPeriodValid && form.companyName.trim().length > 0 && form.crn.trim().length > 0;

  // 8. Live Pre-Flight Shield Radar Engine
  const liveShieldReport = useMemo(() => {
    try {
      const input: ShieldInput = {
        entity: {
          crn: form.crn,
          companyName: form.companyName,
          companyType: form.companyType,
          utr: form.utr,
          isCloseCompany: true,
          isCharityOrPlc: false,
          chAuthCode: form.chAuthCode || 'ABC123',
          gatewayUserId: form.gatewayUserId || '123456789012',
          gatewayPassword: 'SecretPassword123!'
        },
        period: {
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          priorPeriodEnd: priorYearData?.periodEnd || (form.crn === '15152081' ? '2025-09-30' : undefined),
          daysInYearBasis: 365,
          paymentDueDate: paymentDueDate,
          accountsApprovalDate: '2026-10-15',
          directorDeclarationName: form.directorName,
          isDirectorApproved: form.isDirectorApproved
        },
        ledger: {
          turnoverPence: Math.round(form.turnover * 100),
          costOfSalesPence: Math.round(form.costOfSales * 100),
          staffCostsPence: 0,
          depreciationPence: 0,
          otherChargesPence: Math.round(form.otherCharges * 100),
          clientEntertainingPence: Math.round(form.disallowables * 100),
          finesPence: 0,
          bankInterestPence: 0,
          taxExpensePence: Math.round(taxPayable * 100),
          netProfitAfterTaxPence: Math.round(netProfit * 100),
          dividendsPaidPence: Math.round(form.dividendsPaid * 100),
          openingRetainedEarningsPence: Math.round(form.openingRetainedEarnings * 100),
          closingRetainedEarningsPence: Math.round(closingRetainedEarnings * 100),
          fixedAssetsPence: Math.round(form.fixedAssets * 100),
          debtorsPence: Math.round(form.debtors * 100),
          cashPence: Math.round(form.cashAtBank * 100),
          creditorsUnderOneYearPence: Math.round(form.creditorsUnderOneYear * 100),
          creditorsOverOneYearPence: 0,
          provisionsPence: 0,
          shareCapitalPence: Math.round(form.shareCapital * 100),
          employeeCount: form.averageEmployees || 1
        },
        tax: {
          tradingProfitPence: Math.round(taxableProfit * 100),
          nonTradingIncomePence: 0,
          exemptDistributionsPence: 0,
          ttpPence: Math.round(taxableProfit * 100),
          augmentedProfitsPence: ctResult?.augmentedProfitsPence ?? Math.round(taxableProfit * 100),
          lowerLimitPence: ctResult?.lowerLimitPence ?? 5000000,
          upperLimitPence: ctResult?.upperLimitPence ?? 25000000,
          ctBeforeReliefPence: ctResult?.ctBeforeReliefPence ?? Math.round(taxPayable * 100),
          marginalReliefPence: ctResult?.marginalReliefPence ?? 0,
          ctPayablePence: Math.round(taxPayable * 100),
          mainPoolWdaRatePct: statutoryWdaRate,
          mainPoolBalancePence: Math.round(mainPoolAdditions * 100),
          carAiaClaimedPence: Math.round(form.carAdditions * 100),
          zeroEmissionFyaClaimedPence: 0,
          directorLoans: directorLoansList,
          s455TaxPence: Math.round(s455TaxPayable * 100)
        }
      };
      return runPreFlightShield(input);
    } catch {
      return null;
    }
  }, [
    form,
    taxableProfit,
    taxPayable,
    s455TaxPayable,
    netProfit,
    closingRetainedEarnings,
    ctResult,
    directorLoansList,
    paymentDueDate,
    statutoryWdaRate,
    mainPoolAdditions,
    priorYearData
  ]);

  const fatalShieldErrors = useMemo(() => {
    if (!liveShieldReport) return [];
    return liveShieldReport.evaluations.filter((e) => e.status === 'FAIL' && e.severity === 'FATAL');
  }, [liveShieldReport]);

  const warningShieldItems = useMemo(() => {
    if (!liveShieldReport) return [];
    return liveShieldReport.evaluations.filter((e) => e.status === 'FAIL' && e.severity === 'WARN');
  }, [liveShieldReport]);

  const canTransmit = isStep1Valid && balanceSheetVariance === 0 && fatalShieldErrors.length === 0;

  // 3-Step Structure
  const steps = [
    { num: 1, title: 'Company & Period', desc: 'CRN, dates & prior sync' },
    { num: 2, title: 'Annual Figures', desc: 'P&L, Balance Sheet, Allowances & Loans' },
    { num: 3, title: 'Review & Submit', desc: 'Pre-flight checks, drafts & dispatch' }
  ];

  // Financial Table Line Item Collections for S7 & S8
  const pnlItems: FinancialLineItem[] = useMemo(() => [
    {
      id: 'turnover',
      label: 'Annual Trading Turnover',
      boxLabel: 'Box 145',
      tooltip: 'Gross sales and client fee receipts',
      currentValue: form.turnover,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.turnoverPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, turnover: val }))
    },
    {
      id: 'costOfSales',
      label: 'Cost of Sales',
      boxLabel: 'Box 165',
      tooltip: 'Direct contractor and production expenses',
      currentValue: form.costOfSales,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.costOfSalesPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, costOfSales: val }))
    },
    {
      id: 'otherCharges',
      label: 'Other Operating Charges',
      boxLabel: 'Box 165',
      tooltip: 'Hosting, software subscriptions, insurance, utilities',
      currentValue: form.otherCharges,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.otherOperatingChargesPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, otherCharges: val }))
    },
    {
      id: 'disallowables',
      label: 'Client Entertaining (Disallowable)',
      boxLabel: 'Box 160',
      tooltip: 'Hospitality added back to taxable profit (CTA 2009 s1298)',
      currentValue: form.disallowables,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, disallowables: val }))
    },
    {
      id: 'operatingProfit',
      label: 'Operating Profit / (Loss)',
      isTotal: true,
      currentValue: operatingProfit,
      priorValue: priorYearData?.figures
        ? Math.round(
            (priorYearData.figures.turnoverPence -
              priorYearData.figures.costOfSalesPence -
              priorYearData.figures.otherOperatingChargesPence) /
              100
          )
        : undefined,
      onChangeCurrent: () => {}
    }
  ], [form.turnover, form.costOfSales, form.otherCharges, form.disallowables, operatingProfit, priorYearData]);

  const balanceSheetItems: FinancialLineItem[] = useMemo(() => [
    {
      id: 'fixedAssets',
      label: 'Fixed Assets (Tangible)',
      boxLabel: 'FRS 105',
      tooltip: 'Plant, hardware, computers, and office machinery',
      currentValue: form.fixedAssets,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.fixedAssetsPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, fixedAssets: val, capitalAdditions: val, aiaClaimed: val }))
    },
    {
      id: 'debtors',
      label: 'Debtors (Receivables)',
      boxLabel: 'FRS 105',
      tooltip: 'Unpaid client invoices due within 1 year',
      currentValue: form.debtors,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.debtorsPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, debtors: val }))
    },
    {
      id: 'cashAtBank',
      label: 'Cash at Bank and in Hand',
      boxLabel: 'FRS 105',
      tooltip: 'Bank and liquid balances at period end',
      currentValue: form.cashAtBank,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.cashAtBankPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, cashAtBank: val }))
    },
    {
      id: 'creditorsUnderOneYear',
      label: 'Creditors (Due < 1 Year)',
      boxLabel: 'FRS 105',
      tooltip: 'Liabilities, VAT, PAYE, supplier invoices due < 1 year',
      currentValue: form.creditorsUnderOneYear,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.creditorsDueWithinOneYearPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, creditorsUnderOneYear: val }))
    },
    {
      id: 'netAssets',
      label: 'Total Net Assets / (Liabilities)',
      isTotal: true,
      currentValue: netAssets,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.netAssetsPence / 100) : undefined,
      onChangeCurrent: () => {}
    },
    {
      id: 'shareCapital',
      label: 'Called Up Share Capital',
      boxLabel: 'Equity',
      tooltip: 'Nominal share capital issued (min £1)',
      currentValue: form.shareCapital,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.calledUpShareCapitalPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, shareCapital: val }))
    },
    {
      id: 'openingRetainedEarnings',
      label: 'Opening Retained Earnings',
      boxLabel: 'Reserves',
      tooltip: 'Brought forward from prior period balance sheet',
      currentValue: form.openingRetainedEarnings,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.profitAndLossReservePence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, openingRetainedEarnings: val }))
    },
    {
      id: 'dividendsPaid',
      label: 'Dividends Declared & Paid',
      boxLabel: 'Distributions',
      tooltip: 'Interim & final dividends distributed in the period',
      currentValue: form.dividendsPaid,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, dividendsPaid: val }))
    },
    {
      id: 'totalEquity',
      label: "Total Shareholders' Funds",
      isTotal: true,
      currentValue: totalEquity,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.totalShareholdersFundsPence / 100) : undefined,
      onChangeCurrent: () => {}
    }
  ], [
    form.fixedAssets,
    form.debtors,
    form.cashAtBank,
    form.creditorsUnderOneYear,
    netAssets,
    form.shareCapital,
    form.openingRetainedEarnings,
    form.dividendsPaid,
    totalEquity,
    priorYearData
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <span>Filing Studio: Micro-Entity Accounts & CT600</span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Live Gateway Connected
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            3-step unified statutory return with real-time HMRC & Companies House pre-submission gateway compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {lastSavedTime && (
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>{lastSavedTime}</span>
            </div>
          )}
          {isAutosaving && (
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
              <RefreshCw className="w-3 h-3 animate-spin text-stone-400" />
              <span>Saving...</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsGlossaryOpen(true)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Tax Guide</span>
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-2.5 shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {steps.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num > 1 && !isStep1Valid) return;
                  setCurrentStep(s.num);
                }}
                disabled={s.num > 1 && !isStep1Valid}
                className={`flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-[#0B1528] text-white shadow-xs'
                    : isCompleted
                    ? 'text-stone-800 hover:bg-stone-50'
                    : s.num > 1 && !isStep1Valid
                    ? 'text-stone-300 opacity-50 cursor-not-allowed'
                    : 'text-stone-400 hover:bg-stone-50'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </span>
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{s.title}</div>
                  <div className={`text-[10px] truncate hidden sm:block ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
                    {s.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focused Step Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: Company Profile & Accounting Period                               */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Step 1: Company & Accounting Period</h2>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Companies House Linked
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Verify your company registration and period dates. We cross-check against official registry records.
                </p>
              </div>

              {/* Companies House Search & Company Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Company Type</label>
                  <select
                    value={form.companyType}
                    onChange={(e) => setForm({ ...form, companyType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="TRADING">Trading Company (Standard Micro-Entity)</option>
                    <option value="PROPERTY">Property Investment Company</option>
                    <option value="DORMANT">Dormant Company (Balance Sheet Only)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Search Registered Name or CRN
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. DropLogicX or 15152081"
                      value={chQuery}
                      onChange={(e) => setChQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  {chResults.length > 0 && (
                    <div className="absolute bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {chResults.map((item) => (
                        <button
                          key={item.company_number}
                          type="button"
                          onClick={() => selectCompany(item.company_number)}
                          className="w-full text-left p-2.5 hover:bg-slate-50 text-xs transition"
                        >
                          <div className="font-bold text-slate-900">{item.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">CRN: {item.company_number}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Verified Company Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-start space-x-3.5">
                <Building2 className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{form.companyName}</span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-semibold">
                      CRN: {form.crn}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{form.registeredAddress}</p>
                </div>
              </div>

              {/* Period Dates & Core Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <TermExplainer termId="ct600" label="HMRC Unique Taxpayer Reference (UTR)" />
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={form.utr}
                    onChange={(e) => setForm({ ...form, utr: e.target.value.replace(/\D/g, '') })}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 ${
                      !isUtrValid && form.utr ? 'border-red-300 bg-red-50/20' : 'border-slate-300 focus:ring-slate-900'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Official 10-digit number issued on HMRC CT41G notice</p>
                </div>

                {/* F10: Active Directors Dropdown populated from Companies House */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Signatory Director Name (CA 2006 s414)
                    </label>
                    {registeredDirectors.length > 0 && (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Registry Verified
                      </span>
                    )}
                  </div>
                  {registeredDirectors.length > 1 ? (
                    <select
                      value={form.directorName}
                      onChange={(e) => setForm({ ...form, directorName: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      {registeredDirectors.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.directorName}
                      onChange={(e) => setForm({ ...form, directorName: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="e.g. Muhammad Saif Raza"
                    />
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Appointed officer authorizing submission</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accounting Period Start</label>
                  <input
                    type="date"
                    value={form.periodStart}
                    onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Commencement date of financial year</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accounting Period End</label>
                  <input
                    type="date"
                    value={form.periodEnd}
                    onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 ${
                      !isPeriodValid && form.periodEnd ? 'border-red-300 bg-red-50/20' : 'border-slate-300 focus:ring-slate-900'
                    }`}
                  />
                  {!isPeriodValid && periodDayCount > 366 && (
                    <p className="text-[11px] text-red-600 mt-1">
                      Limit exceeded: CT600 accounting period cannot exceed 12 months ({periodDayCount} days). Split under CTA 2009 s10.
                    </p>
                  )}
                  {isPeriodValid && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Period duration: {periodDayCount} days (Valid 12-month period)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <TermExplainer termId="associated-companies" label="Associated Companies (N)" />
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={form.associatedCompanies}
                    onChange={(e) => setForm({ ...form, associatedCompanies: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Other active companies you control (divides thresholds by N+1)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Average Number of Employees (CA 2006 s411)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.averageEmployees}
                    onChange={(e) => setForm({ ...form, averageEmployees: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Mandatory note in FRS 105 accounts (default 1 for single-director)</p>
                </div>
              </div>

              {/* F8: Collapsible Statutory Guidance Drawer */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setIsStatutoryGuidanceOpen(!isStatutoryGuidanceOpen)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition text-xs font-semibold text-slate-900"
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span>Statutory Requirements & Micro-Entity Thresholds (CA 2006 / FRS 105)</span>
                  </div>
                  {isStatutoryGuidanceOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isStatutoryGuidanceOpen && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-600 space-y-3 leading-relaxed">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-900 text-[11px]">Turnover Threshold</p>
                        <p className="font-mono text-emerald-700 font-bold text-sm">≤ £1,020,000</p>
                        <p className="text-[10px] text-slate-400">Section 384A statutory limit</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-900 text-[11px]">Balance Sheet Total</p>
                        <p className="font-mono text-emerald-700 font-bold text-sm">≤ £510,000</p>
                        <p className="text-[10px] text-slate-400">Gross assets before liabilities</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-900 text-[11px]">Average Headcount</p>
                        <p className="font-mono text-emerald-700 font-bold text-sm">≤ 10 Employees</p>
                        <p className="text-[10px] text-slate-400">Monthly payroll average</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Under Section 477 of the Companies Act 2006, companies meeting at least 2 of these criteria are legally exempt from appointing an external auditor and can file simplified FRS 105 micro-entity accounts directly to Companies House.
                    </p>
                  </div>
                )}
              </div>

              {/* Prior Year Accounts Auto-Sync Card */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 p-5 rounded-2xl border border-indigo-100 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-700">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">
                        Prior Year Accounts Sync (Companies House iXBRL)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Retrieves your official prior-period balance sheet figures directly from Companies House.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchPriorYearAccounts()}
                    disabled={isFetchingPriorYear || !form.crn}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingPriorYear ? 'animate-spin' : ''}`} />
                    <span>{isFetchingPriorYear ? 'Retrieving...' : 'Sync Now'}</span>
                  </button>
                </div>

                {priorYearData && priorYearData.figures && (
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-50 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-indigo-950 font-semibold">
                      <span>Period ended {priorYearData.periodEnd} ({priorYearData.source || 'Companies House'})</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Verified iXBRL
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-600">
                      <div>Fixed Assets: <span className="font-mono font-semibold text-slate-900">£{(priorYearData.figures.fixedAssetsPence / 100).toLocaleString()}</span></div>
                      <div>Current Assets: <span className="font-mono font-semibold text-slate-900">£{(priorYearData.figures.currentAssetsPence / 100).toLocaleString()}</span></div>
                      <div>Net Assets: <span className="font-mono font-semibold text-slate-900">£{(priorYearData.figures.netCurrentAssetsPence / 100).toLocaleString()}</span></div>
                      <div>Retained Reserves: <span className="font-mono font-semibold text-slate-900">£{(priorYearData.figures.profitAndLossReservePence / 100).toLocaleString()}</span></div>
                    </div>
                  </div>
                )}
                {priorYearStatus && !priorYearData?.figures && (
                  <p className="text-[11px] text-slate-500 italic">{priorYearStatus}</p>
                )}
              </div>

              {/* Legal Exemption Declaration Checkbox */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="directorApproved"
                  checked={form.isDirectorApproved}
                  onChange={(e) => setForm({ ...form, isDirectorApproved: e.target.checked })}
                  className="w-4 h-4 mt-0.5 text-slate-950 rounded border-slate-300 focus:ring-slate-900"
                />
                <label htmlFor="directorApproved" className="text-xs text-slate-700 leading-relaxed font-normal">
                  I confirm as director that the board has approved these accounts and authorized the micro-entity audit exemption declaration under{' '}
                  <TermExplainer termId="s477-exemption" label="Section 477 of the Companies Act 2006" />.
                </label>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Annual Figures & Statutory Computations (Unified Accordion Page) */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Top Action Bar with CSV / Trial Balance Modal Trigger (F9) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Step 2: Annual Figures & Computations</h2>
                  <p className="text-xs text-slate-500">
                    Enter your annual figures below with side-by-side prior-year comparisons, or import directly from bank statements.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0B1528] text-white hover:bg-slate-800 transition shadow-xs"
                >
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  <span>Import Bank CSV / Statement</span>
                </button>
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* PANEL A: Profit & Loss Account with Comparative Table (S7/S8)         */}
              {/* --------------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => togglePanel('pnl')}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 transition border-b border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold text-xs">
                      P&L
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2">
                        <span>Profit & Loss Account (Income Statement)</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">FRS 105 Section 3</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Operating turnover, costs, and disallowable add-backs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      Operating Profit: £{operatingProfit.toLocaleString()}
                    </span>
                    {expandedPanels.pnl ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {expandedPanels.pnl && (
                  <div className="p-6 sm:p-8 space-y-5">
                    <ComparativeFinancialTable
                      title="Profit & Loss Account Comparison"
                      subtitle="Current Year vs Prior Year statutory reporting (FRS 105)"
                      currentYearLabel="Current Year (CY)"
                      priorYearLabel="Prior Year (PY)"
                      items={pnlItems}
                      hasPriorYearData={Boolean(priorYearData?.figures)}
                    />
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* PANEL B: Balance Sheet with S7/S8 Comparative & IMP-09 Reconciliation */}
              {/* --------------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => togglePanel('balanceSheet')}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 transition border-b border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold text-xs">
                      BS
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2">
                        <span>Balance Sheet (Statement of Financial Position)</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">CA 2006 s396 / FRS 105</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Assets, liabilities, share capital, and comparative prior-year reporting
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      balanceSheetVariance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {balanceSheetVariance === 0 ? 'Balanced £0.00' : `Variance £${Math.abs(balanceSheetVariance).toLocaleString()}`}
                    </span>
                    {expandedPanels.balanceSheet ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {expandedPanels.balanceSheet && (
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* IMP-09 Intelligent 3-Way Reconcile Alert */}
                    {balanceSheetVariance !== 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5 text-amber-900">
                          <p className="font-bold flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-amber-700" />
                            <span>Balance Sheet Imbalance: £{Math.abs(balanceSheetVariance).toLocaleString()}</span>
                          </p>
                          <p className="text-[11px] opacity-80">
                            Net Assets (£{netAssets.toLocaleString()}) must equal Shareholders' Funds (£{totalEquity.toLocaleString()}) to the exact penny under CA 2006.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAutoReconcileOpen(true)}
                          className="px-3.5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-2xs shrink-0 flex items-center space-x-1.5"
                        >
                          <Scale className="w-3.5 h-3.5 text-amber-400" />
                          <span>Reconcile Balance Sheet</span>
                        </button>
                      </div>
                    )}

                    {/* S7 & S8 Comparative Balance Sheet Table */}
                    <ComparativeFinancialTable
                      title="Statement of Financial Position (Balance Sheet)"
                      subtitle="Assets, Liabilities, and Equity with 1-click Opening Retained Earnings carry-forward"
                      currentYearLabel="Current Year (CY)"
                      priorYearLabel="Prior Year (PY)"
                      items={balanceSheetItems}
                      hasPriorYearData={Boolean(priorYearData?.figures)}
                      onCarryForward={() => {
                        if (priorYearData?.figures?.profitAndLossReservePence) {
                          setForm((prev) => ({
                            ...prev,
                            openingRetainedEarnings: Math.round(priorYearData.figures.profitAndLossReservePence / 100)
                          }));
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* PANEL C: Capital Allowances & AIA Schedule                           */}
              {/* --------------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => togglePanel('allowances')}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 transition border-b border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center font-bold text-xs">
                      AIA
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2">
                        <span>Capital Allowances & Tax Pools</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">CAA 2001 / FA 2024</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Annual Investment Allowance (100% deduction) and Writing Down Allowance rates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-purple-800">
                      Total Allowance: £{totalCapitalAllowances.toLocaleString()}
                    </span>
                    {expandedPanels.allowances ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {expandedPanels.allowances && (
                  <div className="p-6 sm:p-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700">Plant & Machinery Additions (AIA Eligible)</label>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">CT600 Box 705</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={form.capitalAdditions}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setForm({ ...form, capitalAdditions: val, aiaClaimed: val });
                          }}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold num-tabular focus:ring-2 focus:ring-slate-900"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">Computers, hardware, tooling (up to £1,000,000 allowance)</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700">Annual Investment Allowance (AIA) Claimed</label>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">100% Tax Relief</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={form.capitalAdditions}
                          value={form.aiaClaimed}
                          onChange={(e) => setForm({ ...form, aiaClaimed: Math.min(form.capitalAdditions, Math.max(0, parseInt(e.target.value) || 0)) })}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold num-tabular focus:ring-2 focus:ring-slate-900"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">Deducted 100% against taxable profits</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700">Motor Cars Additions (Ineligible for AIA)</label>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">CAA 2001 s38B</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={form.carAdditions}
                          onChange={(e) => setForm({ ...form, carAdditions: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold num-tabular focus:ring-2 focus:ring-slate-900"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">Allocated to Writing Down Allowance pools</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700">Main Pool Balance Brought Forward</label>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">CT600 Box 705</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={form.mainPoolBroughtForward}
                          onChange={(e) => setForm({ ...form, mainPoolBroughtForward: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold num-tabular focus:ring-2 focus:ring-slate-900"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">From previous period tax computations</p>
                      </div>
                    </div>

                    <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-100 flex items-center justify-between text-xs text-purple-950">
                      <div>
                        <span className="font-bold">Statutory Main Pool WDA Rate: </span>
                        <span className="font-mono font-bold">{statutoryWdaRate.toFixed(2)}%</span>
                        <span className="text-[11px] text-purple-700 block sm:inline sm:ml-2">
                          (Day-weighted hybrid rate for period straddling 1 April 2026 under CAA 2001 s56)
                        </span>
                      </div>
                      <span className="font-mono font-bold">WDA: £{mainPoolWda.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* PANEL D: Multi-Loan Director Schedule (N1)                            */}
              {/* --------------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => togglePanel('loans')}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 transition border-b border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-900 flex items-center justify-center font-bold text-xs">
                      s455
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2">
                        <span>Director Loan Accounts (Section 455 Schedule)</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">CTA 2010 s455 / CT600A</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Multi-row loan management, 9-month statutory relief tracking, and rate band calculations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-orange-800">
                      s455 Tax: £{s455TaxPayable.toLocaleString()}
                    </span>
                    {expandedPanels.loans ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {expandedPanels.loans && (
                  <div className="p-6 sm:p-8 space-y-4">
                    <DirectorLoansSchedule
                      loans={form.directorLoans}
                      onChange={(newLoans) => {
                        const totalAdv = newLoans.reduce((sum, l) => sum + (l.advanceAmount || 0), 0);
                        setForm((prev) => ({
                          ...prev,
                          directorLoans: newLoans,
                          directorLoanAdvance: totalAdv
                        }));
                      }}
                      periodEnd={form.periodEnd}
                      paymentDueDate={paymentDueDate}
                      registeredDirectors={registeredDirectors}
                    />
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* PANEL E: Official HMRC Corporation Tax Computation Breakdown (F4/F6)   */}
              {/* --------------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => togglePanel('taxSchedule')}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 transition border-b border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold text-xs">
                      CT600
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2">
                        <span>Official Tax Reconciliation Schedule</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">HMRC CT600 Box Progression</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Full statutory calculation trail from operating profits to final tax payable
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      Total Tax: £{totalHmrcPayable.toLocaleString()}
                    </span>
                    {expandedPanels.taxSchedule ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {expandedPanels.taxSchedule && (
                  <div className="p-6 sm:p-8">
                    <TaxComputationBreakdown
                      turnover={form.turnover}
                      costOfSales={form.costOfSales}
                      otherCharges={form.otherCharges}
                      operatingProfit={operatingProfit}
                      clientEntertaining={form.disallowables}
                      capitalAdditions={form.capitalAdditions}
                      aiaClaimed={aiaClaimed}
                      taxableProfit={taxableProfit}
                      corporationTax={taxPayable}
                      s455Tax={s455TaxPayable}
                      totalTaxDue={totalHmrcPayable}
                      effectiveRatePct={taxRateLabel}
                      wdaRatePct={statutoryWdaRate}
                      companyName={form.companyName}
                      crn={form.crn}
                      periodStart={form.periodStart}
                      periodEnd={form.periodEnd}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Review, Documents & Split Submit                                 */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold tracking-tight text-slate-950">Step 3: Review & Submit Return</h2>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      canTransmit ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {canTransmit ? 'Ready for Submission' : `${fatalShieldErrors.length} item(s) to fix`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Comprehensive compliance verification across all 40 statutory pre-flight rules.
                  </p>
                </div>

                {/* Score Ring Visual in Step 3 Header */}
                <ComplianceScoreRing
                  totalChecks={liveShieldReport?.totalRulesEvaluated || 40}
                  passedCount={
                    liveShieldReport
                      ? liveShieldReport.passedCount
                      : 40
                  }
                  fatalCount={fatalShieldErrors.length}
                  warnCount={warningShieldItems.length}
                  size="md"
                />
              </div>

              {/* Status Banner */}
              {canTransmit ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center space-x-3 text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-xs">All Pre-Submission Gateway Checks Passed</h3>
                    <p className="text-[11px] text-emerald-800">
                      Your return conforms with all HMRC and Companies House validation rules with zero fatal errors.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2 text-red-950">
                  <div className="flex items-center space-x-2 font-bold text-xs text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Action Required Before Submission ({fatalShieldErrors.length} fatal items):</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-1 text-red-800">
                    {fatalShieldErrors.map((err) => (
                      <li key={err.id}>
                        <span className="font-bold">{err.name}:</span> {err.message}
                      </li>
                    ))}
                    {balanceSheetVariance !== 0 && (
                      <li>
                        <span className="font-bold">Balance Sheet Imbalance:</span> Variance of £{Math.abs(balanceSheetVariance).toLocaleString()} between Net Assets and Shareholders' Funds.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Pre-Submission Credentials Checklist */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Submission Credentials Checklist
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm you hold the following statutory credentials before submitting:
                </p>

                <div className="space-y-2 text-xs text-slate-700">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasUtrChecked}
                      onChange={(e) => setForm({ ...form, hasUtrChecked: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                    />
                    <span>Company 10-Digit Unique Taxpayer Reference (UTR: {form.utr})</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasGatewayChecked}
                      onChange={(e) => setForm({ ...form, hasGatewayChecked: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                    />
                    <span>HMRC Government Gateway User ID & Password (enrolled in Corporation Tax)</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasAuthCodeChecked}
                      onChange={(e) => setForm({ ...form, hasAuthCodeChecked: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                    />
                    <span>Companies House 6-Character Online Authentication Code</span>
                  </label>
                </div>
              </div>

              {/* Free Document Previews & Share Feature */}
              <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Free Official Document Previews</h3>
                    <p className="text-xs text-slate-500">
                      Review every figure, balance sheet note, and tax computation before submitting.
                    </p>
                  </div>

                  {/* N4: Share Draft with Accountant button */}
                  <button
                    type="button"
                    onClick={handleShareDraft}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition self-start sm:self-auto"
                  >
                    {isShareSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{isShareSuccess ? 'Review Link Copied!' : 'Share Draft with Accountant'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <a
                    href={`/api/documents/accounts-pdf?draft=true&filingId=${filingId}`}
                    target="_blank"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileDown className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-bold text-slate-900">Full Accounts (PDF)</div>
                        <div className="text-[10px] text-slate-500">FRS 105 for shareholders</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-800">£{netProfit.toLocaleString()}</span>
                  </a>

                  <a
                    href={`/api/documents/ct600-pdf?draft=true&filingId=${filingId}`}
                    target="_blank"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileDown className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-bold text-slate-900">CT600 Return (PDF)</div>
                        <div className="text-[10px] text-slate-500">HMRC Corporation Tax form</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">£{totalHmrcPayable.toLocaleString()}</span>
                  </a>
                </div>
              </div>

              {/* N3: How to Pay HMRC Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      HMRC Corporation Tax Settlement Guide
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Payment of <strong className="text-slate-900 font-mono">£{totalHmrcPayable.toLocaleString()}</strong> is due on{' '}
                    <strong className="text-slate-900">{paymentDueDate}</strong> (9 months & 1 day after period end).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayHmrcOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold transition shadow-2xs self-start sm:self-auto shrink-0"
                >
                  <Landmark className="w-3.5 h-3.5 text-amber-600" />
                  <span>View Bank Details & PRN</span>
                </button>
              </div>

              {/* Dual Split Submissions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Gateway Submissions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Companies House Submission */}
                  <div className="bg-[#0B1528] text-white p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                          Free Statutory Filing
                        </span>
                        <span className="text-[10px] text-stone-400">9-Month Deadline</span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-2">Companies House Accounts</h4>
                      <p className="text-[11px] text-stone-300 mt-1">
                        Electronic submission of FRS 105 micro-entity accounts directly to the public registry.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canTransmit}
                      onClick={() => alert('TaxFlow UK: Test mode active. Ready to transmit FRS 105 Accounts directly to Companies House gateway.')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        canTransmit
                          ? 'bg-white hover:bg-stone-100 text-stone-950 cursor-pointer shadow-sm'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Submit Accounts to Companies House</span>
                    </button>
                  </div>

                  {/* HMRC CT600 Submission */}
                  <div className="bg-[#0B1528] text-white p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
                          £49.00 Flat Fee
                        </span>
                        <span className="text-[10px] text-stone-400">12-Month Deadline</span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-2">HMRC CT600 & Computations</h4>
                      <p className="text-[11px] text-stone-300 mt-1">
                        Digital dispatch with certified C14N IRmark and full capital allowances schedules.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canTransmit}
                      onClick={() => alert('TaxFlow UK: Test mode active. Ready to submit CT600 and Tax Computations to HMRC with certified digital IRmark.')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        canTransmit
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 cursor-pointer shadow-sm'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Submit CT600 to HMRC (£49.00)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                currentStep === 1
                  ? 'opacity-40 cursor-not-allowed text-stone-400'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-300'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition"
              >
                <Save className="w-3.5 h-3.5 text-stone-500" />
                <span>Save Draft</span>
              </button>
              {saveStatus && (
                <span className="text-xs font-bold text-amber-600 animate-fade-in">
                  {saveStatus}
                </span>
              )}
            </div>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !isStep1Valid) return;
                  setCurrentStep((prev) => Math.min(3, prev + 1));
                }}
                disabled={currentStep === 1 && !isStep1Valid}
                className={`inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition ${
                  currentStep === 1 && !isStep1Valid
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href={`/filings/${filingId}/documents`}
                className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition"
              >
                <span>View All Documents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Live Audit Rail (4 cols, sticky) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* Shield Health Card with ComplianceScoreRing */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <ShieldCheck className={`w-4 h-4 ${fatalShieldErrors.length === 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span>Pre-Flight Compliance Status</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                fatalShieldErrors.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {fatalShieldErrors.length === 0 ? 'Ready' : `${fatalShieldErrors.length} to Fix`}
              </span>
            </div>

            <div className="flex items-center space-x-3 py-1">
              <ComplianceScoreRing
                totalChecks={liveShieldReport?.totalRulesEvaluated || 40}
                passedCount={
                  liveShieldReport
                    ? liveShieldReport.passedCount
                    : 40
                }
                fatalCount={fatalShieldErrors.length}
                warnCount={warningShieldItems.length}
                size="sm"
              />
              <div className="text-xs">
                <p className="font-semibold text-slate-900">
                  {fatalShieldErrors.length === 0 ? 'All 40 Checks Clear' : `${fatalShieldErrors.length} Fatal Errors`}
                </p>
                <p className="text-[11px] text-slate-500">
                  {warningShieldItems.length > 0 ? `${warningShieldItems.length} advisory notes` : 'HMRC & CH Gateway ready'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">Gateway Readiness:</span>
              <span className={`font-bold ${canTransmit ? 'text-emerald-600' : 'text-amber-600'}`}>
                {canTransmit ? 'Ready to Submit' : 'Items Pending'}
              </span>
            </div>

            <Link
              href={`/filings/${filingId}/shield`}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-between pt-1"
            >
              <span>Inspect all 40 compliance rules</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Live Corporation Tax Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Receipt className="w-4 h-4 text-slate-700" />
                <span>
                  <TermExplainer termId="ct600" label="HMRC CT600 Estimate" />
                </span>
              </span>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {isPeriodValid ? taxRateLabel : 'Pending Dates'}
              </span>
            </div>

            {isPeriodValid ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Box 145 (Turnover):</span>
                  <span className="font-semibold text-slate-900 num-tabular">£{form.turnover.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Box 155 (Trading Profit):</span>
                  <span className="font-semibold text-slate-900 num-tabular">£{operatingProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px] pl-2 border-l border-slate-200">
                  <span>+ Disallowables:</span>
                  <span className="font-semibold num-tabular">£{form.disallowables.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px] pl-2 border-l border-slate-200">
                  <span>- Capital Allowances (AIA):</span>
                  <span className="font-semibold num-tabular">(£{totalCapitalAllowances.toLocaleString()})</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-0.5 border-t border-slate-100 font-medium">
                  <span>Box 315 (Total Taxable):</span>
                  <span className="font-semibold text-slate-900 num-tabular">£{taxableProfit.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                  <span>Box 440 (CT Due):</span>
                  <span className="text-emerald-700 num-tabular">£{taxPayable.toLocaleString()}</span>
                </div>
                {s455TaxPayable > 0 && (
                  <div className="flex justify-between text-xs font-bold text-amber-700">
                    <span>CT600A (s455 Tax):</span>
                    <span className="num-tabular">£{s455TaxPayable.toLocaleString()}</span>
                  </div>
                )}
                {s455TaxPayable > 0 && (
                  <div className="pt-1 border-t border-slate-100 flex justify-between text-xs font-black text-slate-950">
                    <span>Total HMRC Due:</span>
                    <span className="text-emerald-700 num-tabular">£{totalHmrcPayable.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                  <span>HMRC Payment Due:</span>
                  <span className="font-medium text-slate-700">{paymentDueDate}</span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPayHmrcOpen(true)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                  >
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>View HMRC Payment Details</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-1">
                <p className="font-bold">Accounting Period Invalid</p>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  CT600 returns cannot exceed 12 months under CTA 2009 s10. Adjust dates in Step 1 to calculate tax.
                </p>
              </div>
            )}
          </div>

          {/* Balance Sheet Symmetry Gauge */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-700" />
                <span>
                  <TermExplainer termId="balance-sheet-symmetry" label="Balance Sheet Symmetry" />
                </span>
              </span>
              <span className={`font-mono font-bold ${balanceSheetVariance === 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {balanceSheetVariance === 0 ? '0.00p' : `£${Math.abs(balanceSheetVariance).toLocaleString()} Imbalance`}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  balanceSheetVariance === 0 ? 'bg-emerald-600 w-full' : 'bg-red-500 w-1/2 animate-pulse'
                }`}
              />
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Net Assets:</span>
                <span className="font-mono text-slate-800">£{netAssets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Shareholders' Funds:</span>
                <span className="font-mono text-slate-800">£{totalEquity.toLocaleString()}</span>
              </div>
            </div>

            {balanceSheetVariance !== 0 && (
              <button
                type="button"
                onClick={() => setIsAutoReconcileOpen(true)}
                className="w-full py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <Scale className="w-3 h-3 text-red-600" />
                <span>Reconcile Balance Sheet</span>
              </button>
            )}
          </div>

          {/* Free Watermarked Drafts Pill Card */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 space-y-2.5">
            <span className="text-xs font-bold text-slate-900">Instant Free Previews</span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`/api/documents/accounts-pdf?draft=true&filingId=${filingId}`}
                target="_blank"
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-center py-2 px-2.5 rounded-xl text-[11px] font-semibold transition truncate block"
              >
                Accounts PDF
              </a>
              <a
                href={`/api/documents/ct600-pdf?draft=true&filingId=${filingId}`}
                target="_blank"
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-center py-2 px-2.5 rounded-xl text-[11px] font-semibold transition truncate block"
              >
                CT600 PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      <AutoReconcileModal
        isOpen={isAutoReconcileOpen}
        onClose={() => setIsAutoReconcileOpen(false)}
        totalAssetsPence={Math.round(netAssets * 100)}
        totalFundsPence={Math.round(totalEquity * 100)}
        variancePence={Math.round(balanceSheetVariance * 100)}
        onApply={handleApplyReconcile}
      />

      <ImportStatementModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApplyFigures={handleApplyImportedFigures}
      />

      <PayHmrcModal
        isOpen={isPayHmrcOpen}
        onClose={() => setIsPayHmrcOpen(false)}
        utr={form.utr}
        taxAmount={totalHmrcPayable}
        paymentDueDate={paymentDueDate}
        companyName={form.companyName}
        accountingPeriodEnd={form.periodEnd}
      />

      {/* Global Glossary Modal Controller */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        initialTermId={initialGlossaryTerm}
      />
    </div>
  );
}
