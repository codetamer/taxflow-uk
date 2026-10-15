import type { DatabaseSync } from 'node:sqlite';
import { getDatabase, closeDatabase } from './db.ts';
import { CompanyRepository } from './repositories/company_repo.ts';
import { FilingRepository } from './repositories/filing_repo.ts';
import { AuditLogRepository, PriorYearAccountsRepository } from './repositories/audit_repo.ts';
import { AuthRepository, hashPassword, verifyPassword, hashToken, generateSessionToken } from './auth.ts';

export * from './types.ts';
export * from './schema.ts';
export { getDatabase, closeDatabase };
export {
  CompanyRepository,
  FilingRepository,
  AuditLogRepository,
  PriorYearAccountsRepository,
  AuthRepository,
  hashPassword,
  verifyPassword,
  hashToken,
  generateSessionToken
};

export interface Repositories {
  db: DatabaseSync;
  companies: CompanyRepository;
  filings: FilingRepository;
  auditLogs: AuditLogRepository;
  priorYears: PriorYearAccountsRepository;
  auth: AuthRepository;
}

export function getRepositories(customDb?: DatabaseSync): Repositories {
  const db = customDb || getDatabase();
  return {
    db,
    companies: new CompanyRepository(db),
    filings: new FilingRepository(db),
    auditLogs: new AuditLogRepository(db),
    priorYears: new PriorYearAccountsRepository(db),
    auth: new AuthRepository(db)
  };
}
