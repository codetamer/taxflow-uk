import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type {
  UserRecord,
  SessionRecord,
  CompanyRecord,
  UserRole,
  CompanyRole,
  GatewaySubmissionRecord,
  GatewayType,
  GatewayStatus
} from './types.ts';

/**
 * Hashes a plaintext password using scrypt with a cryptographically secure random salt.
 * Format: saltHex:keyHex
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

/**
 * Hashes a session token using SHA-256 for secure database lookup.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a high-entropy 32-byte random hex session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export class AuthRepository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /**
   * Registers a new user. Throws if email is already taken.
   */
  createUser(params: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
  }): UserRecord {
    const id = `usr_${crypto.randomUUID()}`;
    const passwordHash = hashPassword(params.password);
    const role: UserRole = params.role || 'USER';
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `);

    stmt.run(id, params.email.trim().toLowerCase(), passwordHash, params.fullName.trim(), role, now, now);

    return {
      id,
      email: params.email.trim().toLowerCase(),
      passwordHash,
      fullName: params.fullName.trim(),
      role,
      isVerified: true,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Finds a user by email (case-insensitive).
   */
  getUserByEmail(email: string): UserRecord | null {
    const row = this.db.prepare(`
      SELECT id, email, password_hash, full_name, role, is_verified, created_at, updated_at
      FROM users WHERE email = ? COLLATE NOCASE
    `).get(email.trim().toLowerCase()) as any;

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role as UserRole,
      isVerified: Boolean(row.is_verified),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Finds a user by ID.
   */
  getUserById(id: string): UserRecord | null {
    const row = this.db.prepare(`
      SELECT id, email, password_hash, full_name, role, is_verified, created_at, updated_at
      FROM users WHERE id = ?
    `).get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role as UserRole,
      isVerified: Boolean(row.is_verified),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Creates an active session for a user.
   * Returns the plaintext token to be set in the cookie and the session record.
   */
  createSession(
    userId: string,
    options?: { ipAddress?: string; userAgent?: string; expiresInDays?: number }
  ): { token: string; session: SessionRecord } {
    const id = `ses_${crypto.randomUUID()}`;
    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    const now = new Date();
    const expiresInDays = options?.expiresInDays || 7;
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const createdAt = now.toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, userId, tokenHash, expiresAt, createdAt, options?.ipAddress || null, options?.userAgent || null);

    return {
      token,
      session: {
        id,
        userId,
        tokenHash,
        expiresAt,
        createdAt,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent
      }
    };
  }

  /**
   * Validates a session token. Returns null if invalid or expired.
   */
  validateSession(token: string): { user: UserRecord; session: SessionRecord } | null {
    if (!token) return null;
    const tokenHash = hashToken(token);
    const now = new Date().toISOString();

    const row = this.db.prepare(`
      SELECT 
        s.id as session_id, s.user_id, s.token_hash, s.expires_at, s.created_at as session_created_at,
        s.ip_address, s.user_agent,
        u.id as user_id, u.email, u.password_hash, u.full_name, u.role, u.is_verified,
        u.created_at as user_created_at, u.updated_at as user_updated_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(tokenHash, now) as any;

    if (!row) return null;

    return {
      user: {
        id: row.user_id,
        email: row.email,
        passwordHash: row.password_hash,
        fullName: row.full_name,
        role: row.role as UserRole,
        isVerified: Boolean(row.is_verified),
        createdAt: row.user_created_at,
        updatedAt: row.user_updated_at
      },
      session: {
        id: row.session_id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        createdAt: row.session_created_at,
        ipAddress: row.ip_address,
        userAgent: row.user_agent
      }
    };
  }

  /**
   * Invalidate a session (logout).
   */
  deleteSession(token: string): void {
    if (!token) return;
    const tokenHash = hashToken(token);
    this.db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
  }

  /**
   * Associate a user with a company.
   */
  associateUserWithCompany(userId: string, companyId: string, role: CompanyRole = 'OWNER'): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT OR REPLACE INTO user_companies (user_id, company_id, role, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, companyId, role, now);
  }

  /**
   * List all companies associated with a user.
   */
  listUserCompanies(userId: string): Array<CompanyRecord & { userRole: CompanyRole }> {
    const rows = this.db.prepare(`
      SELECT 
        c.id, c.crn, c.name, c.utr, c.registered_address, c.company_type, c.is_close_company,
        c.created_at, c.updated_at, uc.role as user_role
      FROM companies c
      JOIN user_companies uc ON c.id = uc.company_id
      WHERE uc.user_id = ?
      ORDER BY c.name ASC
    `).all(userId) as any[];

    return rows.map((r) => ({
      id: r.id,
      crn: r.crn,
      name: r.name,
      utr: r.utr || undefined,
      registeredAddress: r.registered_address,
      companyType: r.company_type,
      isCloseCompany: Boolean(r.is_close_company),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      userRole: r.user_role as CompanyRole
    }));
  }

  /**
   * (Admin) List all users with company counts.
   */
  listAllUsers(): Array<UserRecord & { companyCount: number }> {
    const rows = this.db.prepare(`
      SELECT 
        u.id, u.email, u.password_hash, u.full_name, u.role, u.is_verified, u.created_at, u.updated_at,
        COUNT(uc.company_id) as company_count
      FROM users u
      LEFT JOIN user_companies uc ON u.id = uc.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all() as any[];

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      passwordHash: r.password_hash,
      fullName: r.full_name,
      role: r.role as UserRole,
      isVerified: Boolean(r.is_verified),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      companyCount: Number(r.company_count || 0)
    }));
  }

  /**
   * (Admin) Record a government gateway submission event.
   */
  recordGatewaySubmission(params: {
    filingId: string;
    gatewayType: GatewayType;
    correlationId: string;
    status: GatewayStatus;
    rawRequestXml?: string;
    rawResponseXml?: string;
    errorCode?: string;
    errorMessage?: string;
    latencyMs?: number;
  }): GatewaySubmissionRecord {
    const id = `sub_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO gateway_submissions (
        id, filing_id, gateway_type, correlation_id, status, raw_request_xml,
        raw_response_xml, error_code, error_message, latency_ms, submitted_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.filingId,
      params.gatewayType,
      params.correlationId,
      params.status,
      params.rawRequestXml || null,
      params.rawResponseXml || null,
      params.errorCode || null,
      params.errorMessage || null,
      params.latencyMs || 0,
      now,
      params.status !== 'PENDING' ? now : null
    );

    return {
      id,
      filingId: params.filingId,
      gatewayType: params.gatewayType,
      correlationId: params.correlationId,
      status: params.status,
      rawRequestXml: params.rawRequestXml,
      rawResponseXml: params.rawResponseXml,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      latencyMs: params.latencyMs || 0,
      submittedAt: now,
      completedAt: params.status !== 'PENDING' ? now : undefined
    };
  }

  /**
   * (Admin) List all gateway submissions with company and filing details.
   */
  listGatewaySubmissions(): Array<
    GatewaySubmissionRecord & { companyName: string; crn: string; irmark?: string }
  > {
    const rows = this.db.prepare(`
      SELECT 
        gs.id, gs.filing_id, gs.gateway_type, gs.correlation_id, gs.status,
        gs.raw_request_xml, gs.raw_response_xml, gs.error_code, gs.error_message,
        gs.latency_ms, gs.submitted_at, gs.completed_at,
        c.name as company_name, c.crn, f.irmark_base64 as irmark
      FROM gateway_submissions gs
      JOIN filings f ON gs.filing_id = f.id
      JOIN companies c ON f.company_id = c.id
      ORDER BY gs.submitted_at DESC
      LIMIT 100
    `).all() as any[];

    return rows.map((r) => ({
      id: r.id,
      filingId: r.filing_id,
      gatewayType: r.gateway_type as GatewayType,
      correlationId: r.correlation_id,
      status: r.status as GatewayStatus,
      rawRequestXml: r.raw_request_xml,
      rawResponseXml: r.raw_response_xml,
      errorCode: r.error_code,
      errorMessage: r.error_message,
      latencyMs: Number(r.latency_ms || 0),
      submittedAt: r.submitted_at,
      completedAt: r.completed_at,
      companyName: r.company_name,
      crn: r.crn,
      irmark: r.irmark
    }));
  }

  /**
   * (Admin) Get platform overview statistics.
   */
  getPlatformStats(): {
    totalUsers: number;
    totalCompanies: number;
    totalFilings: number;
    completedFilings: number;
    grossRevenuePence: number;
  } {
    const usersCount = (this.db.prepare(`SELECT COUNT(*) as count FROM users`).get() as any).count;
    const companiesCount = (this.db.prepare(`SELECT COUNT(*) as count FROM companies`).get() as any).count;
    const filingsCount = (this.db.prepare(`SELECT COUNT(*) as count FROM filings`).get() as any).count;
    const completedCount = (
      this.db.prepare(`SELECT COUNT(*) as count FROM filings WHERE status IN ('PAID', 'SUBMITTED', 'ACCEPTED')`).get() as any
    ).count;
    const revenuePence = (
      this.db.prepare(`SELECT COALESCE(SUM(paid_amount_pence), 0) as total FROM filings WHERE is_paid = 1`).get() as any
    ).total;

    return {
      totalUsers: Number(usersCount || 0),
      totalCompanies: Number(companiesCount || 0),
      totalFilings: Number(filingsCount || 0),
      completedFilings: Number(completedCount || 0),
      grossRevenuePence: Number(revenuePence || 0)
    };
  }
}
