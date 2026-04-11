/**
 * @file user.validators.ts
 * @description Zod schemas for validating user and analytic HTTP request
 * bodies and query strings.
 *
 * The analytic schema is co-located here because it is used by the same
 * set of public-facing routes (no separate analytic validator file needed).
 */

import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';

/** Schema for `POST /users` — register a new public user. */
export const createUserSchema = z.object({
  username: z.string().min(3).max(100),
  tel: z.string().min(6).max(20),
  email: z.string().email().optional(),
  date: z.string().optional(),
});

/** Schema for `PUT /users/:id` — update a user's profile. `username` is required. */
export const updateUserSchema = z.object({
  username: z.string().min(3).max(100),
  tel: z.string().min(6).max(20).optional(),
  email: z.string().email().optional(),
});

/** Schema for `POST /users/login` — user authentication. */
export const loginUserSchema = z.object({
  username: z.string().min(1),
  tel: z.string().min(1),
});

/**
 * Schema for `GET /users` query string — filtering and pagination.
 *
 * Pagination defaults come from {@link PAGINATION} constants.
 */
export const getUsersQuerySchema = z.object({
  username: z.string().optional(),
  tel: z.string().optional(),
  email: z.string().email().optional(),
  skip: z.coerce.number().int().min(0).optional().default(PAGINATION.USER_DEFAULT_SKIP),
  limit: z.coerce.number().int().min(1).max(PAGINATION.USER_MAX_LIMIT).optional().default(PAGINATION.USER_DEFAULT_LIMIT),
});

/**
 * Schema for `POST /analytics` — record a usage event.
 *
 * `eventName` is restricted to a known set of event identifiers.
 */
export const analyticSchema = z.object({
  clientId: z.string().min(1),
  eventName: z.enum(['PAGE_LOAD', 'START_LISTENING_AUDIO', 'AUDIO_DOWNLOADED']),
  date: z.string().optional(),
});
