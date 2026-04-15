/**
 * @file task.api.ts
 * @description API functions for the Task entity.
 *
 * Each function maps to a single backend endpoint under `/tasks`.
 * File uploads (task creation) use FormData; all other mutations use JSON.
 */

import { get, getList, post, postForm, patch, del, buildQuery } from './client';
import type {
  Task,
  TaskCreatePayload,
  TaskRejectPayload,
  TaskReassignPayload,
  TaskSuggestRejectionPayload,
  TaskFilters,
  ActivityLog,
} from '@/types';

/* ── Queries ──────────────────────────────────────────────────────────── */

/** GET /tasks — List tasks with optional filters. */
export async function getTasks(filters?: TaskFilters) {
  const qs = filters ? buildQuery(filters as Record<string, unknown>) : '';
  return getList<Task>(`/tasks${qs}`);
}

/** GET /tasks/:id — Get a single task. */
export async function getTask(id: string) {
  return get<Task>(`/tasks/${id}`);
}

/** GET /tasks/:id/activity-log — Get the activity log for a task. */
export async function getTaskActivityLog(taskId: string) {
  return getList<ActivityLog>(`/tasks/${taskId}/activity-log`);
}

/* ── Creation ─────────────────────────────────────────────────────────── */

/**
 * POST /tasks — Create a new task with audio file uploads.
 *
 * Builds a `FormData` containing the JSON fields + attached audio files.
 *
 * @param payload  - Task metadata (description, sessionAuthor, sessionDate).
 * @param files    - Audio files to upload as drafts.
 */
export async function createTask(payload: TaskCreatePayload, files: File[]) {
  const fd = new FormData();
  fd.append('description', payload.description);
  fd.append('sessionAuthor', payload.sessionAuthor);
  fd.append('sessionDate', payload.sessionDate);
  files.forEach((file) => fd.append('audioFiles', file));
  return postForm<Task>('/tasks', fd);
}

/* ── State transitions ────────────────────────────────────────────────── */

/** PATCH /tasks/:id/assign — Assign a task. Self-assign when no assigneeId given. */
export async function assignTask(id: string, assigneeId?: string) {
  return patch<Task>(`/tasks/${id}/assign`, assigneeId ? { assigneeId } : undefined);
}

/** PATCH /tasks/:id/unassign — Unassign a task → OPEN. */
export async function unassignTask(id: string) {
  return patch<Task>(`/tasks/${id}/unassign`);
}

/** PATCH /tasks/:id/reassign — Reassign a task to another admin. */
export async function reassignTask(id: string, payload: TaskReassignPayload) {
  return patch<Task>(`/tasks/${id}/reassign`, payload);
}

/** PATCH /tasks/:id/submit — Submit for review → READY_FOR_REVIEW. */
export async function submitTask(id: string) {
  return patch<Task>(`/tasks/${id}/submit`);
}

/** PATCH /tasks/:id/pick-for-review — Pick for review → IN_REVIEW. */
export async function pickTaskForReview(id: string) {
  return patch<Task>(`/tasks/${id}/pick-for-review`);
}

/** PATCH /tasks/:id/approve — Approve → APPROVED. */
export async function approveTask(id: string) {
  return patch<Task>(`/tasks/${id}/approve`);
}

/** PATCH /tasks/:id/request-corrections — Request corrections. */
export async function requestCorrections(id: string) {
  return patch<Task>(`/tasks/${id}/request-corrections`);
}

/** PATCH /tasks/:id/reject — Reject a task. */
export async function rejectTask(id: string, payload: TaskRejectPayload) {
  return patch<Task>(`/tasks/${id}/reject`, payload);
}

/** PATCH /tasks/:id/suggest-rejection — Suggest rejection (contributor). */
export async function suggestRejection(id: string, payload: TaskSuggestRejectionPayload) {
  return patch<Task>(`/tasks/${id}/suggest-rejection`, payload);
}

/* ── Publish / Unpublish ──────────────────────────────────────────────── */

/** POST /tasks/:id/publish — Publish approved task → PUBLISHED. */
export async function publishTask(id: string) {
  return post<Task>(`/tasks/${id}/publish`);
}

/** POST /tasks/:id/unpublish — Unpublish → APPROVED (SysAdmin only). */
export async function unpublishTask(id: string) {
  return post<Task>(`/tasks/${id}/unpublish`);
}

/* ── Deletion ─────────────────────────────────────────────────────────── */

/** DELETE /tasks/:id — Hard-delete a task. */
export async function deleteTask(id: string) {
  return del(`/tasks/${id}`);
}
