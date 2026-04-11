/**
 * @file audio-draft.api.ts
 * @description API functions for the AudioDraft entity.
 *
 * All endpoints are nested under `/tasks/:taskId/drafts`.
 */

import { get, getList, patch, buildQuery } from './client';
import type { AudioDraft, AudioDraftUpdatePayload, AudioDraftReviewPayload } from '@/types';

/* ── Queries ──────────────────────────────────────────────────────────── */

/** GET /tasks/:taskId/drafts — List all drafts for a task. */
export async function getDrafts(taskId: string) {
  return getList<AudioDraft>(`/tasks/${taskId}/drafts`);
}

/** GET /tasks/:taskId/drafts/:draftId — Get a single draft. */
export async function getDraft(taskId: string, draftId: string) {
  return get<AudioDraft>(`/tasks/${taskId}/drafts/${draftId}`);
}

/* ── Mutations ────────────────────────────────────────────────────────── */

/** PATCH /tasks/:taskId/drafts/:draftId — Update draft metadata. */
export async function updateDraft(
  taskId: string,
  draftId: string,
  payload: AudioDraftUpdatePayload,
) {
  return patch<AudioDraft>(`/tasks/${taskId}/drafts/${draftId}`, payload);
}

/** PATCH /tasks/:taskId/drafts/:draftId/review — Review a draft. */
export async function reviewDraft(
  taskId: string,
  draftId: string,
  payload: AudioDraftReviewPayload,
) {
  return patch<AudioDraft>(`/tasks/${taskId}/drafts/${draftId}/review`, payload);
}

/* ── Streaming ────────────────────────────────────────────────────────── */

/**
 * Build the full URL for streaming/downloading a draft audio file.
 * Used directly as an `<audio src="...">` or download link.
 */
export function getDraftStreamUrl(taskId: string, draftId: string): string {
  const base = import.meta.env.VITE_API_SERVER_URL ?? 'http://localhost:8080';
  return `${base}/api/v1/tasks/${taskId}/drafts/${draftId}/stream`;
}

/* ── Query helpers ────────────────────────────────────────────────────── */

export function buildDraftQuery(filters: Record<string, unknown>): string {
  return buildQuery(filters);
}
