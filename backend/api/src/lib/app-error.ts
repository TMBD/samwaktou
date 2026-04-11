/**
 * @file app-error.ts
 * @description Custom error class for domain / HTTP errors.
 *
 * `AppError` extends the native `Error` and adds:
 * - `statusCode` — the HTTP status to return to the client.
 * - `isOperational` — `true` for expected errors (bad input, not found …),
 *   `false` for unexpected / programmer errors. The error-handler middleware
 *   uses this flag to decide whether to expose the message to the client.
 * - `details` — optional structured payload (e.g. Zod validation issues)
 *   that the error-handler can include in the JSON response body.
 *
 * Static factory methods (`badRequest`, `notFound`, …) provide a readable,
 * concise way to throw common HTTP errors from services and controllers:
 *
 * ```ts
 * throw AppError.notFound('Utilisateur introuvable.');
 * ```
 */

import { HTTP_CODE } from '../config/constants.js';

export class AppError extends Error {
  /** HTTP status code to send in the response (e.g. 400, 404, 500). */
  public readonly statusCode: number;

  /**
   * `true`  → expected business error (bad input, duplicate, auth failure …).
   * `false` → unexpected / programmer error that should be logged as critical.
   */
  public readonly isOperational: boolean;

  /** Optional structured data attached to the error (e.g. validation issues). */
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = HTTP_CODE.INTERNAL_SERVER_ERROR,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Preserve a clean stack trace that excludes the AppError constructor itself.
    Error.captureStackTrace(this, this.constructor);
  }

  /* ── Static factory methods ─────────────────────────────────────────── */

  /** 400 — The request body or query parameters are invalid. */
  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_CODE.BAD_REQUEST, details);
  }

  /** 401 — Missing or invalid authentication token. */
  static unauthorized(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_CODE.UNAUTHORIZED, details);
  }

  /** 403 — Authenticated but lacks the required permissions. */
  static forbidden(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_CODE.FORBIDDEN, details);
  }

  /** 404 — The requested resource does not exist. */
  static notFound(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_CODE.NOT_FOUND, details);
  }

  /** 409 — A resource with the same unique key already exists. */
  static conflict(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_CODE.CONFLICT, details);
  }

  /**
   * 500 — Unexpected internal error.
   * Marked as **non-operational** so the error-handler logs it at `fatal`
   * level and returns a generic message to the client.
   */
  static internal(message: string, details?: unknown): AppError {
    return new AppError(message, HTTP_CODE.INTERNAL_SERVER_ERROR, details, false);
  }
}
