'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mainPoolWdaRatePct } from '@taxflow/ct-engine';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FileText,
  Lock,
  Unlock,
  Check,
  BookOpen,
  HelpCircle,
  Info
} from 'lucide-react';
import { runPreFlightShield } from '@taxflow/shield';
import type { ShieldInput, ShieldReport, RuleEvaluation } from '@taxflow/shield';
import { TermExplainer } from '@/components/TermExplainer';
import { getFilingDraft, subscribeFilingDraft } from '@/lib/filingClientStorage';
import { GlossaryModal } from '@/components/GlossaryModal';
import { ComplianceScoreRing } from '@/components/ComplianceScoreRing';

const GBP = (pounds: number) => Math.round(pounds * 100);

const cleanBenchmarkInput: ShieldInput = {
  entity: {
    crn: '15152081',
    companyName: 'DROPLOGICX LTD',
    companyType: 'TRADING',
    utr: '1234567890',
    isCloseCompany: true,
    isCharityOrPlc: false,
    chAuthCode: 'ABC123',
    gatewayUserId: '123456789012',
    gatewayPassword: 'SecretPassword123!'
  },
  period: {
    periodStart: '2025-10-01',
    periodEnd: '2026-09-30',
    priorPeriodEnd: '2025-09-30',
    daysInYearBasis: 365,
    paymentDueDate: '2027-07-01',
    accountsApprovalDate: '2026-10-15',
    directorDeclarationName: 'Muhammad Saif Raza',
    isDirectorApproved: true
  },
  ledger: {
    turnoverPence: GBP(100000),
    costOfSalesPence: GBP(20000),
    staffCostsPence: 0,
    depreciationPence: 0,
    otherChargesPence: GBP(48100),
    clientEntertainingPence: GBP(3100),
    finesPence: 0,
    bankInterestPence: 0,
    taxExpensePence: GBP(3800),
    netProfitAfterTaxPence: GBP(28100),
    dividendsPaidPence: GBP(10000),
    openingRetainedEarningsPence: GBP(15200),
    closingRetainedEarningsPence: GBP(33300),
    fixedAssetsPence: GBP(15000),
    debtorsPence: GBP(10000),
    cashPence: GBP(33400),
    creditorsUnderOneYearPence: GBP(25000),
    creditorsOverOneYearPence: 0,
    provisionsPence: 0,
    shareCapitalPence: GBP(100),
    employeeCount: 1
  },
  tax: {
    tradingProfitPence: GBP(20000),
    nonTradingIncomePence: 0,
    exemptDistributionsPence: 0,
    ttpPence: GBP(20000),
    augmentedProfitsPence: GBP(20000),
    lowerLimitPence: GBP(50000),
    upperLimitPence: GBP(250000),
    ctBeforeReliefPence: GBP(3800),
    marginalReliefPence: 0,
    ctPayablePence: GBP(3800),
    mainPoolWdaRatePct: (182 * 18 + 183 * 14) / 365,
    mainPoolBalancePence: 0,
    carAiaClaimedPence: 0,
    zeroEmissionFyaClaimedPence: 0,
    directorLoans: [],
    s455TaxPence: 0
  }
};

interface CategoryDetail {
  summary: string;
  why: string;
  consequence: string;
  remedy: string;
  glossaryTerm?: string;
  statutoryRef: string;
}

const categoryExplanations: Record<string, CategoryDetail> = {
  'Category 1: Double-Entry Balance Sheet Symmetry': {
    summary: 'Ensures what your company owns minus what it owes equals shareholders\' funds down to the exact single penny.',
    why: 'Companies House automated validation servers perform strict relational integrity tests. Net Assets must match Shareholders\' Funds to the exact penny.',
    consequence: 'Immediate electronic filing rejection with Gateway Error 1000 ("Balance sheet does not balance").',
    remedy: 'TaxFlow\'s integer-pence engine automatically enforces Net Assets === Shareholders\' Funds symmetry before packaging.',
    glossaryTerm: 'balance-sheet-symmetry',
    statutoryRef: 'Companies Act 2006 s396 & FRS 105 Section 4'
  },
  'Category 2: Reserves & Retained Earnings Reconciliation': {
    summary: 'Checks that dividends were paid only out of accumulated post-tax profits.',
    why: 'UK law strictly forbids paying dividends unless the company has accumulated realized profits remaining after tax provisions.',
    consequence: 'Payment is classified as an unlawful "ultra vires" dividend under CA 2006 s830, leading to severe tax penalties and director liabilities.',
    remedy: 'TaxFlow blocks dividend declarations if closing retained earnings would turn negative.',
    glossaryTerm: 'distributable-reserves',
    statutoryRef: 'Companies Act 2006 s830'
  },
  'Category 3: CT600 Box Parity & Cross-Checking': {
    summary: 'Cross-checks your HMRC Corporation Tax return boxes against your Companies House annual accounts.',
    why: 'HMRC and Companies House cross-reference data. The turnover, cost of sales, and profit figures on your CT600 must match your FRS 105 accounts.',
    consequence: 'HMRC Gateway Error 3001 or compliance audit for discrepancy between accounts and tax return.',
    remedy: 'TaxFlow generates both documents from a single unified ledger, ensuring 100% mathematical parity across all boxes.',
    glossaryTerm: 'ct600',
    statutoryRef: 'Corporation Tax Act 2010 Part 2'
  },
  'Category 4: Micro-Entity Boundary & Eligibility': {
    summary: 'Confirms your business qualifies for simplified FRS 105 accounts without needing an expensive external audit.',
    why: 'Companies must meet at least 2 of 3 criteria (turnover <= £1,000,000, balance sheet total <= £500,000, employees <= 10) to qualify as a micro-entity.',
    consequence: 'Accounts rejected by Companies House for unauthorized use of micro-entity format; forced full FRS 102 audit costing £5,000+.',
    remedy: 'Automated threshold monitoring verifies your company is safely within the official micro-entity size limit.',
    glossaryTerm: 'frs-105',
    statutoryRef: 'Companies Act 2006 s384A & s477'
  },
  'Category 5: Period Consistency & Filing Deadlines': {
    summary: 'Audits accounting period dates, ensures periods do not exceed 12 months, and verifies official filing deadlines.',
    why: 'HMRC only accepts returns for periods up to 12 months. Longer periods must be split into two separate CT600 returns.',
    consequence: 'HMRC Gateway Error 8016 ("Accounting period exceeds 365 days") and late filing penalties starting at £100.',
    remedy: 'TaxFlow automatically splits long periods into two consecutive returns (365 days + remaining days) under CTA 2009 s10.',
    glossaryTerm: 'ct600',
    statutoryRef: 'Corporation Tax Act 2009 s10 & TMA 1970 s59D'
  },
  'Category 6: Close Company Director Loans & s455': {
    summary: 'Tracks any money borrowed from the company and verifies the 9-month repayment relief rule.',
    why: 'Loans to directors of close companies not repaid within 9 months and 1 day after year-end trigger a mandatory 33.75% tax charge (or 35.75% for loans made on/after 6 April 2026).',
    consequence: 'HMRC compliance notice, interest charges, and surprise 33.75% / 35.75% tax bill under CTA 2010 s455.',
    remedy: 'TaxFlow tracks loan advance dates and automatically files Section 458 relief claims when repaid within the 9-month window.',
    glossaryTerm: 's455-loan',
    statutoryRef: 'Corporation Tax Act 2010 s455 & s458'
  },
  'Category 7: Capital Allowances & AIA Integrity': {
    summary: 'Verifies 100% tax deductions on business equipment and guards against improper claims on company cars.',
    why: 'Annual Investment Allowance (AIA) permits 100% first-year deduction on plant & machinery, but passenger cars are legally excluded.',
    consequence: 'HMRC enquiry and penalty under Schedule 24 FA 2007 for claiming AIA on ineligible motor vehicles.',
    remedy: 'The Shield verifies that 100% AIA is only applied to qualifying computers and machinery, and enforces hybrid Writing Down Allowances on cars.',
    glossaryTerm: 'capital-allowances-aia',
    statutoryRef: 'Capital Allowances Act 2001 s38A & s38B'
  },
  'Category 8: Gateway Credentials & Technical Pre-Flight': {
    summary: 'Confirms all Companies House auth codes and HMRC credentials are valid for electronic XML transmission.',
    why: 'Government gateways require authenticated digital signatures and valid XML Canonicalization (C14N) hashes.',
    consequence: 'Immediate rejection code 400/500 with cryptographically invalid IRmark or missing auth credentials.',
    remedy: 'Live gateway credential validation and deterministic SHA-1 IRmark generation prior to payload dispatch.',
    glossaryTerm: 'ixbrl-irmark',
    statutoryRef: 'HMRC GovTalk Specifications / ECCTA 2023'
  }
};

export default function ShieldDashboardPage() {
  const params = useParams();
  const filingId = (params?.id as string) || 'fil_demo';
  const [userFilingData, setUserFilingData] = useState<any>(null);
  const [activeScenario, setActiveScenario] = useState<'user_filing' | 'clean' | 'imbalance' | 'dividend' | 'car_aia' | 'credentials'>('user_filing');
  const [statusFilter, setStatusFilter] = useState<'all' | 'fail' | 'fatal' | 'warn'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedRuleIds, setExpandedRuleIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [initialGlossaryTerm, setInitialGlossaryTerm] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isSimDrawerOpen, setIsSimDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Immediately hydrate from shared in-browser filing state (FE-01)
    const localDraft = getFilingDraft(filingId);
    if (localDraft) {
      setUserFilingData((prev: any) => ({
        ...prev,
        formData: localDraft,
        company: {
          crn: localDraft.crn || '15152081',
          companyName: localDraft.companyName || 'DROPLOGICX LTD'
        }
      }));
    }

    // 2. Subscribe to real-time draft updates from wizard edits in other components/tabs
    const unsubscribe = subscribeFilingDraft(filingId, (updatedDraft) => {
      setUserFilingData((prev: any) => ({
        ...prev,
        formData: updatedDraft,
        company: {
          crn: updatedDraft.crn || prev?.company?.crn || '15152081',
          companyName: updatedDraft.companyName || prev?.company?.companyName || 'DROPLOGICX LTD'
        }
      }));
    });

    // 3. Supplement with server data if available
    async function loadFiling() {
      try {
        const res = await fetch(`/api/filings/${filingId}`);
        const data = await res.json();
        if (data.success && data.filing) {
          setUserFilingData((prev: any) => {
            // Keep local draft if user edited, otherwise use server
            const formData = localDraft || data.filing.formData || prev?.formData;
            return {
              ...data.filing,
              formData,
              company: data.filing.company || prev?.company
            };
          });
        }
      } catch {
        // Keep local draft
      }
    }
    loadFiling();

    return () => unsubscribe();
  }, [filingId]);

  const openGlossary = (termId: string) => {
    setInitialGlossaryTerm(termId);
    setIsGlossaryOpen(true);
  };

  const toggleRuleExpand = (id: string) => {
    setExpandedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getScenarioInput = (scenario: typeof activeScenario): ShieldInput => {
    if (scenario === 'user_filing' && userFilingData?.formData) {
      const f = userFilingData.formData;
      const archetype: 'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED_INCOME' =
        f.companyType === 'DORMANT'
          ? 'DORMANT'
          : f.companyType === 'PROPERTY'
          ? 'PROPERTY'
          : f.companyType === 'MIXED'
          ? 'MIXED_INCOME'
          : 'TRADING';

      const isDormant = archetype === 'DORMANT';
      const isProperty = archetype === 'PROPERTY';
      const isMixed = archetype === 'MIXED_INCOME';

      const periodStart = f.periodStart || '2025-10-01';
      const periodEnd = f.periodEnd || '2026-09-30';

      const turnoverPence = isDormant
        ? Math.round((Number(f.turnover) || 0) * 100)
        : isProperty
        ? Math.round((Number(f.propertyRentalIncome ?? 36000)) * 100)
        : Math.round((Number(f.turnover ?? 100000)) * 100);

      const costOfSalesPence = isDormant
        ? Math.round((Number(f.costOfSales) || 0) * 100)
        : isProperty
        ? 0
        : Math.round((Number(f.costOfSales ?? 20000)) * 100);

      const propertyExpensesPence = isProperty || isMixed ? Math.round((Number(f.propertyAllowableExpenses ?? 6000)) * 100) : 0;
      const propertyMortgageInterestPence = isProperty || isMixed ? Math.round((Number(f.propertyMortgageInterest ?? 12000)) * 100) : 0;

      const otherChargesPence = isDormant
        ? Math.round((Number(f.otherCharges) || 0) * 100)
        : isProperty
        ? propertyExpensesPence + propertyMortgageInterestPence
        : Math.round((Number(f.otherCharges ?? 48100)) * 100);

      const clientEntertainingPence = isDormant || isProperty ? 0 : Math.round((Number(f.disallowables ?? 3100)) * 100);

      const shareCapitalPence = Math.round((Number(f.shareCapital ?? 100)) * 100);
      const fixedAssetsPence = isDormant ? 0 : Math.round((Number(f.fixedAssets ?? 15000)) * 100);
      const debtorsPence = isDormant ? 0 : Math.round((Number(f.debtors ?? 10000)) * 100);
      const cashPence = isDormant ? shareCapitalPence : Math.round((Number(f.cashAtBank ?? 33400)) * 100);
      const creditorsUnderOneYearPence = isDormant ? 0 : Math.round((Number(f.creditorsUnderOneYear ?? 25000)) * 100);
      const openingRetainedEarningsPence = isDormant ? 0 : Math.round((Number(f.openingRetainedEarnings ?? 15200)) * 100);
      const dividendsPaidPence = isDormant ? 0 : Math.round((Number(f.dividendsPaid ?? 10000)) * 100);

      const operatingProfitPence = isDormant ? 0 : turnoverPence - costOfSalesPence - otherChargesPence;
      const capitalAdditionsPence = isDormant ? 0 : Math.round((Number(f.capitalAdditions ?? f.fixedAssets ?? 15000)) * 100);
      const aiaClaimedPence = isDormant ? 0 : Math.round((Number(f.aiaClaimed ?? 15000)) * 100);
      const mainPoolBalancePence = Math.max(0, capitalAdditionsPence - aiaClaimedPence);

      const taxableProfitPence = isDormant
        ? 0
        : isProperty
        ? Math.max(0, turnoverPence - otherChargesPence)
        : Math.max(0, operatingProfitPence + clientEntertainingPence - aiaClaimedPence);

      const ctPayablePence = isDormant ? 0 : Math.round(taxableProfitPence * 0.19);
      const netProfitAfterTaxPence = isDormant ? 0 : operatingProfitPence - ctPayablePence;
      const closingRetainedEarningsPence = isDormant
        ? 0
        : openingRetainedEarningsPence + netProfitAfterTaxPence - dividendsPaidPence;

      const statutoryWda = mainPoolWdaRatePct({ start: periodStart, end: periodEnd });

      // Parse multi-loan schedule for s455 (FE-01)
      const rawLoans = Array.isArray(f.directorLoans) && f.directorLoans.length > 0
        ? f.directorLoans
        : (f.directorLoanAdvance && Number(f.directorLoanAdvance) > 0)
        ? [{
            id: 'loan_user_1',
            directorName: f.directorName || 'Muhammad Saif Raza',
            advanceDate: f.directorLoanDate || periodStart,
            advanceAmount: Number(f.directorLoanAdvance),
            repaidAmount: Number(f.directorLoanRepaidAmount || 0),
            repaidDate: f.directorLoanRepaidDate || ''
          }]
        : [];

      const directorLoansList = rawLoans
        .filter((l: any) => (Number(l.advanceAmount) || 0) > 0)
        .map((l: any, idx: number) => {
          const adv = Number(l.advanceAmount) || 0;
          const rep = Number(l.repaidAmount) || 0;
          const outstanding = Math.max(0, adv - rep);
          return {
            id: l.id || `loan_${idx}`,
            madeOn: l.advanceDate || periodStart,
            outstandingAtDueDatePence: Math.round(outstanding * 100)
          };
        });

      const s455TaxPence = rawLoans.reduce((total: number, loan: any) => {
        const adv = Number(loan.advanceAmount) || 0;
        const rep = Number(loan.repaidAmount) || 0;
        const outstanding = Math.max(0, adv - rep);
        if (outstanding <= 0) return total;
        const ratePct = loan.advanceDate && loan.advanceDate >= '2026-04-06' ? 35.75 : 33.75;
        return total + Math.round(outstanding * ratePct);
      }, 0);

      return {
        entity: {
          crn: f.crn || userFilingData.company?.crn || '15152081',
          companyName: f.companyName || userFilingData.company?.companyName || 'DROPLOGICX LTD',
          companyType: archetype,
          utr: f.utr || '1234567890',
          isCloseCompany: true,
          isCharityOrPlc: false,
          chAuthCode: 'ABC123',
          gatewayUserId: '123456789012',
          gatewayPassword: 'SecretPassword123!'
        },
        period: {
          periodStart,
          periodEnd,
          priorPeriodEnd: f.priorPeriodEnd || (f.crn === '15152081' ? '2025-09-30' : undefined),
          daysInYearBasis: 365,
          paymentDueDate: '2027-07-01',
          accountsApprovalDate: '2026-10-15',
          directorDeclarationName: f.directorName || 'Muhammad Saif Raza',
          isDirectorApproved: f.isDirectorApproved ?? true
        },
        ledger: {
          turnoverPence,
          costOfSalesPence,
          staffCostsPence: 0,
          depreciationPence: 0,
          otherChargesPence,
          clientEntertainingPence,
          finesPence: 0,
          bankInterestPence: 0,
          taxExpensePence: ctPayablePence,
          netProfitAfterTaxPence,
          dividendsPaidPence,
          openingRetainedEarningsPence,
          closingRetainedEarningsPence,
          fixedAssetsPence,
          debtorsPence,
          cashPence,
          creditorsUnderOneYearPence,
          creditorsOverOneYearPence: 0,
          provisionsPence: 0,
          shareCapitalPence,
          employeeCount: isDormant ? 0 : (f.averageEmployees || 1)
        },
        tax: {
          tradingProfitPence: isProperty ? 0 : taxableProfitPence,
          nonTradingIncomePence: isProperty ? taxableProfitPence : 0,
          exemptDistributionsPence: 0,
          ttpPence: taxableProfitPence,
          augmentedProfitsPence: taxableProfitPence,
          lowerLimitPence: GBP(50000),
          upperLimitPence: GBP(250000),
          ctBeforeReliefPence: ctPayablePence,
          marginalReliefPence: 0,
          ctPayablePence,
          mainPoolWdaRatePct: statutoryWda,
          mainPoolBalancePence,
          carAiaClaimedPence: 0,
          zeroEmissionFyaClaimedPence: 0,
          directorLoans: directorLoansList,
          s455TaxPence: isDormant ? 0 : s455TaxPence
        }
      };
    }

    const input = JSON.parse(JSON.stringify(cleanBenchmarkInput)) as ShieldInput;
    if (scenario === 'imbalance') {
      input.ledger.cashPence += 1;
    } else if (scenario === 'dividend') {
      input.ledger.dividendsPaidPence = GBP(50000);
      input.ledger.closingRetainedEarningsPence =
        input.ledger.openingRetainedEarningsPence + input.ledger.netProfitAfterTaxPence - input.ledger.dividendsPaidPence;
    } else if (scenario === 'car_aia') {
      input.tax.carAiaClaimedPence = GBP(15000);
    } else if (scenario === 'credentials') {
      input.entity.chAuthCode = '';
      input.entity.gatewayUserId = '';
    }
    return input;
  };

  const report: ShieldReport = useMemo(() => {
    return runPreFlightShield(getScenarioInput(activeScenario));
  }, [activeScenario]);

  const fatalErrors = report.evaluations.filter((e) => e.status === 'FAIL' && e.severity === 'FATAL');
  const warnings = report.evaluations.filter((e) => e.status === 'FAIL' && e.severity === 'WARN');

  const allCategoryNames = useMemo(() => {
    return Array.from(new Set(report.evaluations.map((e) => e.category)));
  }, [report.evaluations]);

  const filteredEvaluations = useMemo(() => {
    return report.evaluations.filter((ev) => {
      if (statusFilter === 'fail' && ev.status !== 'FAIL') return false;
      if (statusFilter === 'fatal' && !(ev.status === 'FAIL' && ev.severity === 'FATAL')) return false;
      if (statusFilter === 'warn' && !(ev.status === 'FAIL' && ev.severity === 'WARN')) return false;

      if (selectedCategory !== 'ALL' && ev.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = ev.id.toLowerCase().includes(q);
        const matchesName = ev.name.toLowerCase().includes(q);
        const matchesCategory = ev.category.toLowerCase().includes(q);
        const matchesMessage = ev.message.toLowerCase().includes(q);
        return matchesId || matchesName || matchesCategory || matchesMessage;
      }

      return true;
    });
  }, [report.evaluations, statusFilter, selectedCategory, searchQuery]);

  const groupedCategories = useMemo(() => {
    const map = new Map<string, RuleEvaluation[]>();
    for (const ev of filteredEvaluations) {
      const list = map.get(ev.category) || [];
      list.push(ev);
      map.set(ev.category, list);
    }
    return Array.from(map.entries());
  }, [filteredEvaluations]);

  const getWizardFixLink = (category: string) => {
    if (category.includes('Category 1') || category.includes('Category 2')) {
      return `/filings/${filingId}/wizard?step=2#balanceSheet`;
    }
    if (category.includes('Category 3')) {
      return `/filings/${filingId}/wizard?step=2#pnl`;
    }
    if (category.includes('Category 6')) {
      return `/filings/${filingId}/wizard?step=2#loans`;
    }
    if (category.includes('Category 7')) {
      return `/filings/${filingId}/wizard?step=2#allowances`;
    }
    return `/filings/${filingId}/wizard?step=1`;
  };

  // Auto-collapse passing categories by default so users focus only on active blockers
  useEffect(() => {
    const passing = new Set<string>();
    groupedCategories.forEach(([catName, rules]) => {
      const allPass = rules.every((r) => r.status === 'PASS');
      if (allPass) passing.add(catName);
    });
    setCollapsedCategories(passing);
  }, [report, groupedCategories]);

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  const toggleAllCategories = () => {
    if (collapsedCategories.size > 0) {
      setCollapsedCategories(new Set());
    } else {
      const all = new Set(groupedCategories.map(([catName]) => catName));
      setCollapsedCategories(all);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Cockpit Status Banner */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight">40-Point Pre-Flight Rejection Shield</h1>
                <span className="bg-slate-800 text-slate-300 font-mono text-[11px] px-2 py-0.5 rounded-full border border-slate-700">
                  GovTalk &amp; Schema Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated pre-flight defense verifying all 40 mathematical and regulatory rules before submission.
              </p>
            </div>
          </div>
        </div>

        {/* Live Gateway Gate Badge & Score Ring */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start md:self-auto">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex items-center space-x-3">
            <ComplianceScoreRing
              totalChecks={report.totalRulesEvaluated}
              passedCount={report.passedCount}
              fatalCount={fatalErrors.length}
              warnCount={warnings.length}
              size="md"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-white font-mono">
                {report.passedCount} / {report.totalRulesEvaluated} Checks
              </p>
              <p className="text-[10px] text-slate-400">
                {fatalErrors.length === 0 ? 'All Rules Verified' : `${fatalErrors.length} Fatal Blockers`}
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center space-x-3 ${
            report.passed
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-red-950/40 border-red-800/80 text-red-300'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              report.passed ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
            }`}>
              {report.passed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Government Gateway Status</p>
              <p className="text-sm font-bold font-mono">
                {report.passed ? 'UNLOCKED (0 FATAL ERRORS)' : `BLOCKED (${fatalErrors.length} FATAL ERROR)`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Human Guidance Card */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-amber-700" />
            <span>Why Does This Diagnostic Screen Exist?</span>
          </h3>
          <p className="text-xs text-stone-800 leading-relaxed max-w-3xl">
            Government computer systems at Companies House and HMRC reject filings for simple mathematical rounding errors, missing legal declarations, or illegal dividends. TaxFlow checks all 40 rules <strong>before</strong> you submit, saving you weeks of stressful rejection notices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openGlossary('balance-sheet-symmetry')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100/60 border border-amber-300 px-3.5 py-2 rounded-xl transition shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>Search Tax Glossary</span>
        </button>
      </div>

      {/* Interactive Simulation Sandbox (Collapsible Drawer) */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Error Defense Simulator (Demo / Reviewer Testing)
              </h2>
              <p className="text-[11px] text-slate-400">
                Inject intentional statutory faults to verify the Shield's real-time interception.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSimDrawerOpen(!isSimDrawerOpen)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold border border-slate-700 transition self-start sm:self-auto"
          >
            {isSimDrawerOpen ? 'Hide Simulation Chips' : '⚡ Open Fault Injector'}
          </button>
        </div>

        {isSimDrawerOpen && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800/80 animate-in fade-in-50 duration-150">
            {userFilingData?.formData && (
              <button
                onClick={() => setActiveScenario('user_filing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                  activeScenario === 'user_filing'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  My Live Filing ({userFilingData.formData.companyName || 'DROPLOGICX LTD'})
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveScenario('clean')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeScenario === 'clean'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clean Benchmark (40/40)</span>
            </button>

            <button
              onClick={() => setActiveScenario('imbalance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeScenario === 'imbalance'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>1p Balance Sheet Imbalance</span>
            </button>

            <button
              onClick={() => setActiveScenario('dividend')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeScenario === 'dividend'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Illegal Dividend Over Reserves</span>
            </button>

            <button
              onClick={() => setActiveScenario('car_aia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeScenario === 'car_aia'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Car Claiming 100% AIA</span>
            </button>

            <button
              onClick={() => setActiveScenario('credentials')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeScenario === 'credentials'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Missing Gateway Auth Credentials</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Rules Evaluated</p>
            <p className="text-2xl font-bold text-slate-950 font-mono">{report.totalRulesEvaluated}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Passed Checks</p>
            <p className="text-2xl font-bold text-emerald-700 font-mono">{report.passedCount}</p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Fatal Failures</p>
            <p className={`text-2xl font-bold font-mono ${fatalErrors.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {fatalErrors.length}
            </p>
          </div>
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            fatalErrors.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
          }`}>
            <XCircle className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Advisory Warnings</p>
            <p className={`text-2xl font-bold font-mono ${warnings.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {warnings.length}
            </p>
          </div>
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            warnings.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Fatal Error Action Box if any */}
      {fatalErrors.length > 0 && (
        <div className="bg-red-50/80 border-2 border-red-300 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-base">Submission Gate Locked: Fatal Rejection Errors Intercepted</h3>
          </div>
          <p className="text-xs text-red-800 leading-relaxed">
            These compliance errors would cause an immediate Gateway rejection code (e.g. 1000, 3001, 8016) from Companies House or HMRC. You must resolve these before submission.
          </p>

          <div className="space-y-3 pt-1">
            {fatalErrors.map((err) => (
              <div key={err.id} className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    {err.id} · {err.name}
                  </span>
                  <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">FATAL REJECTION</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{err.message}</p>
                {err.remediation && (
                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900">Recommended Resolution & Guidance:</span>
                    <p className="text-slate-600">{err.remediation}</p>
                  </div>
                )}
                <div className="pt-2 flex justify-end">
                  <Link
                    href={getWizardFixLink(err.category)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <span>Fix in Wizard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              All Checks ({report.totalRulesEvaluated})
            </button>
            <button
              onClick={() => setStatusFilter('fail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'fail' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Issues Only ({fatalErrors.length + warnings.length})
            </button>
            <button
              onClick={() => setStatusFilter('fatal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'fatal' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Fatal ({fatalErrors.length})
            </button>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={toggleAllCategories}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition whitespace-nowrap"
            >
              {collapsedCategories.size > 0 ? 'Expand All Categories' : 'Collapse Passing Categories'}
            </button>
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search checks by name or code (e.g. BFS-01)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition ${
              selectedCategory === 'ALL'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All 8 Categories
          </button>
          {allCategoryNames.map((cat) => {
            const shortName = cat.split(':')[1]?.trim() || cat;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* The 40 Rules Breakdown by Category */}
      <div className="space-y-6">
        {groupedCategories.map(([categoryName, rules]) => {
          const categoryPassCount = rules.filter((r) => r.status === 'PASS').length;
          const isCategoryAllPass = categoryPassCount === rules.length;
          const explanation = categoryExplanations[categoryName];
          const isCollapsed = collapsedCategories.has(categoryName);

          return (
            <div key={categoryName} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all">
              {/* Category Header (Click to toggle accordion) */}
              <div 
                onClick={() => toggleCategory(categoryName)}
                className="bg-slate-50/90 px-6 py-4 border-b border-slate-200 cursor-pointer hover:bg-slate-100/80 transition flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center space-x-3.5">
                  <span className={`p-1.5 rounded-lg border transition ${
                    isCollapsed ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-950">{categoryName}</h3>
                      {explanation?.glossaryTerm && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openGlossary(explanation.glossaryTerm!);
                          }}
                          className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold hover:bg-emerald-100 transition"
                        >
                          Audit Guide
                        </button>
                      )}
                    </div>
                    {explanation && (
                      <p className="text-xs text-slate-600 max-w-3xl leading-relaxed mt-0.5 line-clamp-1">
                        {explanation.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    isCategoryAllPass
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {isCategoryAllPass ? `✓ ${categoryPassCount} / ${rules.length} Verified` : `⚠ ${categoryPassCount} / ${rules.length} Action Needed`}
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </span>
                </div>
              </div>

              {!isCollapsed && (
                <>
                  {/* Legal & Rule Background Detail Box */}
                  {explanation && (
                    <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200/60">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-0.5">
                          <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                            Official Legal Rule
                          </span>
                          <p className="text-slate-600 font-mono text-[10px]">{explanation.statutoryRef}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-0.5">
                          <span className="font-bold text-red-800 uppercase tracking-wider text-[10px] block">
                            Consequence of Non-Compliance
                          </span>
                          <p className="text-slate-600 leading-tight">{explanation.consequence}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-0.5">
                          <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
                            TaxFlow Pre-Flight Guarantee
                          </span>
                          <p className="text-slate-600 leading-tight">{explanation.remedy}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rules List */}
                  <div className="divide-y divide-slate-100">
                    {rules.map((rule) => {
                      const isPass = rule.status === 'PASS';
                      const isFatal = rule.severity === 'FATAL';
                      const isExpanded = expandedRuleIds.has(rule.id);

                      return (
                        <div key={rule.id} className="p-5 hover:bg-slate-50/50 transition space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start space-x-3.5">
                              <span className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 ${
                                isPass ? 'text-emerald-600' : isFatal ? 'text-red-600' : 'text-amber-600'
                              }`}>
                                {isPass ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : isFatal ? (
                                  <XCircle className="w-5 h-5" />
                                ) : (
                                  <AlertTriangle className="w-5 h-5" />
                                )}
                              </span>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {rule.id}
                                  </span>
                                  <span className="text-sm font-semibold text-slate-950">{rule.name}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{rule.message}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                              {!isPass && (
                                <Link
                                  href={getWizardFixLink(rule.category)}
                                  className="text-[11px] font-bold text-slate-900 hover:text-white bg-slate-100 hover:bg-slate-900 border border-slate-200 px-2.5 py-1 rounded-lg transition flex items-center space-x-1"
                                >
                                  <span>Fix</span>
                                  <ArrowRight className="w-3 h-3 text-amber-500" />
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleRuleExpand(rule.id)}
                                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition flex items-center space-x-1"
                              >
                                <span>{isExpanded ? 'Less' : 'Rules & Details'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                isPass
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : isFatal
                                  ? 'bg-red-50 text-red-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}>
                                {isPass ? 'VERIFIED' : isFatal ? 'FATAL ERROR' : 'WARNING'}
                              </span>
                            </div>
                          </div>

                          {/* Expandable Rule Rationale Drawer */}
                          {isExpanded && (
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs animate-in fade-in-50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Legal Basis & Official Rule
                                  </span>
                                  <p className="font-mono text-slate-800 font-semibold text-[11px]">
                                    {explanation?.statutoryRef || 'Companies Act 2006 & CTA 2010'}
                                  </p>
                                  <p className="text-slate-500 text-[11px]">
                                    {explanation?.why || 'Required for official submission parity.'}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Automated Defense Mechanics
                                  </span>
                                  <p className="text-slate-700 text-[11px] leading-relaxed">
                                    {explanation?.remedy || 'Automatically verified against GovTalk XML schema specifications.'}
                                  </p>
                                </div>
                              </div>

                              {rule.remediation && !isPass && (
                                <div className="bg-white p-3 rounded-xl border border-red-200 space-y-1 mt-2">
                                  <span className="font-bold text-red-900 block text-[11px]">How to Remediate:</span>
                                  <span className="text-slate-700 text-[11px] leading-relaxed">{rule.remediation}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        initialTermId={initialGlossaryTerm}
      />
    </div>
  );
}
