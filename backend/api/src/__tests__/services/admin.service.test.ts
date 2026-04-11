/**
 * @file admin.service.test.ts
 * @description Unit tests for AdminService.
 *
 * These tests exercise every public method of AdminService using a mock
 * in-memory repository — no database or network access is required.
 *
 * Coverage targets:
 * - CRUD operations (create, findById, findMany, update, delete).
 * - Password hashing and update flow.
 * - Login flow (DB admin, root admin, inactive admin, wrong password).
 * - JWT creation and verification round-trip.
 * - Edge cases and expected error conditions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

import { AdminService } from '../../services/admin.service.js';
import { MockAdminRepository } from '../helpers/mock-admin.repository.js';
import { AdminRole } from '../../config/constants.js';
import { AppError } from '../../lib/app-error.js';
import { validateEnv } from '../../config/env.config.js';

/* ── Bootstrap env for JWT operations ────────────────────────────────── */
try { validateEnv(); } catch { /* already validated */ }

/* ── Shared fixtures ─────────────────────────────────────────────────── */

let repo: MockAdminRepository;
let service: AdminService;

/** A plain-text password used across test cases. */
const PLAIN_PASSWORD = 'Secret123!';

beforeEach(() => {
  repo = new MockAdminRepository();
  service = new AdminService(repo);
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CREATE                                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('AdminService.create', () => {
  it('should create an admin with a hashed password and normalised fields', async () => {
    const admin = await service.create({
      surname: 'tHIERNO',
      name: 'diallo',
      email: 'Test@Example.COM',
      password: PLAIN_PASSWORD,
    });

    expect(admin.id).toBeDefined();
    expect(admin.surname).toBe('Thierno');          // capitalised
    expect(admin.name).toBe('DIALLO');              // uppercased
    expect(admin.email).toBe('test@example.com');   // lowercased
    expect(admin.role).toBe(AdminRole.CONTRIBUTOR); // default role
    expect(admin.isActive).toBe(true);

    // Password should be hashed, not plain text.
    expect(admin.password).not.toBe(PLAIN_PASSWORD);
    const isMatch = await bcrypt.compare(PLAIN_PASSWORD, admin.password);
    expect(isMatch).toBe(true);
  });

  it('should assign a custom role when provided', async () => {
    const admin = await service.create({
      surname: 'Jane',
      name: 'Doe',
      email: 'jane@test.com',
      password: PLAIN_PASSWORD,
      role: AdminRole.REVIEWER,
    });

    expect(admin.role).toBe(AdminRole.REVIEWER);
  });

  it('should throw 409 when email already exists', async () => {
    await service.create({
      surname: 'First',
      name: 'Admin',
      email: 'dup@test.com',
      password: PLAIN_PASSWORD,
    });

    await expect(
      service.create({
        surname: 'Second',
        name: 'Admin',
        email: 'DUP@test.com', // same email, different case
        password: PLAIN_PASSWORD,
      }),
    ).rejects.toThrow(AppError);

    try {
      await service.create({ surname: 'X', name: 'Y', email: 'dup@test.com', password: 'p' });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(409);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  FIND                                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('AdminService.findById', () => {
  it('should return the admin when found', async () => {
    const created = await service.create({ surname: 'A', name: 'B', email: 'a@b.com', password: 'pwd123' });
    const found = await service.findById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
  });

  it('should return null for a non-existent ID', async () => {
    const found = await service.findById('nonexistent');
    expect(found).toBeNull();
  });
});

describe('AdminService.findMany', () => {
  it('should return a paginated list matching the filter', async () => {
    // Seed 5 admins.
    for (let i = 0; i < 5; i++) {
      await service.create({ surname: `User${i}`, name: `Name${i}`, email: `u${i}@test.com`, password: 'p' });
    }

    const page = await service.findMany({}, 0, 3);
    expect(page).toHaveLength(3);

    const all = await service.findMany({}, 0, 100);
    expect(all).toHaveLength(5);
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  UPDATE                                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('AdminService.update', () => {
  it('should update profile fields and normalise them', async () => {
    const created = await service.create({ surname: 'Old', name: 'Name', email: 'old@test.com', password: 'p' });

    const result = await service.update(created.id, { surname: 'new', name: 'updated', email: 'NEW@test.com' });
    expect(result).toBe(true);

    const updated = await service.findById(created.id);
    expect(updated!.surname).toBe('New');
    expect(updated!.name).toBe('UPDATED');
    expect(updated!.email).toBe('new@test.com');
  });

  it('should throw 404 for a non-existent admin', async () => {
    await expect(service.update('nonexistent', { surname: 'X' })).rejects.toThrow(AppError);
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  UPDATE PASSWORD                                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('AdminService.updatePassword', () => {
  it('should change the password when the current one is correct', async () => {
    const admin = await service.create({ surname: 'A', name: 'B', email: 'pw@test.com', password: PLAIN_PASSWORD });

    const result = await service.updatePassword(admin.id, PLAIN_PASSWORD, 'NewPass456!');
    expect(result).toBe(true);

    // Verify the new password is hashed and valid.
    const updated = await service.findById(admin.id);
    const isMatch = await bcrypt.compare('NewPass456!', updated!.password);
    expect(isMatch).toBe(true);
  });

  it('should throw 400 when the current password is wrong', async () => {
    const admin = await service.create({ surname: 'A', name: 'B', email: 'pw2@test.com', password: PLAIN_PASSWORD });

    try {
      await service.updatePassword(admin.id, 'WrongPassword', 'NewPass456!');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it('should throw 404 for a non-existent admin', async () => {
    await expect(service.updatePassword('nonexistent', 'a', 'b')).rejects.toThrow(AppError);
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  DELETE                                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('AdminService.deleteById', () => {
  it('should delete an existing admin', async () => {
    const admin = await service.create({ surname: 'Del', name: 'Me', email: 'del@test.com', password: 'p' });
    const result = await service.deleteById(admin.id);

    expect(result).toBe(true);
    expect(await service.findById(admin.id)).toBeNull();
  });

  it('should throw 404 for a non-existent admin', async () => {
    await expect(service.deleteById('nonexistent')).rejects.toThrow(AppError);
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  LOGIN                                                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('AdminService.login', () => {
  it('should return id, role, and JWT for a valid DB admin', async () => {
    await service.create({ surname: 'Login', name: 'User', email: 'login@test.com', password: PLAIN_PASSWORD });

    const result = await service.login('login@test.com', PLAIN_PASSWORD);

    expect(result.id).toBeDefined();
    expect(result.role).toBe(AdminRole.CONTRIBUTOR);
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  it('should throw 404 for an unknown email', async () => {
    try {
      await service.login('nobody@test.com', 'whatever');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(404);
    }
  });

  it('should throw 404 for a wrong password', async () => {
    await service.create({ surname: 'A', name: 'B', email: 'wrong@test.com', password: PLAIN_PASSWORD });

    try {
      await service.login('wrong@test.com', 'BadPassword');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(404);
    }
  });

  it('should throw 403 for an inactive admin', async () => {
    const admin = await service.create({ surname: 'In', name: 'Active', email: 'inactive@test.com', password: PLAIN_PASSWORD });
    await service.update(admin.id, { isActive: false });

    try {
      await service.login('inactive@test.com', PLAIN_PASSWORD);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*  JWT ROUND-TRIP                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

describe('AdminService JWT', () => {
  it('should create and verify a token successfully', async () => {
    const token = await service.createAdminToken('admin-id-1', AdminRole.PUBLISHER);
    expect(typeof token).toBe('string');

    const payload = await service.verifyAdminToken(token);
    expect(payload.id).toBe('admin-id-1');
    expect(payload.role).toBe(AdminRole.PUBLISHER);
    expect(payload.isAdmin).toBe(true);
  });

  it('should reject an invalid token', async () => {
    await expect(service.verifyAdminToken('totally.invalid.token')).rejects.toThrow();
  });
});
