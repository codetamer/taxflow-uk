import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL } from '../src/schema.ts';
import {
  AuthRepository,
  hashPassword,
  verifyPassword,
  hashToken,
  generateSessionToken
} from '../src/auth.ts';
import { CompanyRepository } from '../src/repositories/company_repo.ts';

describe('@taxflow/db: Authentication & Session Security Suite', () => {
  let db: DatabaseSync;
  let authRepo: AuthRepository;
  let companyRepo: CompanyRepository;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(SCHEMA_SQL);
    authRepo = new AuthRepository(db);
    companyRepo = new CompanyRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  test('hashPassword and verifyPassword correctly authenticate valid credentials', () => {
    const password = 'SuperSecretDirectorPassword2026!';
    const hash = hashPassword(password);

    assert.ok(hash.includes(':'), 'Hash must contain salt and key separated by colon');
    assert.ok(verifyPassword(password, hash), 'Correct password must verify successfully');
    assert.strictEqual(verifyPassword('WrongPassword', hash), false, 'Incorrect password must fail verification');
    assert.strictEqual(verifyPassword(password, 'invalid:hash'), false, 'Malformed hash must fail gracefully');
  });

  test('creates user and retrieves by case-insensitive email', () => {
    const user = authRepo.createUser({
      email: 'Director.Saif@DropLogicX.com',
      password: 'SafePassword123!',
      fullName: 'Muhammad Saif Raza',
      role: 'USER'
    });

    assert.ok(user.id.startsWith('usr_'));
    assert.strictEqual(user.email, 'director.saif@droplogicx.com');
    assert.strictEqual(user.fullName, 'Muhammad Saif Raza');
    assert.strictEqual(user.role, 'USER');

    // Case-insensitive lookup
    const foundLower = authRepo.getUserByEmail('director.saif@droplogicx.com');
    assert.ok(foundLower);
    assert.strictEqual(foundLower.id, user.id);

    const foundUpper = authRepo.getUserByEmail('DIRECTOR.SAIF@DROPLOGICX.COM');
    assert.ok(foundUpper);
    assert.strictEqual(foundUpper.id, user.id);

    // Duplicate email must throw
    assert.throws(() => {
      authRepo.createUser({
        email: 'director.saif@droplogicx.com',
        password: 'AnotherPassword',
        fullName: 'Imposter'
      });
    }, /UNIQUE constraint failed/);
  });

  test('session creation, validation, and deletion lifecycle', () => {
    const user = authRepo.createUser({
      email: 'director@example.co.uk',
      password: 'Password123!',
      fullName: 'Jane Director'
    });

    // Create session
    const { token, session } = authRepo.createSession(user.id, {
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Test Suite'
    });

    assert.strictEqual(token.length, 64, 'Token must be a 32-byte hex string (64 characters)');
    assert.strictEqual(session.userId, user.id);

    // Validate active session
    const valid = authRepo.validateSession(token);
    assert.ok(valid);
    assert.strictEqual(valid.user.email, 'director@example.co.uk');
    assert.strictEqual(valid.session.id, session.id);

    // Invalidate session (logout)
    authRepo.deleteSession(token);
    const expired = authRepo.validateSession(token);
    assert.strictEqual(expired, null, 'Deleted session must return null');
  });

  test('associates user with multiple companies and lists them', () => {
    const user = authRepo.createUser({
      email: 'founder@portfolio.com',
      password: 'Password123!',
      fullName: 'Portfolio Director'
    });

    const co1 = companyRepo.upsert({
      crn: '15152081',
      name: 'DROPLOGICX LTD',
      registeredAddress: 'London, UK'
    });

    const co2 = companyRepo.upsert({
      crn: '12345678',
      name: 'VENTURE FLOW LTD',
      registeredAddress: 'Manchester, UK'
    });

    authRepo.associateUserWithCompany(user.id, co1.id, 'OWNER');
    authRepo.associateUserWithCompany(user.id, co2.id, 'ACCOUNTANT');

    const companies = authRepo.listUserCompanies(user.id);
    assert.strictEqual(companies.length, 2);

    const droplogicx = companies.find((c) => c.crn === '15152081');
    assert.ok(droplogicx);
    assert.strictEqual(droplogicx.userRole, 'OWNER');

    const venture = companies.find((c) => c.crn === '12345678');
    assert.ok(venture);
    assert.strictEqual(venture.userRole, 'ACCOUNTANT');
  });

  test('admin telemetry: platform stats and gateway submission recording', () => {
    // Seed admin and normal user
    const admin = authRepo.createUser({
      email: 'admin@taxflow.co.uk',
      password: 'AdminPassword123!',
      fullName: 'System Administrator',
      role: 'ADMIN'
    });
    assert.strictEqual(admin.role, 'ADMIN');

    const co = companyRepo.upsert({
      crn: '15152081',
      name: 'DROPLOGICX LTD',
      registeredAddress: 'London, UK'
    });

    // Seed filing in db
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO filings (
        id, company_id, period_start, period_end, status, director_name,
        is_paid, paid_amount_pence, irmark_base64, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('fil_test_01', co.id, '2025-10-01', '2026-09-30', 'PAID', 'Saif Raza', 1, 4900, 'IRmarkTestHash123=', now, now);

    // Record gateway submissions
    const sub1 = authRepo.recordGatewaySubmission({
      filingId: 'fil_test_01',
      gatewayType: 'COMPANIES_HOUSE',
      correlationId: 'CH_REQ_99812',
      status: 'ACCEPTED',
      latencyMs: 340
    });
    assert.strictEqual(sub1.status, 'ACCEPTED');

    const sub2 = authRepo.recordGatewaySubmission({
      filingId: 'fil_test_01',
      gatewayType: 'HMRC',
      correlationId: 'HMRC_REQ_44120',
      status: 'ACCEPTED',
      latencyMs: 512
    });
    assert.strictEqual(sub2.status, 'ACCEPTED');

    // Platform stats
    const stats = authRepo.getPlatformStats();
    assert.strictEqual(stats.totalUsers, 1);
    assert.strictEqual(stats.totalCompanies, 1);
    assert.strictEqual(stats.totalFilings, 1);
    assert.strictEqual(stats.completedFilings, 1);
    assert.strictEqual(stats.grossRevenuePence, 4900);

    // Submission list
    const submissions = authRepo.listGatewaySubmissions();
    assert.strictEqual(submissions.length, 2);
    assert.strictEqual(submissions[0].companyName, 'DROPLOGICX LTD');
    assert.strictEqual(submissions[0].irmark, 'IRmarkTestHash123=');
  });
});

