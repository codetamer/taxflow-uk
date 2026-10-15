export type FilingStatus =
  | 'DRAFT'
  | 'SHIELD_PASSED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED';

export interface CompanyRecord {
  id: string;
  crn: string;
  name: string;
  utr?: string;
  registeredAddress: string;
  companyType: string;
  isCloseCompany: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilingRecord {
  id: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: FilingStatus;
  directorName: string;
  directorApprovalDate?: string;
  directorLegalDeclaration: boolean;
  isPaid: boolean;
  paymentReference?: string;
  paidAmountPence: number;
  trialBalanceJson?: string;
  taxAdjustmentsJson?: string;
  calculationResultJson?: string;
  shieldResultJson?: string;
  irmarkBase64?: string;
  irmarkBase32?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  filingId: string;
  action: string;
  actor: string;
  detailsJson?: string;
  timestamp: string;
}

export interface PriorYearAccountsRecord {
  id: string;
  companyId: string;
  periodEnd: string;
  turnoverPence: number;
  costOfSalesPence: number;
  tangibleFixedAssetsPence: number;
  debtorsPence: number;
  cashAtBankPence: number;
  creditorsDueWithinOneYearPence: number;
  calledUpShareCapitalPence: number;
  profitAndLossReservePence: number;
  createdAt: string;
}
