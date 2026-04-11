/**
 * @file admin.routes.ts
 * @description Express route definitions for admin management (`/api/v1/admins`).
 *
 * All routes (except login) require an admin JWT via `verifyAdminToken`.
 * Create, update-other, and delete operations require SYSTEM_ADMIN role.
 * Listing admins requires at least REVIEWER role.
 *
 * Phase 1 changes:
 * - `requireSuperAdmin` replaced by `requireRole(AdminRole.SYSTEM_ADMIN)`.
 * - GET list now requires REVIEWER+ (was any admin).
 * - PUT update uses role-based check instead of `isSuperAdmin`.
 *
 * Route summary:
 * | Method | Path               | Min Role     | Description               |
 * |--------|--------------------|--------------|---------------------------|
 * | POST   | /login             | public       | Admin login               |
 * | POST   | /                  | SYSTEM_ADMIN | Create admin              |
 * | GET    | /me                | CONTRIBUTOR  | Get current admin profile |
 * | GET    | /                  | REVIEWER     | List admins (paginated)   |
 * | GET    | /:adminId          | CONTRIBUTOR  | Get single admin          |
 * | PUT    | /password/:adminId | self         | Change own password       |
 * | PUT    | /:adminId          | SYSTEM_ADMIN | Update admin profile      |
 * | DELETE | /:adminId          | SYSTEM_ADMIN | Delete admin              |
 */

import { Router } from 'express';

import type { AdminService } from '../../services/admin.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { requireRole, type AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createAdminSchema, updateAdminSchema, loginAdminSchema, updatePasswordSchema } from '../../validators/admin.validators.js';
import { AdminRole, PAGINATION } from '../../config/constants.js';

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

  /* ── POST /  — create admin (SYSTEM_ADMIN only) ─────────────────────── */
  router.post(
    '/',
    verifyAdminToken,
    requireRole(AdminRole.SYSTEM_ADMIN),
    validate(createAdminSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const admin = await adminService.create(req.body);
        const { password: _, ...safeAdmin } = admin;
        res.status(201).json(safeAdmin);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /me  — get current admin profile (any authenticated admin) ── */
  router.get(
    '/me',
    verifyAdminToken,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const admin = await adminService.findById(req.authData!.id);
        if (!admin) {
          res.status(404).json({ success: false, message: 'Administrateur introuvable.' });
          return;
        }
        const { password: _, ...safeAdmin } = admin;
        res.json({ success: true, data: safeAdmin });
      } catch (err) { next(err); }
    },
  );

  /* ── GET /  — list admins with optional filters & pagination (REVIEWER+) */
  router.get(
    '/',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
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
        res.json({
          success: true,
          data: admins,
          pagination: {
            total: admins.length,
            skip,
            limit,
            hasMore: admins.length === limit,
          },
        });
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:adminId  — get a single admin by ID (any admin) ─────────── */
  router.get(
    '/:adminId',
    verifyAdminToken,
    async (req, res, next) => {
      try {
        const admin = await adminService.findById(req.params.adminId);
        if (!admin) {
          res.status(404).json({ success: false, message: 'Administrateur introuvable.' });
          return;
        }
        const { password: _, ...safeAdmin } = admin;
        res.json({ success: true, data: safeAdmin });
      } catch (err) { next(err); }
    },
  );

  /* ── PUT /password/:adminId  — change own password ─────────────────── */
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

  /* ── PUT /:adminId  — update admin profile (SYSTEM_ADMIN only) ──────── */
  router.put(
    '/:adminId',
    verifyAdminToken,
    requireRole(AdminRole.SYSTEM_ADMIN),
    validate(updateAdminSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await adminService.update(req.params.adminId, req.body);
        res.status(200).json({ success: true });
      } catch (err) { next(err); }
    },
  );

  /* ── DELETE /:adminId  — delete admin (SYSTEM_ADMIN only) ───────────── */
  router.delete(
    '/:adminId',
    verifyAdminToken,
    requireRole(AdminRole.SYSTEM_ADMIN),
    async (req, res, next) => {
      try {
        await adminService.deleteById(req.params.adminId);
        res.status(204).end();
      } catch (err) { next(err); }
    },
  );

  return router;
}
