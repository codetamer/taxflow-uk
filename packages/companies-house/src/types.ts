export interface CompaniesHouseAddress {
  premises?: string;
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface CompaniesHouseAccounts {
  accounting_reference_date?: {
    day: string;
    month: string;
  };
  next_accounts?: {
    period_start_on?: string;
    period_end_on?: string;
    due_on?: string;
    overdue?: boolean;
  };
  last_accounts?: {
    period_start_on?: string;
    period_end_on?: string;
    type?: string;
  };
}

export interface CompaniesHouseProfile {
  company_name: string;
  company_number: string;
  company_status: string;
  type: string;
  date_of_creation?: string;
  registered_office_address?: CompaniesHouseAddress;
  accounts?: CompaniesHouseAccounts;
}

export interface CompaniesHouseOfficer {
  name: string;
  officer_role: string;
  appointed_on?: string;
  resigned_on?: string;
  nationality?: string;
  occupation?: string;
}

export interface CompaniesHouseSearchResultItem {
  company_number: string;
  title: string;
  company_status: string;
  company_type: string;
  address_snippet?: string;
  date_of_creation?: string;
  description_snippet?: string;
}

export interface NormalizedCompanyDetails {
  crn: string;
  name: string;
  status: string;
  isActive: boolean;
  companyType: string;
  isMicroEntityEligible: boolean;
  registeredAddress: string;
  periodStart: string;
  periodEnd: string;
  accountsDueDate: string;
  directors: string[];
  isCloseCompany: boolean;
}

export interface CompaniesHouseFilingHistoryItem {
  transaction_id: string;
  category: string;
  type: string;
  date: string;
  description: string;
  description_values?: Record<string, string>;
  links: {
    self?: string;
    document_metadata?: string;
  };
}

export interface CompaniesHouseFilingHistoryResponse {
  total_count: number;
  items: CompaniesHouseFilingHistoryItem[];
}

export interface AccountsDocumentResult {
  crn: string;
  transactionId?: string;
  filingDate?: string;
  periodEnd?: string;
  documentMetadataUrl?: string;
  isAvailable: boolean;
  contentType?: string;
  rawXhtml?: string;
  reason: 'SUCCESS' | 'PAPER_PDF_ONLY' | 'NO_ACCOUNTS_FILED' | 'FETCH_ERROR';
}


