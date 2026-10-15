import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type { AuditLogRecord, PriorYearAccountsRecord } from '../types.ts';

export class AuditLogRepository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  append(filingId: string, action: string, details?: any, actor: string = 'DIRECTOR'): AuditLogRecord {
    const id = `aud_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const detailsJson = details ? JSON.stringify(details) : null;

    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, filing_id, action, actor, details_json, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, filingId, action, actor, detailsJson, now);

    return {
      id,
      filingId,
      action,
      actor,
      detailsJson: detailsJson || undefined,
      timestamp: now
    };
  }

  listByFiling(filingId: string): AuditLogRecord[] {
    const stmt = this.db.prepare(`
      SELECT id, filing_id as filingId, action, actor, details_json as detailsJson, timestamp
      FROM audit_logs
      WHERE filing_id = ?
      ORDER BY timestamp ASC
    `);

    return stmt.all(filingId) as any[];
  }
}

export class PriorYearAccountsRepository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  upsert(data: Omit<PriorYearAccountsRecord, 'id' | 'createdAt'>): PriorYearAccountsRecord {
    const id = `pya_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO prior_year_accounts (
        id, company_id, period_end, turnover_pence, cost_of_sales_pence,
        tangible_fixed_assets_pence, debtors_pence, cash_at_bank_pence,
        creditors_due_within_one_year_pence, called_up_share_capital_pence,
        profit_and_loss_reserve_pence, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(company_id, period_end) DO UPDATE SET
        turnover_pence = excluded.turnover_pence,
        cost_of_sales_pence = excluded.cost_of_sales_pence,
        tangible_fixed_assets_pence = excluded.tangible_fixed_assets_pence,
        debtors_pence = excluded.debtors_pence,
        cash_at_bank_pence = excluded.cash_at_bank_pence,
        creditors_due_within_one_year_pence = excluded.creditors_due_within_one_year_pence,
        called_up_share_capital_pence = excluded.called_up_share_capital_pence,
        profit_and_loss_reserve_pence = excluded.profit_and_loss_reserve_pence
    `);

    stmt.run(
      id,
      data.companyId,
      data.periodEnd,
      data.turnoverPence,
      data.costOfSalesPence,
      data.tangibleFixedAssetsPence,
      data.debtorsPence,
      data.cashAtBankPence,
      data.creditorsDueWithinOneYearPence,
      data.calledUpShareCapitalPence,
      data.profitAndLossReservePence,
      now
    );

    return this.getByPeriod(data.companyId, data.periodEnd)!;
  }

  getByPeriod(companyId: string, periodEnd: string): PriorYearAccountsRecord | null {
    const stmt = this.db.prepare(`
      SELECT
        id, company_id as companyId, period_end as periodEnd,
        turnover_pence as turnoverPence, cost_of_sales_pence as costOfSalesPence,
        tangible_fixed_assets_pence as tangibleFixedAssetsPence, debtors_pence as debtorsPence,
        cash_at_bank_pence as cashAtBankPence, creditors_due_within_one_year_pence as creditorsDueWithinOneYearPence,
        called_up_share_capital_pence as calledUpShareCapitalPence,
        profit_and_loss_reserve_pence as profitAndLossReservePence, created_at as createdAt
      FROM prior_year_accounts
      WHERE company_id = ? AND period_end = ?
    `);

    const row = stmt.get(companyId, periodEnd) as any;
    return row || null;
  }
}
