/**
 * @file author.validators.ts
 * @description Zod schemas for validating author-related HTTP request bodies and query params.
 */

import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';

/* ── Body schemas ────────────────────────────────────────────────────── */

export const createAuthorSchema = z.object({
  name: z.string().min(1, "Le nom de l'auteur est obligatoire.").max(200),
  description: z.string().max(1000).optional(),
});

export const updateAuthorSchema = z.object({
  name: z.string().min(1, "Le nom de l'auteur est obligatoire.").max(200),
  description: z.string().max(1000).optional(),
});

export const patchAuthorSchema = z.object({
  name: z.string().min(1, "Le nom de l'auteur est obligatoire.").max(200).optional(),
  description: z.string().max(1000).optional(),
});

/* ── Query schemas ───────────────────────────────────────────────────── */

export const getAuthorsQuerySchema = z.object({
  name: z.string().optional(),
  skip: z.coerce.number().int().min(0).default(PAGINATION.AUTHOR_DEFAULT_SKIP),
  limit: z.coerce.number().int().min(1).max(PAGINATION.AUTHOR_MAX_LIMIT).default(PAGINATION.AUTHOR_DEFAULT_LIMIT),
});
