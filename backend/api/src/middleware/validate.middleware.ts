/**
 * @file validate.middleware.ts
 * @description Generic Zod validation middleware for Express.
 *
 * Usage in a route definition:
 * ```ts
 * router.post('/admins', validate(createAdminSchema, 'body'), handler);
 * router.get('/audios',  validate(audioFilterSchema, 'query'), handler);
 * ```
 *
 * On validation failure the middleware forwards a 400 `AppError` to the
 * error-handler with a structured `details` array listing every invalid field.
 *
 * On success, the raw `req[target]` is **replaced** with the Zod-parsed
 * output so downstream handlers receive coerced / transformed values.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

import { AppError } from '../lib/app-error.js';

/** Which part of the Express request the schema should validate. */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Returns an Express middleware that validates `req[target]` against
 * the provided Zod schema.
 *
 * @param schema - A Zod schema describing the expected shape.
 * @param target - The request property to validate (default: `'body'`).
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // Map Zod issues to a simplified format the client can display.
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      next(AppError.badRequest('Données invalides. Veuillez renseigner correctement tous les champs.', details));
      return;
    }

    // Overwrite with the parsed (coerced / default-filled) data so route
    // handlers never work with raw, unvalidated values.
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
