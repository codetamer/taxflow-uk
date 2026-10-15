export type FilingStatus =
  | 'DRAFT'
  | 'SHIELD_PASSED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED';

export type UserRole = 'USER' | 'ADMIN';
export type CompanyRole = 'OWNER' | 'DIRECTOR' | 'ACCOUNTANT' | 'VIEWER';
export type GatewayType = 'HMRC' | 'COMPANIES_HOUSE' | 'HMRC_CT600' | 'COMPANIES_HOUSE_ACCOUNTS';
export type GatewayStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserCompanyRecord {
  userId: string;
  companyId: string;
  role: CompanyRole;
  createdAt: string;
}

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

export interface GatewaySubmissionRecord {
  id: string;
  filingId: string;
  gatewayType: GatewayType;
  correlationId: string;
  status: GatewayStatus;
  rawRequestXml?: string;
  rawResponseXml?: string;
  errorCode?: string;
  errorMessage?: string;
  latencyMs: number;
  submittedAt: string;
  completedAt?: string;
}
