/**
 * @file user.service.ts
 * @description Business-logic layer for User (public listener) operations.
 *
 * Responsibilities:
 * - CRUD with ownership checks (a user can only update/delete their own account).
 * - Login via `username` + `tel` (no password — lightweight auth).
 * - JWT creation and verification (jose / HS256).
 * - Input normalisation (lowercase username and email).
 *
 * This class depends on {@link IUserRepository} (injected via DI).
 */

import { SignJWT, jwtVerify } from 'jose';

import type { IUser, IUserCreate } from '../models/interfaces/index.js';
import type { IUserRepository } from '../repositories/interfaces/index.js';
import { AppError } from '../lib/app-error.js';
import { getEnv } from '../config/env.config.js';
import { JWT_DURATION } from '../config/constants.js';

export class UserService {
  constructor(private readonly userRepo: IUserRepository) {}

  /* ── CRUD ────────────────────────────────────────────────────────────── */

  /**
   * Register a new user.
   *
   * - Checks for duplicate username.
   * - Normalises username and email to lowercase.
   *
   * @throws {AppError} 409 if the username is already taken.
   */
  async create(data: {
    username: string;
    tel: string;
    email?: string;
    date?: Date;
  }): Promise<IUser> {
    const existing = await this.userRepo.findByUsername(data.username.toLowerCase());
    if (existing) {
      throw AppError.conflict('Ce nom d\'utilisateur existe déjà.');
    }

    const toCreate: IUserCreate = {
      username: data.username.toLowerCase(),
      tel: data.tel,
      email: data.email?.toLowerCase() ?? null,
      date: data.date ?? new Date(),
    };

    return this.userRepo.create(toCreate);
  }

  /** Return a single user by ID, or `null` if not found. */
  async findById(id: string): Promise<IUser | null> {
    return this.userRepo.findById(id);
  }

  /** Return a paginated, filtered list of users. */
  async findMany(
    filter: {
      username?: string;
      tel?: string;
      email?: string;
      dateFilter?: { date: Date; gte: boolean } | null;
    },
    skip: number,
    limit: number,
  ): Promise<IUser[]> {
    return this.userRepo.findMany(filter, skip, limit);
  }

  /**
   * Update a user's profile.
   *
   * Only the user themselves can update their own profile (`requesterId === id`).
   * If the username changes, uniqueness is re-checked.
   * A fresh JWT is returned so the client stays in sync with the new username.
   *
   * @returns `{ updated, token }` — the new JWT to replace the old one.
   * @throws {AppError} 403 if the requester is not the owner.
   * @throws {AppError} 404 if the user does not exist.
   * @throws {AppError} 409 if the new username is already taken.
   */
  async update(
    id: string,
    requesterId: string,
    data: {
      username: string;
      tel?: string;
      email?: string;
    },
  ): Promise<{ updated: boolean; token: string }> {
    // Ownership check — only the user themselves can edit their profile.
    if (requesterId !== id) {
      throw AppError.forbidden('Action non autorisée !');
    }

    const user = await this.userRepo.findById(id);
    if (!user) {
      throw AppError.notFound('Utilisateur introuvable.');
    }

    // Re-check uniqueness only if the username actually changed.
    if (data.username.toLowerCase() !== user.username) {
      const existing = await this.userRepo.findByUsername(data.username.toLowerCase());
      if (existing) {
        throw AppError.conflict('Ce nom d\'utilisateur existe déjà.');
      }
    }

    const updateData: Record<string, unknown> = {
      username: data.username.toLowerCase(),
    };
    if (data.tel !== undefined) updateData.tel = data.tel;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();

    const updated = await this.userRepo.updateById(id, updateData);

    // Issue a fresh token so the client has the latest username claim.
    const token = await this.createUserToken(id, data.username.toLowerCase());

    return { updated, token };
  }

  /**
   * Delete a user by ID.
   *
   * Admins can delete any user; regular users can only delete themselves.
   *
   * @throws {AppError} 403 if the requester lacks permission.
   * @throws {AppError} 404 if the user does not exist.
   */
  async deleteById(id: string, requesterId: string, isAdmin: boolean): Promise<boolean> {
    if (!isAdmin && requesterId !== id) {
      throw AppError.forbidden('Action non autorisée !');
    }

    const user = await this.userRepo.findById(id);
    if (!user) {
      throw AppError.notFound('Utilisateur introuvable.');
    }

    return this.userRepo.deleteById(id);
  }

  /* ── Authentication ─────────────────────────────────────────────────── */

  /**
   * Authenticate a user by username + phone number.
   *
   * @returns Object containing the user's `id` and a signed `token`.
   * @throws {AppError} 404 if the username/tel combination is invalid.
   */
  async login(username: string, tel: string): Promise<{ id: string; token: string }> {
    const user = await this.userRepo.findByUsername(username.toLowerCase());
    if (!user || user.tel !== tel) {
      throw AppError.notFound('Nom d\'utilisateur ou numéro de téléphone incorrect.');
    }

    const token = await this.createUserToken(user.id, user.username);
    return { id: user.id, token };
  }

  /* ── JWT helpers ─────────────────────────────────────────────────────── */

  /**
   * Create a signed JWT for a user session.
   *
   * Payload: `{ id, username }`. Algorithm: HS256. Expiry: see {@link JWT_DURATION}.
   */
  async createUserToken(id: string, username: string): Promise<string> {
    const env = getEnv();
    const secret = new TextEncoder().encode(env.USER_TOKEN_SECRET);

    return new SignJWT({ id, username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_DURATION)
      .sign(secret);
  }

  /**
   * Verify and decode a user JWT.
   *
   * @throws {JOSEError} If the token is expired, malformed, or has a bad signature.
   */
  async verifyUserToken(token: string): Promise<{ id: string; username: string }> {
    const env = getEnv();
    const secret = new TextEncoder().encode(env.USER_TOKEN_SECRET);

    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      username: payload.username as string,
    };
  }
}
