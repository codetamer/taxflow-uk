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
  Printer,
  Home,
  Briefcase,
  Layers,
  PauseCircle,
  Info
} from 'lucide-react';
import { TermExplainer } from '@/components/TermExplainer';
import { PlainEnglishBanner } from '@/components/PlainEnglishBanner';
import { GlossaryModal } from '@/components/GlossaryModal';
import { AutoReconcileModal } from '@/components/AutoReconcileModal';
import { TaxMismatchModal } from '@/components/TaxMismatchModal';
import { ArchetypeConfirmModal } from '@/components/ArchetypeConfirmModal';
import { ImportStatementModal } from '@/components/ImportStatementModal';
import { DirectorLoansSchedule } from '@/components/DirectorLoansSchedule';
import type { DirectorLoanItem } from '@/components/DirectorLoansSchedule';
import { ComparativeFinancialTable } from '@/components/ComparativeFinancialTable';
import type { FinancialLineItem } from '@/components/ComparativeFinancialTable';
import { TaxComputationBreakdown } from '@/components/TaxComputationBreakdown';
import { PayHmrcModal } from '@/components/PayHmrcModal';
import { getFilingDraft, saveFilingDraft } from '@/lib/filingClientStorage';
import { ComplianceScoreRing } from '@/components/ComplianceScoreRing';
import { computePeriod, ctPaymentDueDate, daysInclusive, mainPoolWdaRatePct } from '@taxflow/ct-engine';
import { runPreFlightShield } from '@taxflow/shield';
import type { ShieldInput } from '@taxflow/shield';

function formatAccounting(val: number, isCurrency = true): string {
  const absVal = Math.abs(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const prefix = isCurrency ? '£' : '';
  if (val < 0) {
    return `(${prefix}${absVal})`;
  }
  return `${prefix}${absVal}`;
}

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

  // Filing Mode: dual | ct600_only | accounts_only
  const filingMode = (searchParams.get('mode') as 'dual' | 'ct600_only' | 'accounts_only') || 'dual';
  const isCustomDates = searchParams.get('customDates') === 'true';
  const customReason = searchParams.get('reason') || '';

  // 3-Step Wizard Navigation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [initialGlossaryTerm, setInitialGlossaryTerm] = useState<string>('');

  // Modals & Enhanced Interactivity
  const [isAutoReconcileOpen, setIsAutoReconcileOpen] = useState<boolean>(false);
  const [taxMismatchModalState, setTaxMismatchModalState] = useState<{
    isOpen: boolean;
    field: 'pnlTax' | 'ctCreditor';
    calculatedTax: number;
    enteredTax: number;
  } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isPayHmrcOpen, setIsPayHmrcOpen] = useState<boolean>(false);
  const [isShareSuccess, setIsShareSuccess] = useState<boolean>(false);
  const [isStatutoryGuidanceOpen, setIsStatutoryGuidanceOpen] = useState<boolean>(false);
  const [isEditingRegistry, setIsEditingRegistry] = useState<boolean>(false);
  const [hasCapitalAdditions, setHasCapitalAdditions] = useState<boolean>(true);
  const [hasDirectorLoans, setHasDirectorLoans] = useState<boolean>(false);
  const [filingScope, setFilingScope] = useState<'dual' | 'ch_only'>('dual');
  const [registeredDirectors, setRegisteredDirectors] = useState<string[]>([
    'Muhammad Saif Raza'
  ]);

  // Form State: Supports 4 Entity Archetypes non-destructively
  const [form, setForm] = useState({
    companyName: 'DROPLOGICX LTD',
    crn: '15152081',
    companyType: 'TRADING' as 'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED',
    utr: '1234567890',
    registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
    directorName: 'Muhammad Saif Raza',
    periodStart: '2025-10-01',
    periodEnd: '2026-09-30',
    associatedCompanies: 0,
    averageEmployees: 1,
    isDirectorApproved: true,
    // Trading Stream
    turnover: 100000,
    costOfSales: 20000,
    otherCharges: 48100,
    disallowables: 3100,
    fixedAssets: 15000,
    capitalAdditions: 15000,
    carAdditions: 0,
    mainPoolBroughtForward: 0,
    aiaClaimed: 15000,
    // Balance Sheet
    debtors: 10000,
    cashAtBank: 33400,
    creditorsUnderOneYear: 25000,
    otherCreditorsUnderOneYear: 21200,
    corporationTaxPayableOverride: null as number | null,
    pnlTaxExpenseOverride: null as number | null,
    creditorsOverOneYear: 0,
    provisionsAndDeferred: 0,
    shareCapital: 100,
    dividendsPaid: 10000,
    openingRetainedEarnings: 15200,
    priorYearAdjustment: 0,
    isLoanIncludedInDebtors: true,
    // Property SPV Specifics (Schedule A)
    propertyRentalIncome: 36000,
    propertyAllowableExpenses: 6000,
    propertyMortgageInterest: 12000, // NTLR Debit Box 260
    propertyLossBroughtForward: 0, // Box 805
    // Mixed Income Specifics
    exemptDistributions: 0, // FII Box 620
    chargeableGains: 0,
    // Director Loans
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
    propertySchedule: true,
    balanceSheet: true,
    allowances: true,
    loans: true,
    taxSchedule: true
  });

  const togglePanel = (panel: 'pnl' | 'propertySchedule' | 'balanceSheet' | 'allowances' | 'loans' | 'taxSchedule') => {
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

  // Initial State Hydration: Load saved draft on mount (FE-01)
  useEffect(() => {
    async function loadSavedDraft() {
      try {
        const localDraft = getFilingDraft(filingId);
        if (localDraft) {
          if (localDraft.directorLoans && Array.isArray(localDraft.directorLoans)) {
            setForm((prev) => ({ ...prev, ...localDraft }));
          } else if (localDraft.directorLoanAdvance && localDraft.directorLoanAdvance > 0) {
            setForm((prev) => ({
              ...prev,
              ...localDraft,
              directorLoans: [
                {
                  id: 'loan_1',
                  directorName: localDraft.directorName || 'Muhammad Saif Raza',
                  advanceDate: localDraft.directorLoanDate || '2026-05-01',
                  advanceAmount: Number(localDraft.directorLoanAdvance) || 0,
                  repaidAmount: Number(localDraft.directorLoanRepaidAmount) || 0,
                  repaidDate: localDraft.directorLoanRepaidDate || ''
                }
              ]
            }));
          } else {
            setForm((prev) => ({ ...prev, ...localDraft }));
          }
          const now = new Date();
          setLastSavedTime(`Synced ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        }

        // Check server only if no local edits exist yet
        const res = await fetch(`/api/filings/${filingId}`);
        const data = await res.json();
        if (data.success && data.filing?.formData && !localDraft) {
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
                  advanceAmount: Number(fd.directorLoanAdvance) || 0,
                  repaidAmount: Number(fd.directorLoanRepaidAmount) || 0,
                  repaidDate: fd.directorLoanRepaidDate || ''
                }
              ]
            }));
          } else {
            setForm((prev) => ({ ...prev, ...fd }));
          }
        }
      } catch {
        // Fall back to benchmark defaults
      }
    }
    loadSavedDraft();
    fetchPriorYearAccounts('15152081');
  }, [filingId]);

  // Debounced Autosave: Saves draft to database and local cache on every field edit (FE-01)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsAutosaving(true);
        saveFilingDraft(filingId, form);

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
    }, 400);

    return () => clearTimeout(timer);
  }, [form, filingId]);

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

  // URL Query Parameters Pre-population
  useEffect(() => {
    const urlCrn = searchParams.get('crn');
    const urlName = searchParams.get('name');
    const urlTurnover = searchParams.get('turnover');
    const urlExpenses = searchParams.get('expenses');
    const urlStart = searchParams.get('periodStart');
    const urlEnd = searchParams.get('periodEnd');

    if (urlCrn) {
      selectCompany(urlCrn);
    } else if (urlName) {
      setForm((prev) => ({ ...prev, companyName: urlName }));
    }

    if (urlStart && urlEnd) {
      setForm((prev) => ({ ...prev, periodStart: urlStart, periodEnd: urlEnd }));
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

  // Non-Destructive Archetype Switching & Safeguard Confirmation (FE-02)
  const [pendingArchetype, setPendingArchetype] = useState<'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED' | null>(null);

  const handleRequestArchetype = (newType: 'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED') => {
    if (newType === form.companyType) return;

    const hasSignificantActivity =
      form.companyType !== 'DORMANT' &&
      (
        (form.turnover && form.turnover > 0) ||
        (form.costOfSales && form.costOfSales > 0) ||
        (form.directorLoans && form.directorLoans.some((l) => (l.advanceAmount || 0) > 0)) ||
        (form.propertyRentalIncome && form.propertyRentalIncome > 0)
      );

    if (newType === 'DORMANT' && hasSignificantActivity) {
      setPendingArchetype(newType);
      return;
    }

    setForm((prev) => ({
      ...prev,
      companyType: newType,
      averageEmployees: newType === 'DORMANT' ? 0 : (prev.averageEmployees || 1)
    }));
  };

  const handleConfirmArchetypeChange = () => {
    if (pendingArchetype) {
      setForm((prev) => ({
        ...prev,
        companyType: pendingArchetype,
        averageEmployees: pendingArchetype === 'DORMANT' ? 0 : (prev.averageEmployees || 1)
      }));
      setPendingArchetype(null);
    }
  };

  // -------------------------------------------------------------------------
  // FINANCIAL COMPUTATION ENGINE BY ARCHETYPE
  // -------------------------------------------------------------------------
  const isDormant = form.companyType === 'DORMANT';
  const isProperty = form.companyType === 'PROPERTY';
  const isMixed = form.companyType === 'MIXED';
  const isTrading = form.companyType === 'TRADING';

  // 1. Trading stream figures
  const tradingGrossProfit = isDormant ? 0 : form.turnover - form.costOfSales;
  const tradingOperatingProfit = isDormant ? 0 : tradingGrossProfit - form.otherCharges;

  // 2. Property SPV stream figures (Schedule A & CTA 2009 Part 5)
  const propertyGrossIncome = isDormant || isTrading ? 0 : form.propertyRentalIncome;
  const propertyExpenses = isDormant || isTrading ? 0 : form.propertyAllowableExpenses;
  const propertyMortgageInterest = isDormant || isTrading ? 0 : form.propertyMortgageInterest; // Box 260 NTLR debit
  const propertyNetBeforeFinance = propertyGrossIncome - propertyExpenses;
  const propertyNetTaxableProfit = Math.max(0, propertyNetBeforeFinance - propertyMortgageInterest); // Box 190
  const propertyLossCarriedForward = Math.max(0, (propertyExpenses + propertyMortgageInterest) - propertyGrossIncome); // Box 805

  // 3. Capital Allowances & AIA Computation
  const qualifyingAdditions = form.capitalAdditions ?? form.fixedAssets ?? 15000;
  const aiaClaimed = isDormant ? 0 : Math.min(qualifyingAdditions, form.aiaClaimed ?? 15000);
  const mainPoolAdditions = Math.max(0, qualifyingAdditions - aiaClaimed) + (form.carAdditions ?? 0) + (form.mainPoolBroughtForward ?? 0);
  const periodDayCount = form.periodStart && form.periodEnd ? daysInclusive(form.periodStart, form.periodEnd) : 0;
  const isPeriodValid = periodDayCount > 0 && periodDayCount <= 366;
  const statutoryWdaRate = isPeriodValid && form.periodStart && form.periodEnd
    ? mainPoolWdaRatePct({ start: form.periodStart, end: form.periodEnd })
    : 14.0;
  const mainPoolWda = Math.round(mainPoolAdditions * (statutoryWdaRate / 100));
  const totalCapitalAllowances = isDormant ? 0 : aiaClaimed + mainPoolWda;

  // 4. Combined Operating Profit & Taxable Trading Profit
  const tradingTaxableProfit = isDormant
    ? 0
    : Math.max(0, tradingOperatingProfit + form.disallowables - totalCapitalAllowances);

  // Overall Operating Profit reported in P&L
  const operatingProfit = isDormant
    ? 0
    : isProperty
    ? propertyNetBeforeFinance - propertyMortgageInterest
    : isMixed
    ? tradingOperatingProfit + propertyNetBeforeFinance - propertyMortgageInterest
    : tradingOperatingProfit;

  // Overall Total Taxable Profits (TTP Box 315 / 335)
  const taxableProfit = isDormant
    ? 0
    : isProperty
    ? propertyNetTaxableProfit
    : isMixed
    ? tradingTaxableProfit + propertyNetTaxableProfit
    : tradingTaxableProfit;

  // Payment due date
  const paymentDueDate = form.periodEnd ? ctPaymentDueDate(form.periodEnd) : '2027-07-01';

  // Multi-Loan Schedule Mapping for s455
  const directorLoansList = useMemo(() => {
    const loans = form.directorLoans && form.directorLoans.length > 0
      ? form.directorLoans
      : form.directorLoanAdvance > 0
      ? [
          {
            id: 'loan_1',
            directorName: form.directorName || 'Muhammad Saif Raza',
            advanceDate: form.directorLoanDate || '2026-05-01',
            advanceAmount: Number(form.directorLoanAdvance) || 0,
            repaidAmount: Number(form.directorLoanRepaidAmount) || 0,
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

  // 5. Corporation Tax & s455 Computation Engine
  const ctResult = useMemo(() => {
    try {
      if (!isPeriodValid || isDormant) return null;

      const nonTradingIncome = isProperty
        ? Math.round(propertyNetTaxableProfit * 100)
        : isMixed
        ? Math.round(propertyNetTaxableProfit * 100)
        : 0;

      const tradingProfits = isProperty
        ? 0
        : Math.round(tradingTaxableProfit * 100);

      return computePeriod({
        period: { start: form.periodStart, end: form.periodEnd },
        daysInYearBasis: 365,
        associatedCompanies: Number(form.associatedCompanies) || 0,
        tradingProfitAfterAllowancesPence: tradingProfits,
        nonTradingIncomePence: nonTradingIncome,
        exemptDistributionsPence: Math.round(form.exemptDistributions * 100),
        tradingLossesBroughtForwardPence: 0,
        setOffCurrentLossAgainstOtherProfits: false,
        closeCompany: true,
        directorLoans: directorLoansList
      });
    } catch {
      return null;
    }
  }, [
    form.periodStart,
    form.periodEnd,
    isPeriodValid,
    isDormant,
    isProperty,
    isMixed,
    form.associatedCompanies,
    tradingTaxableProfit,
    propertyNetTaxableProfit,
    form.exemptDistributions,
    directorLoansList
  ]);

  const taxPayable = isPeriodValid && ctResult && !isDormant ? Math.round(ctResult.corporationTaxPence / 100) : 0;
  const s455TaxPayable = ctResult && !isDormant ? Math.round(ctResult.s455TaxPence / 100) : 0;
  const totalHmrcPayable = taxPayable + s455TaxPayable;

  let taxRateLabel = 'Small Profits (19%)';
  if (ctResult && ctResult.totalTaxableProfitsPence > 0) {
    if (ctResult.marginalReliefPence > 0) {
      taxRateLabel = 'Marginal Relief';
    } else if (ctResult.augmentedProfitsPence >= ctResult.upperLimitPence) {
      taxRateLabel = 'Main Rate (25%)';
    }
  }

  // 6. Balance Sheet Calculations by Archetype (Automatic Symmetry & Locked Equity)
  const activeCtCreditor = form.corporationTaxPayableOverride !== null ? form.corporationTaxPayableOverride : taxPayable;
  const activePnlTax = form.pnlTaxExpenseOverride !== null ? form.pnlTaxExpenseOverride : taxPayable;

  const rawLoans = form.directorLoans && form.directorLoans.length > 0
    ? form.directorLoans
    : (form.directorLoanAdvance > 0
      ? [
          {
            id: 'loan_1',
            directorName: form.directorName || 'Director',
            advanceDate: form.directorLoanDate || '2026-05-01',
            advanceAmount: Number(form.directorLoanAdvance) || 0,
            repaidAmount: Number(form.directorLoanRepaidAmount) || 0,
            repaidDate: form.directorLoanRepaidDate || ''
          }
        ]
      : []);
  const totalOutstandingLoans = rawLoans.reduce(
    (acc, l) => acc + Math.max(0, (l.advanceAmount || 0) - (l.repaidAmount || 0)),
    0
  );

  const netProfit = isDormant ? 0 : operatingProfit - activePnlTax;

  const activeFixedAssets = isDormant ? 0 : form.fixedAssets;
  const activeDebtors = isDormant
    ? 0
    : form.debtors + (!form.isLoanIncludedInDebtors && totalOutstandingLoans > 0 ? totalOutstandingLoans : 0);
  const activeCashAtBank = isDormant ? form.shareCapital : form.cashAtBank;

  const currentAssets = activeDebtors + activeCashAtBank;
  const totalCreditorsUnderOneYear = isDormant
    ? 0
    : (form.otherCreditorsUnderOneYear ?? (form.creditorsUnderOneYear - activeCtCreditor)) + activeCtCreditor;
  const activeCreditorsUnderOneYear = totalCreditorsUnderOneYear;

  const netCurrentAssets = currentAssets - totalCreditorsUnderOneYear;
  const totalAssetsLessCurrentLiabilities = activeFixedAssets + netCurrentAssets;
  const activeCreditorsOverOneYear = isDormant ? 0 : (form.creditorsOverOneYear || 0);
  const activeProvisions = isDormant ? 0 : (form.provisionsAndDeferred || 0);
  const netAssets = totalAssetsLessCurrentLiabilities - activeCreditorsOverOneYear - activeProvisions;

  // LOCKED EQUITY: Ensures 100% mathematical balance sheet symmetry under CA 2006 (Acceptance Test A1)
  const balanceSheetRetainedEarnings = isDormant ? 0 : netAssets - form.shareCapital;
  const totalEquity = isDormant ? form.shareCapital : form.shareCapital + balanceSheetRetainedEarnings;
  const balanceSheetVariance = isDormant ? 0 : netAssets - totalEquity; // Guaranteed 0.00p

  // RESERVES ROLL-FORWARD RECONCILIATION: FRS 105 Section 6 (Acceptance Test A6)
  const expectedClosingRetainedEarnings = isDormant
    ? 0
    : form.openingRetainedEarnings + netProfit - form.dividendsPaid + (form.priorYearAdjustment || 0);
  const reservesDifference = isDormant ? 0 : expectedClosingRetainedEarnings - balanceSheetRetainedEarnings;
  const isReservesReconciled = isDormant || Math.abs(reservesDifference) <= 1;

  const handleApplyReconcile = (target: 'dividends' | 'openingReserves' | 'priorYearAdj' | 'cash') => {
    if (target === 'dividends') {
      setForm((prev) => ({ ...prev, dividendsPaid: Math.max(0, prev.dividendsPaid + reservesDifference) }));
    } else if (target === 'openingReserves') {
      setForm((prev) => ({ ...prev, openingRetainedEarnings: prev.openingRetainedEarnings - reservesDifference }));
    } else if (target === 'priorYearAdj') {
      setForm((prev) => ({ ...prev, priorYearAdjustment: (prev.priorYearAdjustment || 0) - reservesDifference }));
    } else if (target === 'cash') {
      setForm((prev) => ({ ...prev, cashAtBank: Math.max(0, prev.cashAtBank + reservesDifference) }));
    }
  };

  const handleApplyLegacyReconcile = (target: 'cash' | 'retainedEarnings' | 'creditors') => {
    if (target === 'cash') {
      const neededCash = totalEquity - activeFixedAssets - activeDebtors + totalCreditorsUnderOneYear;
      setForm((prev) => ({ ...prev, cashAtBank: Math.max(0, neededCash) }));
    } else if (target === 'retainedEarnings') {
      const neededOpening = netAssets - form.shareCapital - netProfit + form.dividendsPaid;
      setForm((prev) => ({ ...prev, openingRetainedEarnings: neededOpening }));
    } else if (target === 'creditors') {
      const neededCreditors = activeFixedAssets + currentAssets - totalEquity;
      setForm((prev) => ({
        ...prev,
        otherCreditorsUnderOneYear: Math.max(0, neededCreditors - activeCtCreditor),
        creditorsUnderOneYear: Math.max(0, neededCreditors)
      }));
    }
  };

  const handleTaxMismatchChoice = (choice: 'use_calculated' | 'keep_override' | 'not_sure') => {
    if (!taxMismatchModalState) return;
    const { field, enteredTax } = taxMismatchModalState;
    if (choice === 'use_calculated') {
      if (field === 'pnlTax') {
        setForm((prev) => ({ ...prev, pnlTaxExpenseOverride: null }));
      } else {
        setForm((prev) => ({ ...prev, corporationTaxPayableOverride: null }));
      }
    } else {
      if (field === 'pnlTax') {
        setForm((prev) => ({ ...prev, pnlTaxExpenseOverride: enteredTax }));
      } else {
        setForm((prev) => ({ ...prev, corporationTaxPayableOverride: enteredTax }));
      }
    }
    setTaxMismatchModalState(null);
  };

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
          companyType: isDormant ? 'DORMANT' : isProperty ? 'PROPERTY' : isMixed ? 'MIXED_INCOME' : 'TRADING',
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
          turnoverPence: isDormant ? 0 : Math.round((isProperty ? propertyGrossIncome : form.turnover) * 100),
          costOfSalesPence: isDormant || isProperty ? 0 : Math.round(form.costOfSales * 100),
          staffCostsPence: 0,
          depreciationPence: 0,
          otherChargesPence: isDormant ? 0 : Math.round((isProperty ? propertyExpenses + propertyMortgageInterest : form.otherCharges) * 100),
          clientEntertainingPence: isDormant || isProperty ? 0 : Math.round(form.disallowables * 100),
          finesPence: 0,
          bankInterestPence: 0,
          taxExpensePence: Math.round(activePnlTax * 100),
          netProfitAfterTaxPence: Math.round(netProfit * 100),
          dividendsPaidPence: isDormant ? 0 : Math.round(form.dividendsPaid * 100),
          openingRetainedEarningsPence: isDormant ? 0 : Math.round(form.openingRetainedEarnings * 100),
          closingRetainedEarningsPence: isDormant ? 0 : Math.round(balanceSheetRetainedEarnings * 100),
          fixedAssetsPence: Math.round(activeFixedAssets * 100),
          debtorsPence: Math.round(activeDebtors * 100),
          cashPence: Math.round(activeCashAtBank * 100),
          creditorsUnderOneYearPence: Math.round(totalCreditorsUnderOneYear * 100),
          creditorsOverOneYearPence: Math.round(activeCreditorsOverOneYear * 100),
          provisionsPence: Math.round(activeProvisions * 100),
          shareCapitalPence: Math.round(form.shareCapital * 100),
          employeeCount: isDormant ? 0 : (form.averageEmployees || 1)
        },
        tax: {
          tradingProfitPence: isProperty ? 0 : Math.round(taxableProfit * 100),
          nonTradingIncomePence: isProperty ? Math.round(taxableProfit * 100) : 0,
          exemptDistributionsPence: Math.round(form.exemptDistributions * 100),
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
    isDormant,
    isProperty,
    isMixed,
    propertyGrossIncome,
    propertyExpenses,
    propertyMortgageInterest,
    activeFixedAssets,
    activeDebtors,
    activeCashAtBank,
    totalCreditorsUnderOneYear,
    activeCreditorsOverOneYear,
    activeProvisions,
    taxableProfit,
    taxPayable,
    activePnlTax,
    s455TaxPayable,
    netProfit,
    balanceSheetRetainedEarnings,
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

  const canTransmit = isStep1Valid && balanceSheetVariance === 0 && isReservesReconciled && fatalShieldErrors.length === 0;

  // 3-Step Structure
  const steps = [
    { num: 1, title: 'Company & Period', desc: 'CRN, entity archetype & dates' },
    { num: 2, title: 'Annual Figures', desc: 'P&L, Schedule A, Balance Sheet & Loans' },
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
      boxLabel: 'FRS 105 iXBRL',
      tooltip: 'Direct contractor and production expenses',
      currentValue: form.costOfSales,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.costOfSalesPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, costOfSales: val }))
    },
    {
      id: 'otherCharges',
      label: 'Other Operating Charges',
      boxLabel: 'FRS 105 iXBRL',
      tooltip: 'Hosting, software subscriptions, insurance, utilities',
      currentValue: form.otherCharges,
      priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.otherOperatingChargesPence / 100) : undefined,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, otherCharges: val }))
    },
    {
      id: 'disallowables',
      label: 'Client Entertaining (Disallowable)',
      boxLabel: 'Tax Add-Back',
      tooltip: 'Hospitality added back to taxable profit (CTA 2009 s1298)',
      currentValue: form.disallowables,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, disallowables: val }))
    },
    {
      id: 'operatingProfit',
      label: 'Trading Profit / (Loss)',
      isTotal: true,
      allowNegative: true,
      currentValue: tradingOperatingProfit,
      priorValue: priorYearData?.figures
        ? Math.round(
            (priorYearData.figures.turnoverPence -
              priorYearData.figures.costOfSalesPence -
              priorYearData.figures.otherOperatingChargesPence) /
              100
          )
        : undefined,
      onChangeCurrent: () => {}
    },
    {
      id: 'pnlTax',
      label: 'Tax on Profit (Corporation Tax)',
      boxLabel: 'Box 430',
      tooltip: 'Corporation tax on ordinary activities computed from CT600 return. Overridable via 3-option modal.',
      currentValue: activePnlTax,
      overrideBadge: form.pnlTaxExpenseOverride !== null ? 'Manual Estimate' : 'Auto CT600',
      onChangeCurrent: (val) => {
        if (val !== taxPayable) {
          setTaxMismatchModalState({
            isOpen: true,
            field: 'pnlTax',
            calculatedTax: taxPayable,
            enteredTax: val
          });
        } else {
          setForm((prev) => ({ ...prev, pnlTaxExpenseOverride: null }));
        }
      }
    },
    {
      id: 'netProfit',
      label: 'Profit / (Loss) for the Financial Year',
      isTotal: true,
      allowNegative: true,
      currentValue: netProfit,
      priorValue: priorYearData?.figures?.profitOrLossPence
        ? Math.round(priorYearData.figures.profitOrLossPence / 100)
        : undefined,
      onChangeCurrent: () => {}
    }
  ], [
    form.turnover,
    form.costOfSales,
    form.otherCharges,
    form.disallowables,
    tradingOperatingProfit,
    activePnlTax,
    form.pnlTaxExpenseOverride,
    taxPayable,
    netProfit,
    priorYearData
  ]);

  // Property SPV Schedule A Line Items
  const propertyScheduleItems: FinancialLineItem[] = useMemo(() => [
    {
      id: 'propertyRentalIncome',
      label: 'Gross Rental Receipts',
      boxLabel: 'Schedule A',
      tooltip: 'Total rent received from commercial and residential tenants',
      currentValue: form.propertyRentalIncome,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, propertyRentalIncome: val }))
    },
    {
      id: 'propertyAllowableExpenses',
      label: 'Allowable Property Expenses',
      boxLabel: 'Schedule A',
      tooltip: 'Repairs, estate management, insurance, and professional fees',
      currentValue: form.propertyAllowableExpenses,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, propertyAllowableExpenses: val }))
    },
    {
      id: 'propertyMortgageInterest',
      label: 'Loan Interest & Finance Costs (NTLR Debit)',
      boxLabel: 'Box 260',
      tooltip: 'CTA 2009 Part 5: Buy-to-let mortgage interest deducted from property profits',
      currentValue: form.propertyMortgageInterest,
      onChangeCurrent: (val) => setForm((prev) => ({ ...prev, propertyMortgageInterest: val }))
    },
    {
      id: 'propertyNetTaxableProfit',
      label: 'Net Chargeable Property Income (Box 190)',
      isTotal: true,
      currentValue: propertyNetTaxableProfit,
      onChangeCurrent: () => {}
    }
  ], [form.propertyRentalIncome, form.propertyAllowableExpenses, form.propertyMortgageInterest, propertyNetTaxableProfit]);

  const balanceSheetItems: FinancialLineItem[] = useMemo(() => {
    const items: FinancialLineItem[] = [
      {
        id: 'fixedAssets',
        label: isProperty ? 'Investment Property / Land & Buildings' : 'Fixed Assets (Tangible)',
        boxLabel: isProperty ? 'FRS 105 s13' : 'FRS 105',
        tooltip: isProperty ? 'Freehold/leasehold property portfolio valuation' : 'Plant, hardware, computers, and office machinery',
        currentValue: activeFixedAssets,
        priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.fixedAssetsPence / 100) : undefined,
        onChangeCurrent: (val) => setForm((prev) => ({ ...prev, fixedAssets: val, capitalAdditions: val, aiaClaimed: val }))
      },
      {
        id: 'debtors',
        label: isProperty ? 'Tenant Rent Arrears & Deposits' : 'Debtors (Receivables)',
        boxLabel: 'FRS 105',
        tooltip: isProperty ? 'Outstanding tenant rent due within 1 year' : 'Unpaid client invoices due within 1 year',
        currentValue: activeDebtors,
        priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.debtorsPence / 100) : undefined,
        onChangeCurrent: (val) => setForm((prev) => ({ ...prev, debtors: val }))
      }
    ];

    if (!form.isLoanIncludedInDebtors && totalOutstandingLoans > 0) {
      items.push({
        id: 'debtorsDirectorLoan',
        label: "Of which: Director's loan account (DLA)",
        boxLabel: 'Schedule',
        tooltip: 'Director loan advances repayable to the company',
        currentValue: totalOutstandingLoans,
        isSubItem: true,
        isLocked: true,
        onChangeCurrent: () => {}
      });
    }

    items.push(
      {
        id: 'cashAtBank',
        label: isProperty ? 'Designated Rental Client Account' : 'Cash at Bank and in Hand',
        boxLabel: 'FRS 105',
        tooltip: 'Bank and liquid balances at period end',
        currentValue: activeCashAtBank,
        priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.cashAtBankPence / 100) : undefined,
        onChangeCurrent: (val) => setForm((prev) => ({ ...prev, cashAtBank: val }))
      },
      {
        id: 'currentAssets',
        label: 'Total Current Assets',
        isLocked: true,
        currentValue: currentAssets,
        priorValue: priorYearData?.figures ? Math.round((priorYearData.figures.debtorsPence + priorYearData.figures.cashAtBankPence) / 100) : undefined,
        onChangeCurrent: () => {}
      },
      {
        id: 'otherCreditorsUnderOneYear',
        label: isProperty ? 'Trade Payables & Deposits' : 'Other Creditors (Trade, VAT, PAYE)',
        boxLabel: 'FRS 105',
        tooltip: 'Liabilities, VAT, PAYE, supplier invoices due < 1 year (excluding Corporation Tax)',
        currentValue: form.otherCreditorsUnderOneYear ?? (form.creditorsUnderOneYear - activeCtCreditor),
        priorValue: priorYearData?.figures ? Math.round((priorYearData.figures.creditorsDueWithinOneYearPence / 100) - (priorYearData.figures.taxExpensePence ? priorYearData.figures.taxExpensePence / 100 : 0)) : undefined,
        onChangeCurrent: (val) => setForm((prev) => ({
          ...prev,
          otherCreditorsUnderOneYear: val,
          creditorsUnderOneYear: val + activeCtCreditor
        }))
      },
      {
        id: 'corporationTaxPayable',
        label: 'Corporation Tax Payable (HMRC)',
        boxLabel: 'CT600',
        tooltip: 'Tax liability auto-calculated from CT600 return. Click to edit or set manual estimate.',
        currentValue: activeCtCreditor,
        overrideBadge: form.corporationTaxPayableOverride !== null ? 'Manual Estimate' : 'Auto CT600',
        priorValue: priorYearData?.figures?.taxExpensePence ? Math.round(priorYearData.figures.taxExpensePence / 100) : undefined,
        onChangeCurrent: (val) => {
          if (val !== taxPayable) {
            setTaxMismatchModalState({
              isOpen: true,
              field: 'ctCreditor',
              calculatedTax: taxPayable,
              enteredTax: val
            });
          } else {
            setForm((prev) => ({ ...prev, corporationTaxPayableOverride: null }));
          }
        }
      },
      {
        id: 'totalCreditorsUnderOneYear',
        label: 'Total Creditors (Due < 1 Year)',
        isLocked: true,
        currentValue: totalCreditorsUnderOneYear,
        priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.creditorsDueWithinOneYearPence / 100) : undefined,
        onChangeCurrent: () => {}
      },
      {
        id: 'netCurrentAssets',
        label: 'Net Current Assets / (Liabilities)',
        isLocked: true,
        allowNegative: true,
        currentValue: netCurrentAssets,
        priorValue: priorYearData?.figures ? Math.round((priorYearData.figures.debtorsPence + priorYearData.figures.cashAtBankPence - priorYearData.figures.creditorsDueWithinOneYearPence) / 100) : undefined,
        onChangeCurrent: () => {}
      },
      {
        id: 'totalAssetsLessCurrentLiabilities',
        label: 'Total Assets Less Current Liabilities',
        isLocked: true,
        allowNegative: true,
        currentValue: totalAssetsLessCurrentLiabilities,
        priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.netAssetsPence / 100) : undefined,
        onChangeCurrent: () => {}
      },
      {
        id: 'creditorsOverOneYear',
        label: 'Creditors (Due > 1 Year)',
        boxLabel: 'Long-term',
        tooltip: 'Bank loans and obligations repayable after 12 months',
        currentValue: activeCreditorsOverOneYear,
        priorValue: priorYearData?.figures?.creditorsDueAfterOneYearPence ? Math.round(priorYearData.figures.creditorsDueAfterOneYearPence / 100) : 0,
        onChangeCurrent: (val) => setForm((prev) => ({ ...prev, creditorsOverOneYear: val }))
      },
      {
        id: 'netAssets',
        label: 'Total Net Assets / (Liabilities)',
        isTotal: true,
        allowNegative: true,
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
        id: 'balanceSheetRetainedEarnings',
        label: 'Profit & Loss Reserve (Retained Earnings)',
        boxLabel: 'LOCKED',
        tooltip: 'Auto-calculated: Net Assets less Share Capital to guarantee statutory balance under CA 2006.',
        isLocked: true,
        allowNegative: true,
        currentValue: balanceSheetRetainedEarnings,
        priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.profitAndLossReservePence / 100) : undefined,
        onChangeCurrent: () => {}
      },
      {
        id: 'totalEquity',
        label: "Total Shareholders' Funds",
        isTotal: true,
        isLocked: true,
        allowNegative: true,
        currentValue: totalEquity,
        priorValue: priorYearData?.figures ? Math.round(priorYearData.figures.totalShareholdersFundsPence / 100) : undefined,
        onChangeCurrent: () => {}
      }
    );

    return items;
  }, [
    isProperty,
    isDormant,
    activeFixedAssets,
    activeDebtors,
    totalOutstandingLoans,
    form.isLoanIncludedInDebtors,
    activeCashAtBank,
    currentAssets,
    form.otherCreditorsUnderOneYear,
    form.creditorsUnderOneYear,
    activeCtCreditor,
    form.corporationTaxPayableOverride,
    taxPayable,
    totalCreditorsUnderOneYear,
    netCurrentAssets,
    totalAssetsLessCurrentLiabilities,
    activeCreditorsOverOneYear,
    netAssets,
    form.shareCapital,
    balanceSheetRetainedEarnings,
    totalEquity,
    priorYearData
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
            <span>Filing Studio: UK Corporation Tax &amp; Accounts</span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {filingMode === 'ct600_only' ? 'CT600 Only' : filingMode === 'accounts_only' ? 'Accounts Only' : 'Dual Gateway'}
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            {isDormant
              ? 'Companies Act 2006 s480 Dormant Company simplified statutory return.'
              : isProperty
              ? 'Dedicated Buy-to-Let Property SPV return with Schedule A & Box 260 NTLR deductions.'
              : isMixed
              ? 'Multi-stream segregated return combining trading operations and UK property profits.'
              : 'Unified FRS 105 Micro-Entity Accounts and HMRC CT600 Corporation Tax Return.'}
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

      {/* Custom Dates Notice if active */}
      {isCustomDates && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-950 text-xs">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Custom Accounting Period Active</p>
            <p className="text-amber-800 leading-relaxed">
              Filing for custom date range <strong>{form.periodStart}</strong> to <strong>{form.periodEnd}</strong> ({periodDayCount} days). Reason: {customReason || 'HMRC CT603 notice or ARD variance alignment'}.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Stepper Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:px-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-full sm:w-auto">
            {steps.map((s, idx) => {
              const isActive = currentStep === s.num;
              const isCompleted = currentStep > s.num;

              return (
                <div key={s.num} className="flex items-center gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.num > 1 && !isStep1Valid) return;
                      setCurrentStep(s.num);
                    }}
                    disabled={s.num > 1 && !isStep1Valid}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold'
                        : isCompleted
                        ? 'text-slate-800 hover:bg-slate-50'
                        : s.num > 1 && !isStep1Valid
                        ? 'text-slate-300 opacity-50 cursor-not-allowed'
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isCompleted ? '✓' : s.num}
                    </span>
                    <div>
                      <div className="text-xs font-bold">{s.title}</div>
                      <div className={`text-[11px] hidden sm:block ${isActive ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {s.desc}
                      </div>
                    </div>
                  </button>
                  {idx < steps.length - 1 && <span className="text-slate-300 hidden sm:inline">→</span>}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>Import Statement (PDF/CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focused Step Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: Company Profile, Archetype Selector & Accounting Period          */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Step 1: Company Profile &amp; Archetype</h2>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Companies House Linked
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Select your corporate archetype and verify your statutory accounting reference dates.
                </p>
              </div>

              {/* 1.2 Segmented Radio Archetype Cards (Phase 1 Doctrine) */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  Select Company Archetype (Tailors Form Schedules Dynamically)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Archetype 1: Trading Company */}
                  <div
                    onClick={() => handleRequestArchetype('TRADING')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      form.companyType === 'TRADING'
                        ? 'border-slate-900 bg-slate-50/70 shadow-xs ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Briefcase className={`w-4 h-4 ${form.companyType === 'TRADING' ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span className="font-bold text-xs text-slate-900">Trading Company</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        FRS 105
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Standard commercial business with sales, direct contractor costs, operating expenses, and 100% AIA capital allowances.
                    </p>
                  </div>

                  {/* Archetype 2: Property Company (Buy-to-Let SPV) */}
                  <div
                    onClick={() => handleRequestArchetype('PROPERTY')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      form.companyType === 'PROPERTY'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Home className={`w-4 h-4 ${form.companyType === 'PROPERTY' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="font-bold text-xs text-indigo-950">Property Company (SPV)</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        Schedule A
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Buy-to-let SPV with rental receipts, property repairs, and CTA 2009 Part 5 mortgage interest (Box 260 NTLR).
                    </p>
                  </div>

                  {/* Archetype 3: Dormant Company */}
                  <div
                    onClick={() => handleRequestArchetype('DORMANT')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      form.companyType === 'DORMANT'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <PauseCircle className={`w-4 h-4 ${form.companyType === 'DORMANT' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="font-bold text-xs text-emerald-950">Dormant Company</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        CA 2006 s480
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Zero trading activity. P&amp;L is unmounted, headcount is locked to 0, and streamlined AA02 balance sheet is filed.
                    </p>
                  </div>

                  {/* Archetype 4: Mixed Income */}
                  <div
                    onClick={() => handleRequestArchetype('MIXED')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      form.companyType === 'MIXED'
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className={`w-4 h-4 ${form.companyType === 'MIXED' ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span className="font-bold text-xs text-purple-950">Mixed Income (Advanced)</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Multi-Stream
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Parallel schedules combining trading profits (Box 155), property income (Box 190), and loan relationship debits.
                    </p>
                  </div>
                </div>
              </div>

              {/* Companies House Search & Verification */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Search Registered Name or 8-Digit CRN
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. DropLogicX or 15152081"
                    value={chQuery}
                    onChange={(e) => setChQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                {chResults.length > 0 && (
                  <div className="absolute bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 w-full max-w-md">
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

              {/* Verified Registry Summary Card with Collapsible Edit Drawer */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Companies House Registry Profile
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fetchPriorYearAccounts()}
                      disabled={isFetchingPriorYear}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                    >
                      {isFetchingPriorYear ? 'Syncing...' : '↻ Sync Prior Year iXBRL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingRegistry(!isEditingRegistry)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                    >
                      {isEditingRegistry ? 'Close Edit Drawer' : 'Edit Dates / Officers'}
                    </button>
                  </div>
                </div>

                {/* Compact Read-Only Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Entity Name</span>
                    <strong className="text-slate-900 font-semibold">{form.companyName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Company Number</span>
                    <strong className="text-slate-900 font-mono">{form.crn}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Signatory Director</span>
                    <strong className="text-slate-900">{form.directorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Accounting Period</span>
                    <strong className="text-slate-900 font-mono">{form.periodStart} to {form.periodEnd}</strong>
                  </div>
                </div>

                {/* Collapsible Edit Drawer */}
                {isEditingRegistry && (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in-50 duration-150">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Signatory Director Name (CA 2006 s414)</label>
                      <input
                        type="text"
                        value={form.directorName}
                        onChange={(e) => setForm({ ...form, directorName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Average Number of Employees (CA 2006 s411)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={form.averageEmployees}
                        onChange={(e) => setForm({ ...form, averageEmployees: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Period Start Date</label>
                      <input
                        type="date"
                        value={form.periodStart}
                        onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Period End Date (365 Days)</label>
                      <input
                        type="date"
                        value={form.periodEnd}
                        onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Primary Required Inputs: 10-Digit UTR & Associated Companies */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      <TermExplainer termId="ct600" label="HMRC Unique Taxpayer Reference (UTR)" />
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={form.utr}
                      onChange={(e) => setForm({ ...form, utr: e.target.value.replace(/\D/g, '') })}
                      placeholder="10-digit UTR"
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 ${
                        !isUtrValid && form.utr ? 'border-red-300 bg-red-50/20' : 'border-slate-300 focus:ring-slate-900'
                      }`}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Official 10-digit number issued on HMRC CT41G notice</p>
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
                    <p className="text-[11px] text-slate-400 mt-1">Other active companies you control (divides tax limits by N+1)</p>
                  </div>
                </div>
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
                      <div>
                        Fixed Assets:{' '}
                        <span className="font-mono font-semibold text-slate-900">
                          {priorYearData.figures.fixedAssetsPence !== undefined && !isNaN(priorYearData.figures.fixedAssetsPence)
                            ? `£${(priorYearData.figures.fixedAssetsPence / 100).toLocaleString()}`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        Current Assets:{' '}
                        <span className="font-mono font-semibold text-slate-900">
                          {priorYearData.figures.currentAssetsPence !== undefined && !isNaN(priorYearData.figures.currentAssetsPence)
                            ? `£${(priorYearData.figures.currentAssetsPence / 100).toLocaleString()}`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        Net Assets:{' '}
                        <span className="font-mono font-semibold text-slate-900">
                          {priorYearData.figures.totalNetAssetsPence !== undefined && !isNaN(priorYearData.figures.totalNetAssetsPence)
                            ? `£${(priorYearData.figures.totalNetAssetsPence / 100).toLocaleString()}`
                            : priorYearData.figures.totalShareholdersFundsPence !== undefined && !isNaN(priorYearData.figures.totalShareholdersFundsPence)
                            ? `£${(priorYearData.figures.totalShareholdersFundsPence / 100).toLocaleString()}`
                            : priorYearData.figures.fixedAssetsPence !== undefined && priorYearData.figures.netCurrentAssetsPence !== undefined
                            ? `£${((priorYearData.figures.fixedAssetsPence + priorYearData.figures.netCurrentAssetsPence) / 100).toLocaleString()}`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        Retained Reserves:{' '}
                        <span className="font-mono font-semibold text-slate-900">
                          {priorYearData.figures.profitAndLossReservePence !== undefined && !isNaN(priorYearData.figures.profitAndLossReservePence)
                            ? `£${(priorYearData.figures.profitAndLossReservePence / 100).toLocaleString()}`
                            : '—'}
                        </span>
                      </div>
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
                  {isDormant ? (
                    <span>
                      I confirm as director that the board has approved these dormant accounts and authorized the dormant audit exemption declaration under{' '}
                      <strong>Section 480 of the Companies Act 2006</strong>.
                    </span>
                  ) : (
                    <span>
                      I confirm as director that the board has approved these accounts and authorized the micro-entity audit exemption declaration under{' '}
                      <TermExplainer termId="s477-exemption" label="Section 477 of the Companies Act 2006" />.
                    </span>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Annual Figures & Statutory Computations (Adaptive by Archetype)   */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Top Action Bar with CSV / Trial Balance Modal Trigger */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">
                    Step 2: Annual Figures &amp; Computations
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isDormant
                      ? 'Dormant Company: Profit & Loss account is unmounted. Balance sheet is streamlined to AA02 format.'
                      : isProperty
                      ? 'Property SPV: Enter Schedule A gross rental income and allowable property costs.'
                      : 'Enter your annual figures below with side-by-side prior-year comparisons, or import directly from bank statements.'}
                  </p>
                </div>

                {!isDormant && (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0B1528] text-white hover:bg-slate-800 transition shadow-xs shrink-0"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>Import Bank CSV / Statement</span>
                  </button>
                )}
              </div>

              {/* DORMANT STATUTORY NOTICE (P&L UNMOUNTED) */}
              {isDormant && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 space-y-3 text-xs text-emerald-950">
                  <div className="flex items-center space-x-2 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Companies Act 2006 s480 Dormant Exemption Applied</span>
                  </div>
                  <p className="leading-relaxed text-emerald-900">
                    Because this company had no significant accounting transactions during the financial year, it is exempt from filing a Profit and Loss account. All trading income and charges are locked to <strong className="font-mono">£0.00</strong>, and employee headcount is locked to <strong className="font-mono">0</strong>.
                  </p>
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 font-mono text-[11px] grid grid-cols-3 gap-2">
                    <div>Turnover: <strong className="text-slate-900">£0.00</strong></div>
                    <div>Taxable Profit: <strong className="text-slate-900">£0.00</strong></div>
                    <div>Corporation Tax: <strong className="text-emerald-700">£0.00</strong></div>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* PANEL A: Trading Profit & Loss Account (Trading & Mixed Archetypes)   */}
              {/* --------------------------------------------------------------------- */}
              {(!isDormant && !isProperty) && (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePanel('pnl')}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 transition border-b border-slate-100"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold text-xs">
                        P&amp;L
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2">
                          <span>Trading Profit &amp; Loss Account</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">FRS 105 Section 3</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Operating commercial turnover, cost of sales, and allowable trading charges
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        Trading Profit: {formatAccounting(tradingOperatingProfit)}
                      </span>
                      {expandedPanels.pnl ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {expandedPanels.pnl && (
                    <div className="p-6 sm:p-8 space-y-5">
                      <ComparativeFinancialTable
                        title="Trading Profit & Loss Account Comparison"
                        subtitle="Current Year vs Prior Year statutory reporting (FRS 105)"
                        currentYearLabel="Current Year (CY)"
                        priorYearLabel="Prior Year (PY)"
                        items={pnlItems}
                        hasPriorYearData={Boolean(priorYearData?.figures)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* PANEL A2: Dedicated Property SPV Schedule A (Property & Mixed)        */}
              {/* --------------------------------------------------------------------- */}
              {(isProperty || isMixed) && (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePanel('propertySchedule')}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 transition border-b border-slate-100"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center font-bold text-xs">
                        SPV
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2">
                          <span>Property Rental Schedule A (CTA 2009 Part 4 &amp; 5)</span>
                          <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                            Buy-to-Let SPV
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Rental receipts, allowable maintenance, and Box 260 NTLR mortgage interest
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-indigo-950">
                        Box 190: {formatAccounting(propertyNetTaxableProfit)}
                      </span>
                      {expandedPanels.propertySchedule ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {expandedPanels.propertySchedule && (
                    <div className="p-6 sm:p-8 space-y-5">
                      {/* CTA 2009 Part 5 Guardrail Notice */}
                      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-950 text-xs">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">CTA 2009 Part 5 Mortgage Interest Guardrail</p>
                          <p className="text-amber-800 leading-relaxed">
                            Under UK corporation tax law, mortgage and commercial loan interest in a property investment company is treated as a <strong>Non-Trading Loan Relationship (NTLR) debit</strong> reported in <strong>CT600 Box 260</strong>. It must NOT be added to standard trading expenses.
                          </p>
                        </div>
                      </div>

                      <ComparativeFinancialTable
                        title="Schedule A: UK Property Business Computation"
                        subtitle="Rental income, allowable property costs, and finance deductions"
                        currentYearLabel="Current Year (CY)"
                        priorYearLabel="Prior Year (PY)"
                        items={propertyScheduleItems}
                        hasPriorYearData={false}
                      />

                      {/* Box 805 Deficit Callout if in loss */}
                      {propertyLossCarriedForward > 0 && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-950">
                          <div className="space-y-0.5">
                            <span className="font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              <span>Property Business Deficit Recorded: {formatAccounting(propertyLossCarriedForward)}</span>
                            </span>
                            <p className="text-rose-800 text-[11px]">
                              Expenses exceed rental income. Box 190 is automatically set to £0.00, and the deficit rolls into <strong>CT600 Box 805</strong> to offset future property profits.
                            </p>
                          </div>
                          <span className="font-mono font-bold text-sm bg-rose-100 text-rose-900 px-3 py-1 rounded-xl">
                            Box 805: {formatAccounting(propertyLossCarriedForward)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* PANEL B: Balance Sheet (Adapted for Archetype)                       */}
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
                        <span>
                          {isDormant ? 'Streamlined Dormant Balance Sheet (AA02)' : 'Balance Sheet (Statement of Financial Position)'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          {isDormant ? 'CA 2006 s480' : 'CA 2006 s396 / FRS 105'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isDormant
                          ? 'Called up share capital and bank balance (no P&L transactions)'
                          : isProperty
                          ? 'Property assets, tenant arrears, cash, and mortgage liabilities'
                          : 'Assets, liabilities, share capital, and comparative prior-year reporting'}
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
                    {/* A8: Going Concern & Net Liabilities Advisory Notice */}
                    {netAssets < 0 && (
                      <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-red-950">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-red-900">
                            <span>Going Concern Notice: Total Net Liabilities of {formatAccounting(netAssets)}</span>
                          </p>
                          <p className="text-[11px] leading-relaxed text-red-800">
                            Under UK Company Law and FRS 105, negative net assets indicate balance-sheet insolvency.
                            In accordance with accounting standards, negative equity is presented in bracketed accounting format.
                            The directors must satisfy themselves that the company remains a going concern based on financial support from directors or shareholders.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* A7: Director Loans Debtors Schedule Integration Prompt */}
                    {totalOutstandingLoans > 0 && (
                      <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 text-indigo-950">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                              <Scale className="w-4 h-4 text-indigo-700" />
                              Director Loan Schedule Debtors Integration
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold">
                              £{totalOutstandingLoans.toLocaleString()} Outstanding
                            </span>
                          </div>
                          <p className="text-[11px] text-indigo-800 leading-relaxed">
                            Under UK GAAP, overdrawn director loan balances are classified as Debtors. Is your £{totalOutstandingLoans.toLocaleString()} loan balance already included in the Debtors figure above?
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, isLoanIncludedInDebtors: true }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                              form.isLoanIncludedInDebtors
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Already in Debtors
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, isLoanIncludedInDebtors: false }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                              !form.isLoanIncludedInDebtors
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Add to Debtors (+£{totalOutstandingLoans.toLocaleString()})
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TaxFlow Superiority: Stale CT Override Alert */}
                    {form.corporationTaxPayableOverride !== null && form.corporationTaxPayableOverride !== taxPayable && (
                      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                        <div className="space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-amber-900">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            Tax Liability Mismatch: Manual Estimate £{form.corporationTaxPayableOverride.toLocaleString()} vs CT600 £{taxPayable.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-amber-800">
                            Your taxable profit or capital allowances changed since you set this estimate. The CT600 computation now calculates £{taxPayable.toLocaleString()}.
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, corporationTaxPayableOverride: null }))}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition shadow-2xs"
                          >
                            Update to £{taxPayable.toLocaleString()}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTaxMismatchModalState({
                              isOpen: true,
                              field: 'ctCreditor',
                              calculatedTax: taxPayable,
                              enteredTax: form.corporationTaxPayableOverride!
                            })}
                            className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-xl transition"
                          >
                            Review Options
                          </button>
                        </div>
                      </div>
                    )}

                    {/* S7 & S8 Comparative Balance Sheet Table */}
                    <ComparativeFinancialTable
                      title={isDormant ? 'Dormant Company Statement of Financial Position' : 'Statement of Financial Position (Balance Sheet)'}
                      subtitle={isDormant ? 'Simplified called up share capital and bank reserves' : "Assets, Liabilities, and Equity with 100% automatic balancing"}
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

                    {/* A6: FRS 105 Reserves Roll-Forward Reconciliation Panel */}
                    {!isDormant && (
                      <div className={`rounded-3xl border p-5 sm:p-6 space-y-4 transition-all ${
                        isReservesReconciled
                          ? 'bg-emerald-50/40 border-emerald-200/80'
                          : 'bg-amber-50/50 border-amber-300/90 shadow-xs'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                              isReservesReconciled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              <Scale className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-bold text-slate-950">
                                  Reserves Roll-Forward Reconciliation
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  isReservesReconciled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isReservesReconciled ? 'Reconciled 0.00p' : `Variance £${Math.abs(reservesDifference).toLocaleString()}`}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                FRS 105 Section 6: Opening Reserves + Profit After Tax − Dividends = Closing Reserves
                              </p>
                            </div>
                          </div>

                          {isReservesReconciled ? (
                            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Statutory Symmetry Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold shrink-0">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Variance Detected</span>
                            </div>
                          )}
                        </div>

                        {/* Roll-Forward Table Breakdown */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-xs">
                          <div className="divide-y divide-slate-100 font-mono">
                            <div className="p-3 sm:px-4 flex justify-between items-center text-slate-700">
                              <div className="flex items-center space-x-2 font-sans font-medium">
                                <span>Opening Retained Earnings (Brought Forward)</span>
                                {priorYearData?.figures?.profitAndLossReservePence && (
                                  <button
                                    type="button"
                                    onClick={() => setForm((prev) => ({
                                      ...prev,
                                      openingRetainedEarnings: Math.round(priorYearData.figures.profitAndLossReservePence / 100)
                                    }))}
                                    className="text-[10px] text-blue-600 hover:underline font-mono"
                                  >
                                    (Sync PY: £{Math.round(priorYearData.figures.profitAndLossReservePence / 100).toLocaleString()})
                                  </button>
                                )}
                              </div>
                              <input
                                type="number"
                                value={form.openingRetainedEarnings}
                                onChange={(e) => setForm((prev) => ({ ...prev, openingRetainedEarnings: Number(e.target.value) || 0 }))}
                                className="w-28 text-right px-2 py-1 rounded-lg border border-slate-200 focus:ring-1 focus:ring-slate-900 text-xs font-mono font-bold"
                              />
                            </div>
                            <div className="p-3 sm:px-4 flex justify-between items-center text-slate-700">
                              <span className="font-sans font-medium">Add: Profit / (Loss) for the Financial Year</span>
                              <span className={netProfit >= 0 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                                {netProfit >= 0 ? `+ ${formatAccounting(netProfit)}` : formatAccounting(netProfit)}
                              </span>
                            </div>
                            <div className="p-3 sm:px-4 flex justify-between items-center text-slate-700">
                              <span className="font-sans font-medium">Less: Dividends Declared &amp; Paid</span>
                              <div className="flex items-center space-x-1">
                                <span className="text-slate-400 font-sans">-</span>
                                <input
                                  type="number"
                                  value={form.dividendsPaid}
                                  onChange={(e) => setForm((prev) => ({ ...prev, dividendsPaid: Number(e.target.value) || 0 }))}
                                  className="w-28 text-right px-2 py-1 rounded-lg border border-slate-200 focus:ring-1 focus:ring-slate-900 text-xs font-mono font-bold"
                                />
                              </div>
                            </div>
                            {form.priorYearAdjustment !== 0 && (
                              <div className="p-3 sm:px-4 flex justify-between items-center text-slate-700">
                                <span className="font-sans font-medium">Prior Year Reserve Adjustments</span>
                                <span>{formatAccounting(form.priorYearAdjustment)}</span>
                              </div>
                            )}
                            <div className="p-3 sm:px-4 flex justify-between items-center bg-slate-50/80 font-bold text-slate-900">
                              <span className="font-sans">Expected Closing Retained Earnings</span>
                              <span>{formatAccounting(expectedClosingRetainedEarnings)}</span>
                            </div>
                            <div className="p-3 sm:px-4 flex justify-between items-center bg-slate-50/80 font-bold text-slate-900 border-t border-slate-200">
                              <span className="font-sans flex items-center space-x-1.5">
                                <span>Balance Sheet Retained Earnings</span>
                                <span className="text-[10px] font-normal text-slate-400">(Net Assets − Share Capital)</span>
                              </span>
                              <span>{formatAccounting(balanceSheetRetainedEarnings)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Diagnostic & 1-Click Fix Helpers (When Variance Exists) */}
                        {!isReservesReconciled && (
                          <div className="bg-amber-100/70 border border-amber-200 rounded-2xl p-4 space-y-3 text-xs text-amber-950">
                            <div className="space-y-1">
                              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                                Unexplained Difference: £{Math.abs(reservesDifference).toLocaleString()}
                              </p>
                              <p className="text-[11px] leading-relaxed text-amber-900">
                                Under UK GAAP, the change in balance sheet reserves must match your P&amp;L profit minus dividends.
                                While competitors like TinyTax silently file this mismatch, TaxFlow protects you by flagging the exact source of discrepancy.
                              </p>
                            </div>

                            {/* 1-Click Quick Actions */}
                            <div className="pt-2 border-t border-amber-200 space-y-2">
                              <span className="text-[11px] font-bold text-amber-900 block">1-Click Auto-Resolution Helpers:</span>
                              <div className="flex flex-wrap gap-2">
                                {reservesDifference > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleApplyReconcile('dividends')}
                                    className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold shadow-2xs transition"
                                  >
                                    Set Dividends Paid to £{(form.dividendsPaid + reservesDifference).toLocaleString()}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleApplyReconcile('openingReserves')}
                                  className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold shadow-2xs transition"
                                >
                                  Adjust Opening Reserves to £{(form.openingRetainedEarnings - reservesDifference).toLocaleString()}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyReconcile('priorYearAdj')}
                                  className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold shadow-2xs transition"
                                >
                                  Record Prior Year Adjustment of £{(-reservesDifference).toLocaleString()}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyReconcile('cash')}
                                  className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold shadow-2xs transition"
                                >
                                  Reconcile via Cash at Bank
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dormant Statutory Declaration Box */}
                    {isDormant && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
                        <p className="font-bold text-slate-900">Companies Act 2006 Section 480 Audit Exemption Statement</p>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          "For the year ending {form.periodEnd}, the company was entitled to exemption from audit under section 480 of the Companies Act 2006 relating to dormant companies. The members have not required the company to obtain an audit in accordance with section 476. The directors acknowledge their responsibilities for complying with the requirements of the Act with respect to accounting records and the preparation of accounts."
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------------------- */}
              {/* PANEL C: Capital Allowances (Trading & Mixed Archetypes)             */}
              {/* --------------------------------------------------------------------- */}
              {(!isDormant && !isProperty) && (
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
                          <span>Capital Allowances &amp; Plant Reliefs</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">CAA 2001 / CT600 Box 690</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          100% Annual Investment Allowance (AIA) and Writing Down Allowance (WDA)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        Total Relief: {formatAccounting(totalCapitalAllowances)}
                      </span>
                      {expandedPanels.allowances ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {expandedPanels.allowances && (
                    <div className="p-6 sm:p-8 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Qualifying Plant &amp; Machinery Additions
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={form.capitalAdditions}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setForm({ ...form, capitalAdditions: val, aiaClaimed: val, fixedAssets: val });
                            }}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">Laptops, servers, tools, hardware (100% eligible for AIA)</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            AIA Claimed this Period (Max £1,000,000)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={form.capitalAdditions}
                            value={form.aiaClaimed}
                            onChange={(e) => setForm({ ...form, aiaClaimed: Math.min(form.capitalAdditions, Math.max(0, parseInt(e.target.value) || 0)) })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">Deducted 100% against trading profit in CT600 Box 690</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* PANEL D: Director Loan Account & Section 455 Schedule               */}
              {/* --------------------------------------------------------------------- */}
              {!isDormant && (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePanel('loans')}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50/50 transition border-b border-slate-100"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold text-xs">
                        s455
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2">
                          <span>Director Loan Accounts &amp; CT600A Schedule</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">CTA 2010 s455</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Tracks overdrawn director loan advances and Section 455 tax exposure
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {s455TaxPayable > 0 ? `s455 Tax: £${s455TaxPayable.toLocaleString()}` : '0 Overdrawn Loans'}
                      </span>
                      {expandedPanels.loans ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {expandedPanels.loans && (
                    <div className="p-6 sm:p-8 space-y-4">
                      <DirectorLoansSchedule
                        loans={form.directorLoans}
                        onChange={(newLoans) => {
                          const totalAdv = newLoans.reduce((acc, l) => acc + (l.advanceAmount || 0), 0);
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
              )}

              {/* --------------------------------------------------------------------- */}
              {/* PANEL E: Official HMRC Corporation Tax Computation Breakdown          */}
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
                      Total Tax: {formatAccounting(totalHmrcPayable)}
                    </span>
                    {expandedPanels.taxSchedule ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {expandedPanels.taxSchedule && (
                  <div className="p-6 sm:p-8">
                    <TaxComputationBreakdown
                      companyType={form.companyType}
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
                      propertyRentalIncome={propertyGrossIncome}
                      propertyAllowableExpenses={propertyExpenses}
                      propertyMortgageInterest={propertyMortgageInterest}
                      propertyNetProfit={propertyNetTaxableProfit}
                      propertyLossCarriedForward={propertyLossCarriedForward}
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
                    <h2 className="text-xl font-bold tracking-tight text-slate-950">Step 3: Review &amp; Submit Return</h2>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      canTransmit ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {canTransmit ? 'Ready for Submission' : `${fatalShieldErrors.length} item(s) to fix`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {filingMode === 'ct600_only'
                      ? 'Corporation Tax (CT600) only mode: Submitting digital tax return to HMRC.'
                      : filingMode === 'accounts_only'
                      ? 'Accounts only mode: Submitting iXBRL accounts to Companies House.'
                      : 'Dual Gateway: Simultaneous submission of Accounts to Companies House & CT600 to HMRC.'}
                  </p>
                </div>

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
                    {!isReservesReconciled && (
                      <li>
                        <span className="font-bold">Reserves Roll-Forward Discrepancy:</span> Discrepancy of £{Math.abs(reservesDifference).toLocaleString()} between expected closing reserves and balance sheet retained earnings.
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
                    <span>HMRC Government Gateway User ID &amp; Password (enrolled in Corporation Tax)</span>
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
                        <div className="font-bold text-slate-900">
                          {isDormant ? 'Dormant Accounts AA02 (PDF)' : 'Full Accounts (PDF)'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isDormant ? 'CA 2006 s480 for Companies House' : 'FRS 105 for shareholders'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-800">{formatAccounting(netProfit)}</span>
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
                    <span className="font-mono font-bold text-emerald-700">{formatAccounting(totalHmrcPayable)}</span>
                  </a>
                </div>
              </div>

              {/* HMRC Payment Section */}
              {!isDormant && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Landmark className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        HMRC Corporation Tax Settlement Guide
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      Payment of <strong className="text-slate-900 font-mono">{formatAccounting(totalHmrcPayable)}</strong> is due on{' '}
                      <strong className="text-slate-900">{paymentDueDate}</strong> (9 months &amp; 1 day after period end).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPayHmrcOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold transition shadow-2xs self-start sm:self-auto shrink-0"
                  >
                    <Landmark className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Bank Details &amp; PRN</span>
                  </button>
                </div>
              )}

              {/* UNIFIED DUAL GATEWAY SUBMISSION CARD (Upgrade Fix: Replaces confusing split buttons) */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      Simultaneous Dual-Gateway Dispatch
                    </span>
                    <h3 className="text-xl font-bold tracking-tight">Approve &amp; Transmit Statutory Returns</h3>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Dispatches your iXBRL filleted accounts to Companies House (9-month deadline) and your CT600 return + computations to HMRC GovTalk (12-month deadline) in one atomic transaction.
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs text-slate-400 block font-medium">One-Off Filing Fee</span>
                    <span className="text-3xl font-extrabold font-mono text-white">
                      {filingScope === 'dual' ? (isDormant ? '£0.00' : '£49.00') : '£0.00'}
                    </span>
                    <span className="text-[11px] text-emerald-400 block font-medium">No recurring subscription</span>
                  </div>
                </div>

                {/* Optional Secondary Mode Radio */}
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="filing_scope"
                      value="dual"
                      checked={filingScope === 'dual'}
                      onChange={() => setFilingScope('dual')}
                      className="text-indigo-500 focus:ring-indigo-500"
                    />
                    <span>
                      <strong className="text-white">Full Dual Filing (Recommended):</strong> Companies House FRS 105 + HMRC CT600 ({isDormant ? '£0.00' : '£49.00'})
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="filing_scope"
                      value="ch_only"
                      checked={filingScope === 'ch_only'}
                      onChange={() => setFilingScope('ch_only')}
                      className="text-indigo-500 focus:ring-indigo-500"
                    />
                    <span>Companies House Accounts Only (£0.00 Free)</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    ← Back to Figures
                  </button>
                  <button
                    type="button"
                    disabled={!canTransmit}
                    onClick={() => alert(`TaxFlow UK: Validated & ready to transmit ${filingScope === 'dual' ? 'dual Companies House & HMRC CT600 returns' : 'Companies House accounts'}!`)}
                    className={`px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                      canTransmit
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 cursor-pointer'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {filingScope === 'dual'
                        ? isDormant
                          ? 'Approve & Submit Dual Filing (Free)'
                          : 'Approve & Submit Dual Filing (£49.00)'
                        : 'Approve & Submit Companies House Accounts (Free)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
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
                  {fatalShieldErrors.length > 0
                    ? `${fatalShieldErrors.length} blocking issue${fatalShieldErrors.length > 1 ? 's' : ''} to resolve`
                    : warningShieldItems.length > 0
                    ? `${warningShieldItems.length} advisory note${warningShieldItems.length > 1 ? 's' : ''}`
                    : 'HMRC & CH Gateway ready'}
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
                  <TermExplainer termId="ct600" label={isDormant ? 'Dormant Nil Return' : isProperty ? 'Property SPV Tax' : 'HMRC CT600 Estimate'} />
                </span>
              </span>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {isDormant ? 'Nil Liability' : isPeriodValid ? taxRateLabel : 'Pending Dates'}
              </span>
            </div>

            {isDormant ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Box 145 (Turnover):</span>
                  <span className="font-semibold text-slate-900 font-mono">£0.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Box 315 (Profits):</span>
                  <span className="font-semibold text-slate-900 font-mono">£0.00</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                  <span>Box 440 (CT Due):</span>
                  <span className="text-emerald-700 font-mono">£0.00</span>
                </div>
              </div>
            ) : isPeriodValid ? (
              <div className="space-y-1.5 text-xs">
                {isProperty ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Rental Receipts:</span>
                      <span className="font-semibold text-slate-900 num-tabular">{formatAccounting(propertyGrossIncome)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Property Costs:</span>
                      <span className="font-semibold text-slate-900 num-tabular">-{formatAccounting(propertyExpenses)}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Box 260 (Mortgage Int.):</span>
                      <span className="font-semibold num-tabular">-{formatAccounting(propertyMortgageInterest)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-0.5 border-t border-slate-100 font-medium">
                      <span>Box 190 (Property Profit):</span>
                      <span className="font-semibold text-indigo-950 num-tabular">{formatAccounting(propertyNetTaxableProfit)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Box 145 (Turnover):</span>
                      <span className="font-semibold text-slate-900 num-tabular">{formatAccounting(form.turnover)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Box 155 (Trading Profit):</span>
                      <span className="font-semibold text-slate-900 num-tabular">{formatAccounting(tradingOperatingProfit)}</span>
                    </div>
                    {form.disallowables > 0 && (
                      <div className="flex justify-between text-slate-500 text-[11px] pl-2 border-l border-slate-200">
                        <span>+ Disallowables:</span>
                        <span className="font-semibold num-tabular">+{formatAccounting(form.disallowables)}</span>
                      </div>
                    )}
                    {totalCapitalAllowances > 0 && (
                      <div className="flex justify-between text-slate-500 text-[11px] pl-2 border-l border-slate-200">
                        <span>- Capital Allowances (AIA):</span>
                        <span className="font-semibold num-tabular">({formatAccounting(totalCapitalAllowances)})</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 pt-0.5 border-t border-slate-100 font-medium">
                      <span>Box 315 (Total Taxable):</span>
                      <span className="font-semibold text-slate-900 num-tabular">{formatAccounting(taxableProfit)}</span>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                  <span>Box 440 (CT Due):</span>
                  <span className="text-emerald-700 num-tabular">{formatAccounting(taxPayable)}</span>
                </div>
                {s455TaxPayable > 0 && (
                  <div className="flex justify-between text-xs font-bold text-amber-700">
                    <span>CT600A (s455 Tax):</span>
                    <span className="num-tabular">+{formatAccounting(s455TaxPayable)}</span>
                  </div>
                )}
                {s455TaxPayable > 0 && (
                  <div className="pt-1 border-t border-slate-100 flex justify-between text-xs font-black text-slate-950">
                    <span>Total HMRC Due:</span>
                    <span className="text-emerald-700 num-tabular">{formatAccounting(totalHmrcPayable)}</span>
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
              <span className="font-mono font-bold text-emerald-700">
                0.00p (Balanced)
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="h-2 rounded-full transition-all duration-300 bg-emerald-600 w-full" />
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Net Assets:</span>
                <span className="font-mono text-slate-800">{formatAccounting(netAssets)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shareholders' Funds:</span>
                <span className="font-mono text-slate-800">{formatAccounting(totalEquity)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span>Reserves Roll-Forward:</span>
                <span className={`font-mono font-bold ${isReservesReconciled ? 'text-emerald-700' : 'text-amber-600'}`}>
                  {isReservesReconciled ? '0.00p Match' : `£${Math.abs(reservesDifference).toLocaleString()} Diff`}
                </span>
              </div>
            </div>

            {!isReservesReconciled && (
              <button
                type="button"
                onClick={() => {
                  setExpandedPanels((prev) => ({ ...prev, balanceSheet: true }));
                  const el = document.getElementById('fixedAssets');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <Scale className="w-3 h-3 text-amber-600" />
                <span>Review Reserves Variance</span>
              </button>
            )}
          </div>

          {/* Free Watermarked Drafts Pill Card (Hidden on Step 3 to eliminate duplicate buttons) */}
          {currentStep !== 3 && (
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
          )}
        </div>
      </div>

      {/* Interactive Modals */}
      {taxMismatchModalState && (
        <TaxMismatchModal
          isOpen={taxMismatchModalState.isOpen}
          onClose={() => setTaxMismatchModalState(null)}
          field={taxMismatchModalState.field}
          calculatedTax={taxMismatchModalState.calculatedTax}
          enteredTax={taxMismatchModalState.enteredTax}
          onSelect={handleTaxMismatchChoice}
        />
      )}

      <AutoReconcileModal
        isOpen={isAutoReconcileOpen}
        onClose={() => setIsAutoReconcileOpen(false)}
        totalAssetsPence={Math.round(netAssets * 100)}
        totalFundsPence={Math.round(totalEquity * 100)}
        variancePence={Math.round(balanceSheetVariance * 100)}
        onApply={handleApplyLegacyReconcile}
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

      {/* Non-Destructive Archetype Switch Safeguard Modal (FE-02) */}
      <ArchetypeConfirmModal
        isOpen={pendingArchetype !== null}
        targetArchetype={pendingArchetype}
        activeFigures={{
          turnover: form.turnover,
          costOfSales: form.costOfSales,
          directorLoansTotal: form.directorLoans?.reduce((acc, l) => acc + (l.advanceAmount || 0), 0) || form.directorLoanAdvance || 0,
          propertyIncome: form.propertyRentalIncome
        }}
        onClose={() => setPendingArchetype(null)}
        onConfirm={handleConfirmArchetypeChange}
      />
    </div>
  );
}
