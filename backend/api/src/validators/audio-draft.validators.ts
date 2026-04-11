/**
 * @file audio-draft.validators.ts
 * @description Zod schemas for validating audio-draft-related HTTP request bodies.
 *
 * Each schema is used via the `validate` middleware before the route handler
 * runs, so the handler can trust that `req.body` has already been parsed and
 * coerced to the correct types.
 */

import { z } from 'zod';
import { AudioDraftStatus } from '../config/constants.js';

/* ── Body schemas ────────────────────────────────────────────────────── */

/**
 * Schema for `PATCH /tasks/:taskId/drafts/:draftId` — update a draft's metadata.
 *
 * Used by contributors to fill in / correct description, theme, keywords,
 * and to mark a draft as DONE or REJECTION_SUGGESTED.
 */
export const updateDraftSchema = z.object({
  description: z.string().min(1).max(1000).optional(),
  theme: z.string().min(1).max(200).optional(),
  keywords: z.string().min(1).max(500).optional(),
  status: z.enum([AudioDraftStatus.DONE, AudioDraftStatus.REJECTION_SUGGESTED]).optional(),
  rejectionSuggestedReason: z.string().min(1).max(2000).optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'Au moins un champ doit être fourni.' },
);

/**
 * Schema for `PATCH /tasks/:taskId/drafts/:draftId/review` — reviewer action on a draft.
 *
 * Reviewers can approve, reject, or request corrections on individual drafts.
 * A `reviewComment` is optional for approvals but recommended for rejections.
 */
export const reviewDraftSchema = z.object({
  status: z.enum([
    AudioDraftStatus.APPROVED,
    AudioDraftStatus.REJECTED,
    AudioDraftStatus.CORRECTIONS_NEEDED,
  ]),
  reviewComment: z.string().max(2000).optional(),
  correctionComment: z.string().max(2000).optional(),
});
