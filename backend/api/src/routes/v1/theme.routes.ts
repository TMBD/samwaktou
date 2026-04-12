/**
 * @file theme.routes.ts
 * @description Express route definitions for theme management (`/api/v1/themes`).
 *
 * All routes require admin authentication. Role requirements vary:
 *
 * | Method | Path              | Min Role    | Description                    |
 * |--------|-------------------|-------------|--------------------------------|
 * | POST   | /                 | CONTRIBUTOR | Create a new theme             |
 * | GET    | /                 | CONTRIBUTOR | List themes (filtered, paged)  |
 * | GET    | /:themeId         | CONTRIBUTOR | Get single theme               |
 * | PUT    | /:themeId         | REVIEWER    | Full update (name required)    |
 * | PATCH  | /:themeId         | REVIEWER    | Partial update (name/desc)     |
 * | PATCH  | /:themeId/validate| REVIEWER    | Validate an unvalidated theme  |
 * | DELETE | /:themeId         | PUBLISHER   | Delete a theme                 |
 *
 * @see ThemeService for business logic.
 */

import { Router } from 'express';
import type { Response, NextFunction } from 'express';

import { AdminRole, HTTP_CODE } from '../../config/constants.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createThemeSchema,
  updateThemeSchema,
  patchThemeSchema,
  getThemesQuerySchema,
} from '../../validators/theme.validators.js';
import type { ThemeService } from '../../services/theme.service.js';
import type { ActivityLogService } from '../../services/activity-log.service.js';

/**
 * Factory that creates and returns the theme router.
 *
 * @param themeService       - Business-logic service for themes.
 * @param activityLogService - Service for logging theme actions.
 * @param verifyAdminToken   - Pre-built middleware that validates admin JWTs.
 */
export function createThemeRouter(
  themeService: ThemeService,
  activityLogService: ActivityLogService,
  verifyAdminToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
): Router {
  const router = Router();

  /* ── POST /  — create a new theme (Contributor+) ───────────────────── */
  router.post(
    '/',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    validate(createThemeSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const theme = await themeService.create(
          req.body.name,
          req.authData!.id,
          req.authData!.role,
          req.body.description,
        );

        await activityLogService.logThemeAction(theme.id, 'THEME_CREATED', req.authData!.id, {
          name: theme.name,
          isValidated: theme.isValidated,
        });

        res.status(HTTP_CODE.CREATED).json({ success: true, data: theme });
      } catch (err) { next(err); }
    },
  );

  /* ── GET /  — list themes (Contributor+) ────────────────────────────── */
  router.get(
    '/',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    validate(getThemesQuerySchema, 'query'),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { skip, limit, ...filter } = req.query as unknown as {
          skip: number;
          limit: number;
          isValidated?: boolean;
          name?: string;
        };

        const result = await themeService.findMany(filter, skip, limit);
        res.json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            skip,
            limit,
            hasMore: skip + result.data.length < result.total,
          },
        });
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:themeId  — get single theme (Contributor+) ──────────────── */
  router.get(
    '/:themeId',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const theme = await themeService.findById(req.params.themeId);
        res.json({ success: true, data: theme });
      } catch (err) { next(err); }
    },
  );

  /* ── PUT /:themeId  — full update (Reviewer+) ───────────────────────── */
  router.put(
    '/:themeId',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    validate(updateThemeSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const theme = await themeService.update(req.params.themeId, {
          name: req.body.name,
          description: req.body.description,
        });

        await activityLogService.logThemeAction(theme.id, 'THEME_UPDATED', req.authData!.id, {
          newName: theme.name,
        });

        res.json({ success: true, data: theme });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:themeId  — partial update (Reviewer+) ──────────────────── */
  router.patch(
    '/:themeId',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    validate(patchThemeSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const theme = await themeService.update(req.params.themeId, {
          name: req.body.name,
          description: req.body.description,
        });

        await activityLogService.logThemeAction(theme.id, 'THEME_UPDATED', req.authData!.id, {
          newName: theme.name,
        });

        res.json({ success: true, data: theme });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:themeId/validate  — validate theme (Reviewer+) ────────── */
  router.patch(
    '/:themeId/validate',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const theme = await themeService.validate(req.params.themeId, req.authData!.id);

        await activityLogService.logThemeAction(theme.id, 'THEME_VALIDATED', req.authData!.id);

        res.json({ success: true, data: theme });
      } catch (err) { next(err); }
    },
  );

  /* ── DELETE /:themeId  — delete theme (Publisher+) ──────────────────── */
  router.delete(
    '/:themeId',
    verifyAdminToken,
    requireRole(AdminRole.PUBLISHER),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await activityLogService.logThemeAction(
          req.params.themeId,
          'THEME_DELETED',
          req.authData!.id,
        );

        await themeService.deleteById(req.params.themeId);
        res.status(HTTP_CODE.NO_CONTENT).end();
      } catch (err) { next(err); }
    },
  );

  return router;
}
