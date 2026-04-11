/**
 * @file admin.routes.ts
 * @description Express route definitions for admin management (`/api/v1/admins`).
 *
 * All routes (except login) require an admin JWT via `verifyAdminToken`.
 * Create and delete operations additionally require the `isSuperAdmin` flag.
 *
 * Route summary:
 * | Method | Path               | Auth          | Description               |
 * |--------|--------------------|---------------|---------------------------|
 * | POST   | /                  | super-admin   | Create admin              |
 * | GET    | /:adminId          | admin         | Get single admin          |
 * | GET    | /                  | admin         | List admins (paginated)   |
 * | DELETE | /:adminId          | super-admin   | Delete admin              |
 * | PUT    | /:adminId          | admin (self)  | Update admin profile      |
 * | PUT    | /password/:adminId | admin         | Change password           |
 * | POST   | /login             | public        | Admin login               |
 */

import { Router } from 'express';

import type { AdminService } from '../../services/admin.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { requireSuperAdmin, type AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createAdminSchema, updateAdminSchema, loginAdminSchema, updatePasswordSchema } from '../../validators/admin.validators.js';
import { PAGINATION } from '../../config/constants.js';

/**
 * Factory that creates and returns the admin router.
 *
 * @param adminService     - Business-logic service for admin operations.
 * @param verifyAdminToken - Pre-built middleware that validates admin JWTs.
 */
export function createAdminRouter(
  adminService: AdminService,
  verifyAdminToken: Router extends never ? never : ReturnType<typeof import('../../middleware/auth.middleware.js').createVerifyAdminToken>,
): Router {
  const router = Router();

  /* ── POST /  — create admin (super-admin only) ──────────────────────── */
  router.post(
    '/',
    verifyAdminToken,
    requireSuperAdmin,
    validate(createAdminSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const admin = await adminService.create(req.body);
        res.status(201).json(admin);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:adminId  — get a single admin by ID ─────────────────────── */
  router.get(
    '/:adminId',
    verifyAdminToken,
    async (req, res, next) => {
      try {
        const admin = await adminService.findById(req.params.adminId);
        res.json(admin);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /  — list admins with optional filters & pagination ────────── */
  router.get(
    '/',
    verifyAdminToken,
    async (req, res, next) => {
      try {
        const skip = Number(req.query.skip) || PAGINATION.ADMIN_DEFAULT_SKIP;
        const limit = Math.min(Number(req.query.limit) || PAGINATION.ADMIN_DEFAULT_LIMIT, PAGINATION.ADMIN_MAX_LIMIT);

        const admins = await adminService.findMany(
          {
            surname: req.query.surname as string | undefined,
            name: req.query.name as string | undefined,
            email: req.query.email as string | undefined,
          },
          skip,
          limit,
        );
        res.json(admins);
      } catch (err) { next(err); }
    },
  );

  /* ── DELETE /:adminId  — delete admin (super-admin only) ────────────── */
  router.delete(
    '/:adminId',
    verifyAdminToken,
    requireSuperAdmin,
    async (req, res, next) => {
      try {
        await adminService.deleteById(req.params.adminId);
        res.status(204).end();
      } catch (err) { next(err); }
    },
  );

  /* ── PUT /:adminId  — update admin profile (super-admin or self) ───── */
  router.put(
    '/:adminId',
    verifyAdminToken,
    validate(updateAdminSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        // Authorisation: only the account owner or a super-admin may update.
        if (!req.authData?.isSuperAdmin && req.authData?.id !== req.params.adminId) {
          res.status(403).json({
            success: false,
            message: 'Seuls les super administrateurs peuvent modifier les informations d\'un autre administrateur.',
          });
          return;
        }
        await adminService.update(req.params.adminId, req.body);
        res.status(200).json({ success: true });
      } catch (err) { next(err); }
    },
  );

  /* ── PUT /password/:adminId  — change password ─────────────────────── */
  router.put(
    '/password/:adminId',
    verifyAdminToken,
    validate(updatePasswordSchema),
    async (req, res, next) => {
      try {
        await adminService.updatePassword(
          req.params.adminId,
          req.body.password,
          req.body.newPassword,
        );
        res.status(200).json({ success: true });
      } catch (err) { next(err); }
    },
  );

  /* ── POST /login  — admin authentication (public) ──────────────────── */
  router.post(
    '/login',
    validate(loginAdminSchema),
    async (req, res, next) => {
      try {
        const result = await adminService.login(req.body.email, req.body.password);
        res.json(result);
      } catch (err) { next(err); }
    },
  );

  return router;
}
