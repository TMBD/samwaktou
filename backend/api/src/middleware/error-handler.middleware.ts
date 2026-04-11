/**
 * @file error-handler.middleware.ts
 * @description Centralised Express error-handling middleware.
 *
 * This is the **last** middleware registered in the Express pipeline.
 * It catches every error forwarded via `next(err)` and sends a uniform
 * JSON response to the client:
 *
 * ```json
 * { "success": false, "message": "…", "details": [ … ] }
 * ```
 *
 * Behaviour:
 * - **AppError (operational)** → returns the error's status code and message.
 * - **AppError (non-operational)** → logs at `error` level, returns the error info.
 * - **Unknown / unexpected error** → logs at `error` level, returns a generic 500.
 */

import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';
import { HTTP_CODE } from '../config/constants.js';

/**
 * Express error-handling middleware (signature must have **4** parameters).
 *
 * Must be registered **after** all route handlers so it can catch their errors.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  /* ── Known domain errors ──────────────────────────────────────────── */
  if (err instanceof AppError) {
    // Non-operational errors are programmer mistakes — always log them.
    if (!err.isOperational) {
      logger.error({ err }, 'Non-operational error');
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      // Include structured details (e.g. validation issues) when present.
      ...(err.details !== undefined && { details: err.details }),
    });
    return;
  }

  /* ── Unexpected / unhandled errors ────────────────────────────────── */
  logger.error({ err }, 'Unhandled error');

  res.status(HTTP_CODE.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Une erreur interne s\'est produite.',
  });
}
