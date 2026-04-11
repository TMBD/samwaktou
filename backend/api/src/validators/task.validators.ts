/**
 * @file task.validators.ts
 * @description Zod schemas for validating task-related HTTP request bodies and query params.
 *
 * Each schema is used via the `validate` middleware before the route handler
 * runs, so the handler can trust that `req.body` / `req.query` has already
 * been parsed and coerced to the correct types.
 */

import { z } from 'zod';
import { TaskStatus } from '../config/constants.js';
import { PAGINATION } from '../config/constants.js';

/* ── Body schemas ────────────────────────────────────────────────────── */

/**
 * Schema for per-file metadata submitted alongside each uploaded audio file.
 * The actual file binary is handled by `express-fileupload`, not by Zod.
 */
export const audioDraftMetaSchema = z.object({
  description: z.string().min(1).max(1000),
  theme: z.string().min(1).max(200),
  keywords: z.string().min(1).max(500),
});

/**
 * Schema for `POST /tasks` — create a new task.
 *
 * `files` (audio binaries) are validated separately in the route handler.
 * This schema validates the JSON metadata that accompanies the upload.
 */
export const createTaskSchema = z.object({
  description: z.string().min(1).max(2000),
  sessionAuthor: z.string().min(1).max(200),
  sessionDate: z.coerce.date(),
  /** Per-file metadata array — one entry per uploaded audio file. */
  drafts: z.array(audioDraftMetaSchema).min(1, 'Au moins un brouillon audio est requis.'),
});

/**
 * Schema for `PATCH /tasks/:taskId/reject` — reject a task.
 * A reason is mandatory when rejecting.
 */
export const rejectTaskSchema = z.object({
  reason: z.string().min(1, 'La raison du rejet est obligatoire.').max(2000),
});

/**
 * Schema for `PATCH /tasks/:taskId/suggest-rejection` — suggest rejection.
 */
export const suggestRejectionSchema = z.object({
  reason: z.string().min(1, 'La raison de la suggestion de rejet est obligatoire.').max(2000),
});

/**
 * Schema for `PATCH /tasks/:taskId/reassign` — reassign to another admin.
 */
export const reassignTaskSchema = z.object({
  assigneeId: z.string().min(1, 'L\'identifiant du nouvel assigné est obligatoire.'),
});

/**
 * Schema for `PATCH /tasks/:taskId/request-corrections` — optional comment.
 */
export const requestCorrectionsSchema = z.object({
  comment: z.string().max(2000).optional(),
});

/* ── Query schemas ───────────────────────────────────────────────────── */

/**
 * Schema for `GET /tasks` — list tasks with optional filters and pagination.
 *
 * Query params are strings by default, so numbers are coerced via `z.coerce.number()`.
 */
export const getTasksQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  assignee: z.string().optional(),
  createdBy: z.string().optional(),
  sessionAuthor: z.string().optional(),
  minDate: z.coerce.date().optional(),
  maxDate: z.coerce.date().optional(),
  skip: z.coerce.number().int().min(0).default(PAGINATION.TASK_DEFAULT_SKIP),
  limit: z.coerce.number().int().min(1).max(PAGINATION.TASK_MAX_LIMIT).default(PAGINATION.TASK_DEFAULT_LIMIT),
});
