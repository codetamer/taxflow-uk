import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SCHEMA_SQL } from './schema.ts';

let defaultDbInstance: DatabaseSync | null = null;

export function getDatabase(dbPath?: string): DatabaseSync {
  if (defaultDbInstance && !dbPath) {
    return defaultDbInstance;
  }

  const resolvedPath = dbPath || process.env.DATABASE_URL || path.resolve(process.cwd(), 'data', 'taxflow.db');

  if (resolvedPath !== ':memory:') {
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(resolvedPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA_SQL);

  if (!dbPath) {
    defaultDbInstance = db;
  }

  return db;
}

export function closeDatabase(): void {
  if (defaultDbInstance) {
    defaultDbInstance.close();
    defaultDbInstance = null;
  }
}

