/**
 * @file auth.middleware.ts
 * @description Authentication and authorisation middleware factories.
 *
 * Each factory function receives the relevant service (AdminService / UserService)
 * via DI and returns an Express middleware that:
 * 1. Extracts the JWT from the `auth-token` header.
 * 2. Verifies the token against the appropriate secret.
 * 3. Attaches the decoded payload to `req.authData` (admin) or `req.userAuthData` (user).
 *
 * If the token is missing or invalid, a 401 `AppError` is forwarded to the
 * error-handler middleware via `next(err)`.
 */

import type { Request, Response, NextFunction } from 'express';

import type { AdminService } from '../services/admin.service.js';
import type { UserService } from '../services/user.service.js';
import { AppError } from '../lib/app-error.js';

/* ── Augmented request types ──────────────────────────────────────────── */

/**
 * Express `Request` extended with optional auth payloads.
 *
 * After the auth middleware runs, downstream handlers can safely
 * access `req.authData` (admin routes) or `req.userAuthData` (user routes).
 */
export interface AuthenticatedRequest extends Request {
  /** Populated by admin-token middleware. */
  authData?: {
    id: string;
    isSuperAdmin: boolean;
    isAdmin: boolean;
  };
  /** Populated by user-token middleware. */
  userAuthData?: {
    id: string;
    username: string;
  };
}

/* ── Private helpers ──────────────────────────────────────────────────── */

/**
 * Read the JWT string from the `auth-token` request header.
 *
 * @throws {AppError} 401 if the header is missing.
 */
function extractToken(req: Request): string {
  const header = req.header('auth-token');
  if (!header) {
    throw AppError.unauthorized('Accès refusé. Aucun token fourni.');
  }
  return header;
}

/* ── Middleware factories ──────────────────────────────────────────────── */

/**
 * Factory: returns middleware that verifies an **admin** JWT.
 *
 * On success, `req.authData` is set with `{ id, isSuperAdmin, isAdmin }`.
 */
export function createVerifyAdminToken(adminService: AdminService) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);
      const payload = await adminService.verifyAdminToken(token);
      req.authData = payload;
      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
      } else {
        next(AppError.unauthorized('Token invalide.'));
      }
    }
  };
}

/**
 * Factory: returns middleware that verifies a **user** JWT.
 *
 * On success, `req.userAuthData` is set with `{ id, username }`.
 */
export function createVerifyUserToken(userService: UserService) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);
      const payload = await userService.verifyUserToken(token);
      req.userAuthData = payload;
      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
      } else {
        next(AppError.unauthorized('Token invalide.'));
      }
    }
  };
}

/**
 * Factory: returns middleware that accepts **either** an admin or a user JWT.
 *
 * This is used on routes where both admins and users are authorised
 * (e.g. deleting a user account — the owner or an admin can do it).
 *
 * Strategy:
 * 1. Try to verify the token as an admin token.
 * 2. If that fails, try to verify it as a user token.
 * 3. If both fail, return 401.
 *
 * When verified as a user, `req.authData` is also populated (with
 * `isAdmin: false`) for backward compatibility in the route handler.
 */
export function createVerifyTokenForDeleteUser(adminService: AdminService, userService: UserService) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);

      // Attempt 1 — admin token
      try {
        const adminPayload = await adminService.verifyAdminToken(token);
        req.authData = adminPayload;
        next();
        return;
      } catch {
        // Not an admin token — fall through to user verification.
      }

      // Attempt 2 — user token
      try {
        const userPayload = await userService.verifyUserToken(token);
        req.userAuthData = userPayload;
        // Populate authData as well so the route handler has a uniform interface.
        req.authData = { id: userPayload.id, isSuperAdmin: false, isAdmin: false };
        next();
      } catch {
        next(AppError.unauthorized('Token invalide.'));
      }
    } catch (err) {
      next(err instanceof AppError ? err : AppError.unauthorized('Token invalide.'));
    }
  };
}

/* ── Authorisation guards ─────────────────────────────────────────────── */

/**
 * Guard middleware: blocks the request unless the authenticated admin
 * has the `isSuperAdmin` flag set to `true`.
 *
 * Must be placed **after** `createVerifyAdminToken` in the middleware chain.
 */
export function requireSuperAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.authData?.isSuperAdmin) {
    next(AppError.forbidden('Seuls les super administrateurs ont accès à cette action.'));
    return;
  }
  next();
}
