/**
 * @file auth.middleware.test.ts
 * @description Unit tests for the authentication and RBAC middleware.
 *
 * Coverage targets:
 * - `createVerifyAdminToken` — valid token, missing token, invalid token.
 * - `requireRole` — grants/denies based on role hierarchy.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';

import { AdminService } from '../../services/admin.service.js';
import { MockAdminRepository } from '../helpers/mock-admin.repository.js';
import { createVerifyAdminToken, requireRole, type AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { AdminRole } from '../../config/constants.js';
import { AppError } from '../../lib/app-error.js';
import { validateEnv } from '../../config/env.config.js';

try { validateEnv(); } catch { /* already validated */ }

/* ── Shared fixtures ─────────────────────────────────────────────────── */

let service: AdminService;
let verifyAdminToken: ReturnType<typeof createVerifyAdminToken>;

/** Build a minimal mock Express request with an optional auth-token header. */
function mockReq(token?: string): AuthenticatedRequest {
  return {
    header: (name: string) => (name === 'auth-token' ? token : undefined),
    authData: undefined,
  } as unknown as AuthenticatedRequest;
}

/** Build a no-op mock response. */
function mockRes(): Response {
  return {} as Response;
}

beforeEach(() => {
  const repo = new MockAdminRepository();
  service = new AdminService(repo);
  verifyAdminToken = createVerifyAdminToken(service);
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  createVerifyAdminToken                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('createVerifyAdminToken', () => {
  it('should populate req.authData for a valid token', async () => {
    const token = await service.createAdminToken('admin-1', AdminRole.PUBLISHER);
    const req = mockReq(token);
    const next: NextFunction = () => {};

    await verifyAdminToken(req, mockRes(), next);

    expect(req.authData).toBeDefined();
    expect(req.authData!.id).toBe('admin-1');
    expect(req.authData!.role).toBe(AdminRole.PUBLISHER);
    expect(req.authData!.isAdmin).toBe(true);
  });

  it('should forward a 401 AppError when the token header is missing', async () => {
    const req = mockReq(undefined);
    let forwarded: unknown;
    const next: NextFunction = (err?: unknown) => { forwarded = err; };

    await verifyAdminToken(req, mockRes(), next);

    expect(forwarded).toBeInstanceOf(AppError);
    expect((forwarded as AppError).statusCode).toBe(401);
  });

  it('should forward a 401 AppError when the token is invalid', async () => {
    const req = mockReq('bad.token.value');
    let forwarded: unknown;
    const next: NextFunction = (err?: unknown) => { forwarded = err; };

    await verifyAdminToken(req, mockRes(), next);

    expect(forwarded).toBeInstanceOf(AppError);
    expect((forwarded as AppError).statusCode).toBe(401);
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  requireRole                                                           */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('requireRole', () => {
  /**
   * Helper that runs the requireRole middleware and captures the result.
   * Returns `null` if `next()` was called without an error (access granted).
   */
  function runGuard(role: AdminRole, ...required: AdminRole[]): AppError | null {
    const req = mockReq();
    req.authData = { id: 'x', role, isAdmin: true };

    let forwarded: unknown = null;
    const next: NextFunction = (err?: unknown) => { forwarded = err ?? null; };

    requireRole(...required)(req, mockRes(), next);

    return forwarded as AppError | null;
  }

  it('should grant access when user role matches exactly', () => {
    expect(runGuard(AdminRole.REVIEWER, AdminRole.REVIEWER)).toBeNull();
  });

  it('should grant access when user role is MORE privileged', () => {
    // SYSTEM_ADMIN (0) should pass a REVIEWER (2) check.
    expect(runGuard(AdminRole.SYSTEM_ADMIN, AdminRole.REVIEWER)).toBeNull();
    // PUBLISHER (1) should pass a REVIEWER (2) check.
    expect(runGuard(AdminRole.PUBLISHER, AdminRole.REVIEWER)).toBeNull();
  });

  it('should deny access when user role is LESS privileged', () => {
    // CONTRIBUTOR (3) should not pass a REVIEWER (2) check.
    const err = runGuard(AdminRole.CONTRIBUTOR, AdminRole.REVIEWER);
    expect(err).toBeInstanceOf(AppError);
    expect(err!.statusCode).toBe(403);
  });

  it('should deny access when authData is missing', () => {
    const req = mockReq();
    // authData intentionally not set.
    let forwarded: unknown = null;
    const next: NextFunction = (err?: unknown) => { forwarded = err ?? null; };

    requireRole(AdminRole.CONTRIBUTOR)(req, mockRes(), next);

    expect(forwarded).toBeInstanceOf(AppError);
    expect((forwarded as AppError).statusCode).toBe(401);
  });

  it('should grant access when ANY of the required roles is satisfied', () => {
    // REVIEWER (2) with required [SYSTEM_ADMIN, REVIEWER] → passes because REVIEWER matches.
    expect(runGuard(AdminRole.REVIEWER, AdminRole.SYSTEM_ADMIN, AdminRole.REVIEWER)).toBeNull();
  });
});
