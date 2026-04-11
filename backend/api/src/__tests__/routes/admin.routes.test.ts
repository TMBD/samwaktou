/**
 * @file admin.routes.test.ts
 * @description Integration tests for the Admin API routes (`/api/v1/admin`).
 *
 * These tests exercise the full HTTP pipeline — request parsing, Zod
 * validation, auth middleware, service logic, and error handler — using
 * `supertest` against an Express app backed by mock repositories.
 *
 * Coverage targets:
 * - POST /login  — success, invalid credentials, validation errors.
 * - POST /       — create admin (auth + RBAC + validation).
 * - GET  /       — list admins (auth + RBAC + pagination).
 * - GET  /:id    — get single admin (auth).
 * - PUT  /:id    — update admin (auth + RBAC + validation).
 * - DELETE /:id  — delete admin (auth + RBAC).
 * - PUT /password/:id — change password (auth + validation).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';

import { createTestApp } from '../helpers/test-app.js';
import { AdminRole } from '../../config/constants.js';
import type { MockAdminRepository } from '../helpers/mock-admin.repository.js';
import type { AdminService } from '../../services/admin.service.js';

/* ── Shared test state ───────────────────────────────────────────────── */

let agent: supertest.SuperTest<supertest.Test>;
let adminRepo: MockAdminRepository;
let adminService: AdminService;

/** Helper: obtain a valid SYSTEM_ADMIN JWT for authenticated requests. */
async function getSystemAdminToken(): Promise<string> {
  return adminService.createAdminToken('sa-id', AdminRole.SYSTEM_ADMIN);
}

/** Helper: obtain a valid CONTRIBUTOR JWT. */
async function getContributorToken(): Promise<string> {
  return adminService.createAdminToken('contrib-id', AdminRole.CONTRIBUTOR);
}

/** Helper: obtain a valid REVIEWER JWT. */
async function getReviewerToken(): Promise<string> {
  return adminService.createAdminToken('reviewer-id', AdminRole.REVIEWER);
}

beforeEach(() => {
  const ctx = createTestApp();
  agent = supertest(ctx.app) as unknown as supertest.SuperTest<supertest.Test>;
  adminRepo = ctx.repos.adminRepo;
  adminService = ctx.services.adminService;
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  POST /api/v1/admin/login                                              */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('POST /api/v1/admin/login', () => {
  it('should return 200 with id, role, and token for valid credentials', async () => {
    // Create an admin so we can log in with it.
    await adminService.create({
      surname: 'Test',
      name: 'Login',
      email: 'login@test.com',
      password: 'Password123',
    });

    const res = await agent
      .post('/api/v1/admin/login')
      .send({ email: 'login@test.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('role', AdminRole.CONTRIBUTOR);
    expect(res.body).toHaveProperty('token');
  });

  it('should return 404 for an unknown email', async () => {
    const res = await agent
      .post('/api/v1/admin/login')
      .send({ email: 'nobody@test.com', password: 'whatever' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for a malformed request body', async () => {
    const res = await agent
      .post('/api/v1/admin/login')
      .send({ email: 'not-an-email' }); // missing password

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  POST /api/v1/admin  — create admin                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('POST /api/v1/admin', () => {
  it('should create an admin when called by SYSTEM_ADMIN', async () => {
    const token = await getSystemAdminToken();

    const res = await agent
      .post('/api/v1/admin')
      .set('auth-token', token)
      .send({
        surname: 'New',
        name: 'Admin',
        email: 'new@admin.com',
        password: 'Secure123',
        role: AdminRole.REVIEWER,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.role).toBe(AdminRole.REVIEWER);
  });

  it('should return 403 when a CONTRIBUTOR tries to create an admin', async () => {
    const token = await getContributorToken();

    const res = await agent
      .post('/api/v1/admin')
      .set('auth-token', token)
      .send({
        surname: 'New',
        name: 'Admin',
        email: 'new2@admin.com',
        password: 'Secure123',
      });

    expect(res.status).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await agent
      .post('/api/v1/admin')
      .send({ surname: 'X', name: 'Y', email: 'x@y.com', password: '123456' });

    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid body (missing required fields)', async () => {
    const token = await getSystemAdminToken();

    const res = await agent
      .post('/api/v1/admin')
      .set('auth-token', token)
      .send({ surname: 'X' }); // missing name, email, password

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  GET /api/v1/admin  — list admins                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('GET /api/v1/admin', () => {
  it('should return a list of admins for REVIEWER+', async () => {
    await adminService.create({ surname: 'A', name: 'B', email: 'a@b.com', password: 'pw1234' });
    const token = await getReviewerToken();

    const res = await agent
      .get('/api/v1/admin')
      .set('auth-token', token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('should return 403 when a CONTRIBUTOR tries to list admins', async () => {
    const token = await getContributorToken();

    const res = await agent
      .get('/api/v1/admin')
      .set('auth-token', token);

    expect(res.status).toBe(403);
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  GET /api/v1/admin/:adminId  — get single admin                        */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('GET /api/v1/admin/:adminId', () => {
  it('should return the admin by ID for any authenticated admin', async () => {
    const created = await adminService.create({ surname: 'Get', name: 'Me', email: 'get@test.com', password: 'pw1234' });
    const token = await getContributorToken();

    const res = await agent
      .get(`/api/v1/admin/${created.id}`)
      .set('auth-token', token);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PUT /api/v1/admin/:adminId  — update admin                            */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('PUT /api/v1/admin/:adminId', () => {
  it('should update the admin when called by SYSTEM_ADMIN', async () => {
    const created = await adminService.create({ surname: 'Up', name: 'Date', email: 'upd@test.com', password: 'pw1234' });
    const token = await getSystemAdminToken();

    const res = await agent
      .put(`/api/v1/admin/${created.id}`)
      .set('auth-token', token)
      .send({ surname: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 403 when a REVIEWER tries to update', async () => {
    const created = await adminService.create({ surname: 'Up', name: 'Date', email: 'upd2@test.com', password: 'pw1234' });
    const token = await getReviewerToken();

    const res = await agent
      .put(`/api/v1/admin/${created.id}`)
      .set('auth-token', token)
      .send({ surname: 'Nope' });

    expect(res.status).toBe(403);
  });

  it('should return 400 when no fields are provided', async () => {
    const created = await adminService.create({ surname: 'Up', name: 'Date', email: 'upd3@test.com', password: 'pw1234' });
    const token = await getSystemAdminToken();

    const res = await agent
      .put(`/api/v1/admin/${created.id}`)
      .set('auth-token', token)
      .send({});

    expect(res.status).toBe(400);
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  DELETE /api/v1/admin/:adminId  — delete admin                         */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('DELETE /api/v1/admin/:adminId', () => {
  it('should delete an admin when called by SYSTEM_ADMIN', async () => {
    const created = await adminService.create({ surname: 'Del', name: 'Me', email: 'del@test.com', password: 'pw1234' });
    const token = await getSystemAdminToken();

    const res = await agent
      .delete(`/api/v1/admin/${created.id}`)
      .set('auth-token', token);

    expect(res.status).toBe(204);
  });

  it('should return 403 when a CONTRIBUTOR tries to delete', async () => {
    const created = await adminService.create({ surname: 'Del', name: 'Me', email: 'del2@test.com', password: 'pw1234' });
    const token = await getContributorToken();

    const res = await agent
      .delete(`/api/v1/admin/${created.id}`)
      .set('auth-token', token);

    expect(res.status).toBe(403);
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PUT /api/v1/admin/password/:adminId  — change password                */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('PUT /api/v1/admin/password/:adminId', () => {
  it('should change the password with valid current password', async () => {
    const created = await adminService.create({ surname: 'Pw', name: 'Change', email: 'pw@test.com', password: 'OldPass123' });
    const token = await getSystemAdminToken();

    const res = await agent
      .put(`/api/v1/admin/password/${created.id}`)
      .set('auth-token', token)
      .send({ password: 'OldPass123', newPassword: 'NewPass456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 400 when current password is wrong', async () => {
    const created = await adminService.create({ surname: 'Pw', name: 'Wrong', email: 'pw2@test.com', password: 'OldPass123' });
    const token = await getSystemAdminToken();

    const res = await agent
      .put(`/api/v1/admin/password/${created.id}`)
      .set('auth-token', token)
      .send({ password: 'WrongCurrent', newPassword: 'NewPass456' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when new password is too short', async () => {
    const created = await adminService.create({ surname: 'Pw', name: 'Short', email: 'pw3@test.com', password: 'OldPass123' });
    const token = await getSystemAdminToken();

    const res = await agent
      .put(`/api/v1/admin/password/${created.id}`)
      .set('auth-token', token)
      .send({ password: 'OldPass123', newPassword: '12' }); // too short

    expect(res.status).toBe(400);
  });
});
