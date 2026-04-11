/**
 * @file task.types.ts
 * @description TypeScript types for the Task entity on the frontend.
 *
 * These mirror the backend `ITask` / `IContentState` interfaces but only
 * include fields returned by the API.
 */

import type { TaskStatus } from './enums';

/* ── Embedded sub-type ────────────────────────────────────────────────── */

/** Aggregated counts of audio-draft statuses within a task. */
export interface ContentState {
  total: number;
  done: number;
  approved: number;
  rejected: number;
  correctionNeeded: number;
  pending: number;
}

/* ── Read model ───────────────────────────────────────────────────────── */

/** Task as returned by the API (GET /tasks, GET /tasks/:id). */
export interface Task {
  id: string;
  description: string;
  sessionAuthor: string;
  sessionDate: string;
  status: TaskStatus;
  assignee: string | null;
  previousAssignee: string | null;
  createdBy: string;
  reviewedBy: string | null;
  contentState: ContentState;
  rejectionReason: string | null;
  taskRejectionSuggested: boolean;
  taskRejectionSuggestedReason: string | null;
  publishedAudioIds: string[];
  createdAt: string;
  updatedAt: string;
}

/* ── Write models ─────────────────────────────────────────────────────── */

/** Payload for POST /tasks (create) — sent as FormData with audio files. */
export interface TaskCreatePayload {
  description: string;
  sessionAuthor: string;
  sessionDate: string;   // ISO date string
}

/** Payload for PATCH /tasks/:id/reject. */
export interface TaskRejectPayload {
  rejectionReason: string;
}

/** Payload for PATCH /tasks/:id/reassign. */
export interface TaskReassignPayload {
  newAssigneeId: string;
}

/** Payload for PATCH /tasks/:id/suggest-rejection. */
export interface TaskSuggestRejectionPayload {
  reason: string;
}

/* ── Query filters ────────────────────────────────────────────────────── */

/** Query string parameters for GET /tasks. */
export interface TaskFilters {
  status?: TaskStatus;
  assignee?: string;
  createdBy?: string;
  sessionAuthor?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
