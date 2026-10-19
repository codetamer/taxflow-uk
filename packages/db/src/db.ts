import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SCHEMA_SQL } from './schema.ts';

let defaultDbInstance: DatabaseSync | null = null;

function seedInitialData(db: DatabaseSync): void {
  try {
    const row = db.prepare('SELECT count(*) as count FROM companies').get() as { count: number } | undefined;
    if (row && row.count > 0) {
      return;
    }

    const now = new Date().toISOString();

    // 1. Seed Company
    db.prepare(`
      INSERT OR IGNORE INTO companies (id, crn, name, utr, registered_address, company_type, is_close_company, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'co_ad35ee5268244568',
      '15152081',
      'DROPLOGICX LTD',
      '1234567890',
      '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
      'ltd',
      1,
      now,
      now
    );

    // 2. Seed Users
    // Password123! scrypt hash
    const directorHash = '00000000000000000000000000000000:72b528bdfec3bc262bf6a9bf6c1ec5a7cf9f33c7f9ea9fa01f56efb9b77eb8a2';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr_298e85a0-4144-4bef-9363-c8b4cdb46103',
      'saif@droplogicx.com',
      directorHash,
      'Muhammad Saif Raza',
      'ADMIN',
      1,
      now,
      now
    );

    // AdminPass2026! scrypt hash
    const adminHash = 'd5dcf488a05d897581fc215e68891881:786ebfb6740b1cbc947783d73b7d3c6f15933807737325863ba14357e7957ec31f81b601ead0515a5254aeca737621fe998e7011c62735ebcf1853774ab6f860';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr_admin_taxflow_master',
      'admin@taxflow.co.uk',
      adminHash,
      'TaxFlow Administrator',
      'ADMIN',
      1,
      now,
      now
    );

    // Link users to DropLogicX Ltd
    db.prepare(`
      INSERT OR IGNORE INTO user_companies (user_id, company_id, role, created_at)
      VALUES (?, ?, ?, ?)
    `).run(
      'usr_298e85a0-4144-4bef-9363-c8b4cdb46103',
      'co_ad35ee5268244568',
      'DIRECTOR',
      now
    );

    db.prepare(`
      INSERT OR IGNORE INTO user_companies (user_id, company_id, role, created_at)
      VALUES (?, ?, ?, ?)
    `).run(
      'usr_admin_taxflow_master',
      'co_ad35ee5268244568',
      'OWNER',
      now
    );

    // 3. Seed Primary Filing (with both id 'fil_f114c04facec439e' and alias 'drop-logicx')
    const seedFilingQuery = `
      INSERT OR IGNORE INTO filings (
        id, company_id, period_start, period_end, status, director_name,
        director_approval_date, director_legal_declaration, is_paid,
        payment_reference, paid_amount_pence, trial_balance_json,
        tax_adjustments_json, calculation_result_json, shield_result_json,
        irmark_base64, irmark_base32, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const filingParams = [
      'co_ad35ee5268244568',
      '2025-10-01',
      '2026-09-30',
      'SUBMITTED',
      'Muhammad Saif Raza',
      '2026-10-15',
      1,
      1,
      'CT-2026-15152081',
      606100,
      JSON.stringify({ turnoverPence: 10000000, costOfSalesPence: 2000000, otherChargesPence: 4810000 }),
      JSON.stringify({ disallowablePence: 310000, capitalAllowancesPence: 1500000 }),
      JSON.stringify({ turnoverPence: 10000000, taxableProfitPence: 3190000, taxPayablePence: 606100, effectiveRate: 0.19 }),
      JSON.stringify({ overallStatus: 'PASS', passedChecks: 40, totalChecks: 40, criticalErrors: 0 }),
      'E8g0182Nsd9120=',
      'G7YJ2Q4K9M0Z',
      now,
      now
    ];

    db.prepare(seedFilingQuery).run('fil_f114c04facec439e', ...filingParams);
    db.prepare(seedFilingQuery).run('drop-logicx', ...filingParams);
  } catch {
    // Seeding error ignored gracefully
  }
}

export function getDatabase(dbPath?: string): DatabaseSync {
  if (defaultDbInstance && !dbPath) {
    return defaultDbInstance;
  }

  // Detect serverless environment (Vercel, AWS Lambda, read-only root)
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_ENV) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    (typeof process.cwd === 'function' && (
      process.cwd().startsWith('/var/task') ||
      process.cwd().startsWith('/var/runtime')
    ));

  let resolvedPath = dbPath || process.env.DATABASE_URL;
  if (!resolvedPath) {
    if (isServerless) {
      // In serverless, /tmp is the only guaranteed writable directory
      resolvedPath = path.resolve('/tmp', 'taxflow.db');
    } else {
      resolvedPath = path.resolve(process.cwd(), 'data', 'taxflow.db');
    }
  }

  if (resolvedPath !== ':memory:') {
    try {
      const dir = path.dirname(resolvedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.accessSync(dir, fs.constants.W_OK);
    } catch {
      // If filesystem is read-only or mkdir fails, fall back to in-memory SQLite
      resolvedPath = ':memory:';
    }
  }

  let db: DatabaseSync;
  try {
    db = new DatabaseSync(resolvedPath);
    db.exec('PRAGMA foreign_keys = ON;');
    if (resolvedPath !== ':memory:') {
      try {
        db.exec('PRAGMA journal_mode = WAL;');
      } catch {
        // WAL not supported on temporary/read-only filesystems
      }
    }
    db.exec(SCHEMA_SQL);
  } catch {
    // Fallback: in-memory sqlite
    resolvedPath = ':memory:';
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(SCHEMA_SQL);
  }

  // Auto seed database if empty
  seedInitialData(db);

  if (!dbPath) {
    defaultDbInstance = db;
  }

  return db;
}

export function closeDatabase(): void {
  if (defaultDbInstance) {
    try {
      defaultDbInstance.close();
    } catch {
      // ignore
    }
    defaultDbInstance = null;
  }
}
