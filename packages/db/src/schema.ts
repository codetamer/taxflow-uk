export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  crn TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  utr TEXT,
  registered_address TEXT NOT NULL,
  company_type TEXT NOT NULL DEFAULT 'ltd',
  is_close_company INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_crn ON companies(crn);

CREATE TABLE IF NOT EXISTS filings (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  director_name TEXT NOT NULL,
  director_approval_date TEXT,
  director_legal_declaration INTEGER NOT NULL DEFAULT 0,
  is_paid INTEGER NOT NULL DEFAULT 0,
  payment_reference TEXT,
  paid_amount_pence INTEGER NOT NULL DEFAULT 0,
  trial_balance_json TEXT,
  tax_adjustments_json TEXT,
  calculation_result_json TEXT,
  shield_result_json TEXT,
  irmark_base64 TEXT,
  irmark_base32 TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_filings_company_id ON filings(company_id);
CREATE INDEX IF NOT EXISTS idx_filings_status ON filings(status);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  filing_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'DIRECTOR',
  details_json TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (filing_id) REFERENCES filings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_filing_id ON audit_logs(filing_id);

CREATE TABLE IF NOT EXISTS prior_year_accounts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  period_end TEXT NOT NULL,
  turnover_pence INTEGER NOT NULL DEFAULT 0,
  cost_of_sales_pence INTEGER NOT NULL DEFAULT 0,
  tangible_fixed_assets_pence INTEGER NOT NULL DEFAULT 0,
  debtors_pence INTEGER NOT NULL DEFAULT 0,
  cash_at_bank_pence INTEGER NOT NULL DEFAULT 0,
  creditors_due_within_one_year_pence INTEGER NOT NULL DEFAULT 0,
  called_up_share_capital_pence INTEGER NOT NULL DEFAULT 0,
  profit_and_loss_reserve_pence INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(company_id, period_end)
);
`;
