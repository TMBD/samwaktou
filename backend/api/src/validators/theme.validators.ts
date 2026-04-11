/**
 * @file theme.validators.ts
 * @description Zod schemas for validating theme-related HTTP request bodies and query params.
 *
 * Each schema is used via the `validate` middleware before the route handler
 * runs, so the handler can trust that `req.body` / `req.query` has already
 * been parsed and coerced to the correct types.
 */

import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';

/* ── Body schemas ────────────────────────────────────────────────────── */

/** Schema for `POST /themes` — create a new theme. */
export const createThemeSchema = z.object({
  name: z.string().min(1, 'Le nom du thème est obligatoire.').max(200),
});

/** Schema for `PUT /themes/:id` — update a theme's name. */
export const updateThemeSchema = z.object({
  name: z.string().min(1, 'Le nom du thème est obligatoire.').max(200),
});

/* ── Query schemas ───────────────────────────────────────────────────── */

/**
 * Schema for `GET /themes` — list themes with optional filters and pagination.
 *
 * `isValidated` arrives as a string ("true" / "false") from the query string,
 * so we transform it to a boolean.
 */
export const getThemesQuerySchema = z.object({
  isValidated: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  name: z.string().optional(),
  skip: z.coerce.number().int().min(0).default(PAGINATION.THEME_DEFAULT_SKIP),
  limit: z.coerce.number().int().min(1).max(PAGINATION.THEME_MAX_LIMIT).default(PAGINATION.THEME_DEFAULT_LIMIT),
});
