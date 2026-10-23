'use client';

export interface FilingDraftData {
  companyName?: string;
  crn?: string;
  companyType?: 'TRADING' | 'PROPERTY' | 'DORMANT' | 'MIXED';
  utr?: string;
  registeredAddress?: string;
  directorName?: string;
  directorApprovalDate?: string;
  periodStart?: string;
  periodEnd?: string;
  associatedCompanies?: number;
  averageEmployees?: number;
  isDirectorApproved?: boolean;
  // Trading Stream
  turnover?: number;
  costOfSales?: number;
  otherCharges?: number;
  disallowables?: number;
  fixedAssets?: number;
  capitalAdditions?: number;
  carAdditions?: number;
  mainPoolBroughtForward?: number;
  aiaClaimed?: number;
  // Balance Sheet
  debtors?: number;
  cashAtBank?: number;
  creditorsUnderOneYear?: number;
  shareCapital?: number;
  dividendsPaid?: number;
  openingRetainedEarnings?: number;
  // Property SPV (Schedule A)
  propertyRentalIncome?: number;
  propertyAllowableExpenses?: number;
  propertyMortgageInterest?: number;
  propertyLossBroughtForward?: number;
  // Mixed
  exemptDistributions?: number;
  chargeableGains?: number;
  // Director Loans
  directorLoanAdvance?: number;
  directorLoanDate?: string;
  directorLoanRepaidAmount?: number;
  directorLoanRepaidDate?: string;
  directorLoans?: Array<{
    id: string;
    directorName: string;
    advanceDate: string;
    advanceAmount: number;
    repaidAmount: number;
    repaidDate?: string;
  }>;
  chAuthCode?: string;
  gatewayUserId?: string;
  hasUtrChecked?: boolean;
  hasGatewayChecked?: boolean;
  hasAuthCodeChecked?: boolean;
  [key: string]: any;
}

const STORAGE_PREFIX = 'taxflow_draft_';
const BROADCAST_EVENT = 'taxflow-draft-updated';

/**
 * Retrieves the local filing draft for a given filing ID.
 */
export function getFilingDraft(filingId: string): FilingDraftData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${filingId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[FilingStorage] Failed to read draft from localStorage', err);
    return null;
  }
}

/**
 * Saves filing draft to localStorage and notifies other components in the same window.
 */
export function saveFilingDraft(filingId: string, data: FilingDraftData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${filingId}`, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent(BROADCAST_EVENT, {
        detail: { filingId, data }
      })
    );
  } catch (err) {
    console.warn('[FilingStorage] Failed to save draft to localStorage', err);
  }
}

/**
 * Subscribes to live filing draft updates across wizard, shield, and documents views.
 */
export function subscribeFilingDraft(
  filingId: string,
  callback: (data: FilingDraftData) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ filingId: string; data: FilingDraftData }>;
    if (custom.detail && custom.detail.filingId === filingId) {
      callback(custom.detail.data);
    }
  };

  const storageHandler = (e: StorageEvent) => {
    if (e.key === `${STORAGE_PREFIX}${filingId}` && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch {}
    }
  };

  window.addEventListener(BROADCAST_EVENT, handler);
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener(BROADCAST_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}
