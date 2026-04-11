/**
 * @file audio-draft.types.ts
 * @description TypeScript types for the AudioDraft entity on the frontend.
 *
 * These mirror the backend `IAudioDraft` interface but only include fields
 * returned by the API.
 */

import type { AudioDraftStatus } from './enums';

/* ── Read model ───────────────────────────────────────────────────────── */

/** Audio draft as returned by the API (GET /tasks/:taskId/drafts). */
export interface AudioDraft {
  id: string;
  task: string;
  uri: string;
  originalFileName: string;
  description: string;
  theme: string;
  keywords: string[];
  status: AudioDraftStatus;
  isNewTheme: boolean;
  rejectionSuggestedReason: string | null;
  reviewComment: string | null;
  correctionComment: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/* ── Write models ─────────────────────────────────────────────────────── */

/** Payload for PATCH /tasks/:taskId/drafts/:draftId (update metadata). */
export interface AudioDraftUpdatePayload {
  description?: string;
  theme?: string;
  keywords?: string[];
}

/** Payload for PATCH /tasks/:taskId/drafts/:draftId/review. */
export interface AudioDraftReviewPayload {
  status: AudioDraftStatus;
  reviewComment?: string;
  correctionComment?: string;
  rejectionSuggestedReason?: string;
}
