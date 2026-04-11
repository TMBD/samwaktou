/**
 * @file analytic.routes.ts
 * @description Express route definitions for usage analytics (`/api/v1/analytic`).
 *
 * This router exposes a single fire-and-forget endpoint used by the
 * frontend to record user-interaction events (page loads, audio plays, etc.).
 *
 * Route summary:
 * | Method | Path | Auth   | Description             |
 * |--------|------|--------|-------------------------|
 * | POST   | /    | public | Record an analytic event |
 */

import { Router } from 'express';

import type { AnalyticService } from '../../services/analytic.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { analyticSchema } from '../../validators/user.validators.js';

/**
 * Factory that creates and returns the analytic router.
 *
 * @param analyticService - Business-logic service for analytic events.
 */
export function createAnalyticRouter(analyticService: AnalyticService): Router {
  const router = Router();

  /* ── POST /  — record an analytic event (public) ───────────────────── */
  router.post(
    '/',
    validate(analyticSchema),
    async (req, res, next) => {
      try {
        const result = await analyticService.create({
          clientId: req.body.clientId,
          eventName: req.body.eventName,
          // Convert the optional date string to a Date object.
          date: req.body.date ? new Date(req.body.date) : undefined,
        });
        res.status(201).json(result);
      } catch (err) { next(err); }
    },
  );

  return router;
}
