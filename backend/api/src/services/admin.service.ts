/**
 * @file admin.service.ts
 * @description Business-logic layer for Admin operations.
 *
 * Responsibilities:
 * - CRUD operations on admins (with input normalisation).
 * - Password hashing (bcrypt) and comparison.
 * - JWT creation and verification (jose / HS256).
 * - Root-admin fallback: a hard-coded SYSTEM_ADMIN from env vars that
 *   always exists even when the database is empty.
 *
 * Phase 1 changes:
 * - `isSuperAdmin: boolean` replaced by `role: AdminRole` throughout.
 * - JWT payload now carries `role` instead of `isSuperAdmin`.
 * - Login return type includes `role` for the client.
 * - Root admin uses `AdminRole.SYSTEM_ADMIN`.
 * - Added `isActive` check: inactive admins cannot log in.
 *
 * This class depends on {@link IAdminRepository} (injected via DI) and
 * never accesses the database directly, keeping it testable and portable.
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

import type { IAdmin, IAdminCreate } from '../models/interfaces/index.js';
import type { IAdminRepository } from '../repositories/interfaces/index.js';
import { AppError } from '../lib/app-error.js';
import { getEnv } from '../config/env.config.js';
import { AdminRole, JWT_DURATION } from '../config/constants.js';

/** Number of bcrypt salt rounds — 10 is a good balance between security and speed. */
const BCRYPT_SALT_ROUNDS = 10;

export class AdminService {
  constructor(private readonly adminRepo: IAdminRepository) {}

  /* ── CRUD ────────────────────────────────────────────────────────────── */

  /**
   * Create a new admin account.
   *
   * - Checks for duplicate email.
   * - Normalises names (capitalise surname, uppercase name, lowercase email).
   * - Hashes the plain-text password before persisting.
   * - Defaults role to CONTRIBUTOR and isActive to true if not provided.
   *
   * @throws {AppError} 409 if an admin with the same email already exists.
   */
  async create(data: {
    surname: string;
    name: string;
    email: string;
    password: string;
    role?: AdminRole;
  }): Promise<IAdmin> {
    const existing = await this.adminRepo.findByEmail(data.email.toLowerCase());
    if (existing) {
      throw AppError.conflict('Un administrateur avec cet email existe déjà.');
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    const toCreate: IAdminCreate = {
      surname: capitalize(data.surname),
      name: data.name.toUpperCase(),
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role ?? AdminRole.CONTRIBUTOR,
      isActive: true,
    };

    return this.adminRepo.create(toCreate);
  }

  /** Return a single admin by ID, or `null` if not found. */
  async findById(id: string): Promise<IAdmin | null> {
    return this.adminRepo.findById(id);
  }

  /** Return a paginated, filtered list of admins. */
  async findMany(
    filter: {
      surname?: string;
      name?: string;
      email?: string;
      role?: AdminRole;
      isActive?: boolean;
      dateFilter?: { date: Date; gte: boolean } | null;
    },
    skip: number,
    limit: number,
  ): Promise<IAdmin[]> {
    return this.adminRepo.findMany(filter, skip, limit);
  }

  /**
   * Update an existing admin's profile fields (not password).
   *
   * @throws {AppError} 404 if the admin does not exist.
   */
  async update(
    id: string,
    data: {
      surname?: string;
      name?: string;
      email?: string;
      role?: AdminRole;
      isActive?: boolean;
    },
  ): Promise<boolean> {
    const admin = await this.adminRepo.findById(id);
    if (!admin) {
      throw AppError.notFound('Administrateur introuvable.');
    }

    // Normalise only the fields that were actually provided.
    const updateData: Record<string, unknown> = {};
    if (data.surname !== undefined) updateData.surname = capitalize(data.surname);
    if (data.name !== undefined) updateData.name = data.name.toUpperCase();
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.adminRepo.updateById(id, updateData);
  }

  /**
   * Change an admin's password after verifying the current one.
   *
   * @throws {AppError} 404 if the admin does not exist.
   * @throws {AppError} 400 if the current password does not match.
   */
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const admin = await this.adminRepo.findById(id);
    if (!admin) {
      throw AppError.notFound('Administrateur introuvable.');
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      throw AppError.badRequest('Mot de passe actuel incorrect.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    return this.adminRepo.updateById(id, { password: hashedPassword });
  }

  /**
   * Delete an admin by ID.
   *
   * @throws {AppError} 404 if the admin does not exist.
   */
  async deleteById(id: string): Promise<boolean> {
    const admin = await this.adminRepo.findById(id);
    if (!admin) {
      throw AppError.notFound('Administrateur introuvable.');
    }
    return this.adminRepo.deleteById(id);
  }

  /* ── Authentication ─────────────────────────────────────────────────── */

  /**
   * Authenticate an admin by email + password and return a signed JWT.
   *
   * The root admin (from env vars) is checked **first** so the system
   * always has a usable SYSTEM_ADMIN even before any DB records exist.
   *
   * @returns Object containing the admin's `id`, `role`, and `token`.
   * @throws {AppError} 404 if the email/password combination is invalid.
   * @throws {AppError} 403 if the admin account is inactive.
   */
  async login(email: string, password: string): Promise<{ id: string; role: AdminRole; token: string }> {
    // Priority: root admin from env → then database lookup.
    const rootAdmin = this.getRootAdmin(email);
    const admin = rootAdmin ?? await this.adminRepo.findByEmail(email.toLowerCase());

    if (!admin) {
      throw AppError.notFound('Email ou mot de passe incorrect.');
    }

    // Inactive accounts cannot authenticate.
    if (!admin.isActive) {
      throw AppError.forbidden('Ce compte administrateur est désactivé.');
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw AppError.notFound('Email ou mot de passe incorrect.');
    }

    const token = await this.createAdminToken(admin.id, admin.role);
    return { id: admin.id, role: admin.role, token };
  }

  /* ── JWT helpers ─────────────────────────────────────────────────────── */

  /**
   * Create a signed JWT for an admin session.
   *
   * Payload: `{ id, role, isAdmin: true }`.
   * Algorithm: HS256. Expiry: see {@link JWT_DURATION}.
   */
  async createAdminToken(id: string, role: AdminRole): Promise<string> {
    const env = getEnv();
    const secret = new TextEncoder().encode(env.ADMIN_TOKEN_SECRET);

    return new SignJWT({ id, role, isAdmin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_DURATION)
      .sign(secret);
  }

  /**
   * Verify and decode an admin JWT.
   *
   * @returns Decoded payload with `id`, `role`, and `isAdmin` flag.
   * @throws {JOSEError} If the token is expired, malformed, or has a bad signature.
   */
  async verifyAdminToken(token: string): Promise<{ id: string; role: AdminRole; isAdmin: boolean }> {
    const env = getEnv();
    const secret = new TextEncoder().encode(env.ADMIN_TOKEN_SECRET);

    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      role: payload.role as AdminRole,
      isAdmin: payload.isAdmin as boolean,
    };
  }

  /* ── Private helpers ─────────────────────────────────────────────────── */

  /**
   * Return the root admin virtual entity if the email matches `ROOT_ADMIN_EMAIL`.
   *
   * This admin is never stored in the DB — it is built entirely from
   * environment variables and always has `role: SYSTEM_ADMIN`.
   */
  private getRootAdmin(email: string): IAdmin | null {
    const env = getEnv();
    if (email.toLowerCase() !== env.ROOT_ADMIN_EMAIL.toLowerCase()) {
      return null;
    }

    return {
      id: env.ROOT_ADMIN_ID,
      surname: env.ROOT_ADMIN_SURNAME,
      name: env.ROOT_ADMIN_NAME,
      email: env.ROOT_ADMIN_EMAIL,
      password: env.ROOT_ADMIN_PASSWORD,
      role: AdminRole.SYSTEM_ADMIN,
      isActive: true,
      createdAt: new Date(env.ROOT_ADMIN_DATE),
      updatedAt: new Date(env.ROOT_ADMIN_DATE),
    };
  }
}

/* ── Utility functions ──────────────────────────────────────────────────── */

/** Capitalise the first letter and lower-case the rest (e.g. "tHIERNO" → "Thierno"). */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
