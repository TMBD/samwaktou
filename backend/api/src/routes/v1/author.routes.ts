/**
 * @file author.routes.ts
 * @description Express route definitions for author management (`/api/v1/authors`).
 *
 * All routes require admin authentication. Role requirements:
 *
 * | Method | Path           | Min Role  | Description             |
 * |--------|----------------|-----------|-------------------------|
 * | POST   | /              | REVIEWER  | Create a new author     |
 * | GET    | /              | CONTRIBUTOR | List authors (paged)  |
 * | GET    | /:authorId     | CONTRIBUTOR | Get single author     |
 * | PUT    | /:authorId     | REVIEWER  | Full update             |
 * | PATCH  | /:authorId     | REVIEWER  | Partial update          |
 * | DELETE | /:authorId     | REVIEWER  | Delete an author        |
 */

import { Router } from 'express';
import type { Response, NextFunction } from 'express';

import { AdminRole, HTTP_CODE } from '../../config/constants.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createAuthorSchema,
  updateAuthorSchema,
  patchAuthorSchema,
  getAuthorsQuerySchema,
} from '../../validators/author.validators.js';
import type { AuthorService } from '../../services/author.service.js';

export function createAuthorRouter(
  authorService: AuthorService,
  verifyAdminToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
): Router {
  const router = Router();

  /* ── POST /  — create a new author (Reviewer+) ────────────────────── */
  router.post(
    '/',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    validate(createAuthorSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const author = await authorService.create(
          req.body.name,
          req.authData!.id,
          req.body.description,
        );
        res.status(HTTP_CODE.CREATED).json({ success: true, data: author });
      } catch (err) { next(err); }
    },
  );

  /* ── GET /  — list authors (Contributor+) ──────────────────────────── */
  router.get(
    '/',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    validate(getAuthorsQuerySchema, 'query'),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { skip, limit, ...filter } = req.query as unknown as {
          skip: number;
          limit: number;
          name?: string;
        };

        const result = await authorService.findMany(filter, skip, limit);
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

  /* ── GET /:authorId  — get single author (Contributor+) ───────────── */
  router.get(
    '/:authorId',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const author = await authorService.findById(req.params.authorId);
        res.json({ success: true, data: author });
      } catch (err) { next(err); }
    },
  );

  /* ── PUT /:authorId  — full update (Reviewer+) ────────────────────── */
  router.put(
    '/:authorId',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    validate(updateAuthorSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const author = await authorService.update(req.params.authorId, {
          name: req.body.name,
          description: req.body.description,
        });
        res.json({ success: true, data: author });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:authorId  — partial update (Reviewer+) ───────────────── */
  router.patch(
    '/:authorId',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    validate(patchAuthorSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const author = await authorService.update(req.params.authorId, {
          name: req.body.name,
          description: req.body.description,
        });
        res.json({ success: true, data: author });
      } catch (err) { next(err); }
    },
  );

  /* ── DELETE /:authorId  — delete author (Reviewer+) ───────────────── */
  router.delete(
    '/:authorId',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await authorService.deleteById(req.params.authorId);
        res.status(HTTP_CODE.NO_CONTENT).end();
      } catch (err) { next(err); }
    },
  );

  return router;
}
