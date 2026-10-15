import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type { CompanyRecord } from '../types.ts';

export class CompanyRepository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  upsert(data: {
    crn: string;
    name: string;
    utr?: string;
    registeredAddress: string;
    companyType?: string;
    isCloseCompany?: boolean;
  }): CompanyRecord {
    const now = new Date().toISOString();
    const existing = this.getByCrn(data.crn);

    if (existing) {
      const updateStmt = this.db.prepare(`
        UPDATE companies
        SET name = ?, utr = ?, registered_address = ?, company_type = ?, is_close_company = ?, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(
        data.name,
        data.utr || existing.utr || null,
        data.registeredAddress,
        data.companyType || existing.companyType,
        data.isCloseCompany !== undefined ? (data.isCloseCompany ? 1 : 0) : (existing.isCloseCompany ? 1 : 0),
        now,
        existing.id
      );
      return this.getById(existing.id)!;
    }

    const id = `co_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const insertStmt = this.db.prepare(`
      INSERT INTO companies (id, crn, name, utr, registered_address, company_type, is_close_company, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      id,
      data.crn.toUpperCase().trim(),
      data.name.trim(),
      data.utr || null,
      data.registeredAddress.trim(),
      data.companyType || 'ltd',
      data.isCloseCompany !== false ? 1 : 0,
      now,
      now
    );

    return this.getById(id)!;
  }

  getByCrn(crn: string): CompanyRecord | null {
    const stmt = this.db.prepare(`
      SELECT id, crn, name, utr, registered_address as registeredAddress, company_type as companyType,
             is_close_company as isCloseCompany, created_at as createdAt, updated_at as updatedAt
      FROM companies
      WHERE UPPER(crn) = UPPER(?)
    `);
    const row = stmt.get(crn.trim()) as any;
    if (!row) return null;
    return {
      ...row,
      isCloseCompany: Boolean(row.isCloseCompany)
    };
  }

  getById(id: string): CompanyRecord | null {
    const stmt = this.db.prepare(`
      SELECT id, crn, name, utr, registered_address as registeredAddress, company_type as companyType,
             is_close_company as isCloseCompany, created_at as createdAt, updated_at as updatedAt
      FROM companies
      WHERE id = ?
    `);
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      isCloseCompany: Boolean(row.isCloseCompany)
    };
  }

  list(): CompanyRecord[] {
    const stmt = this.db.prepare(`
      SELECT id, crn, name, utr, registered_address as registeredAddress, company_type as companyType,
             is_close_company as isCloseCompany, created_at as createdAt, updated_at as updatedAt
      FROM companies
      ORDER BY updated_at DESC
    `);
    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      ...row,
      isCloseCompany: Boolean(row.isCloseCompany)
    }));
  }
}
