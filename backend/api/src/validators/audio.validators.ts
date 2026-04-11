/**
 * @file audio.validators.ts
 * @description Zod schemas for validating audio-related HTTP request bodies
 * and query strings.
 *
 * - Body schemas are validated with `validate(schema, 'body')`.
 * - Query schemas are validated with `validate(schema, 'query')` — note that
 *   query-string values arrive as strings, so `z.coerce.number()` is used to
 *   convert pagination parameters.
 */

import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';

/** Schema for `POST /audios` — create a new audio record. */
export const createAudioSchema = z.object({
  theme: z.string().min(1).max(200),
  author: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000),
  keywords: z.string().min(1).max(500).refine((v) => v.trim().length > 0, {
    message: 'keywords field contains only whitespace characters.',
  }),
  /** Optional date string in DD-MM-YYYY format. Validated further in the service layer. */
  date: z.string().optional(),
});

/**
 * Schema for `PUT /audios/:id` — partial update of audio metadata.
 *
 * At least one field must be provided (enforced by the `.refine()` check).
 */
export const updateAudioSchema = z.object({
  theme: z.string().min(1).max(200).optional(),
  author: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  keywords: z.string().min(1).max(500).refine((v) => v.trim().length > 0, {
    message: 'keywords field contains only whitespace characters.',
  }).optional(),
  date: z.string().optional(),
}).refine((data) => Object.values(data).some((v) => v !== undefined), {
  message: 'At least one field must be provided.',
});

/**
 * Schema for `GET /audios` query string — filtering and pagination.
 *
 * `skip` and `limit` are coerced from strings to numbers since Express
 * parses query parameters as strings.  Sensible defaults are applied.
 */
export const getAudiosQuerySchema = z.object({
  theme: z.string().optional(),
  author: z.string().optional(),
  keywords: z.string().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  skip: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(PAGINATION.AUDIO_MAX_LIMIT).optional().default(PAGINATION.AUDIO_DEFAULT_LIMIT),
});
