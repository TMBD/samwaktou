/**
 * @file task.interface.ts
 * @description Database-agnostic interface for the Task entity.
 *
 * A Task represents a batch of audio files uploaded by a Publisher that must
 * go through a contributor → reviewer workflow before being published.
 * The task progresses through the {@link TaskStatus} state machine.
 *
 * @see TaskStatus  for the finite state machine definition.
 * @see IContentState  for the embedded draft-status summary.
 */

import type { TaskStatus } from '../../config/constants.js';

/* ── Embedded value object ───────────────────────────────────────────── */

/**
 * Aggregated count of audio-draft statuses within a task.
 *
 * Recalculated every time an audio-draft status changes so that the task
 * detail view can display progress without querying all drafts.
 */
export interface IContentState {
  /** Total number of audio drafts in the task. */
  total: number;
  /** Drafts marked as DONE by the contributor. */
  done: number;
  /** Drafts approved by a reviewer. */
  approved: number;
  /** Drafts rejected by a reviewer. */
  rejected: number;
  /** Drafts sent back for corrections. */
  correctionNeeded: number;
  /** Drafts still in their initial PENDING state. */
  pending: number;
}

/* ── Task read-model ─────────────────────────────────────────────────── */

/** Read-model representation of a Task (as returned by the repository). */
export interface ITask {
  /** Unique identifier (mapped from the DB primary key). */
  id: string;
  /** Free-text description of the session / task purpose. */
  description: string;
  /** Name of the original session author (speaker). */
  sessionAuthor: string;
  /** Date the session was recorded (stored as ISO date string or Date). */
  sessionDate: Date;
  /** Current position in the task state machine. */
  status: TaskStatus;
  /** Admin ID of the currently assigned contributor, or `null` if unassigned. */
  assignee: string | null;
  /** Admin ID of the previous assignee — used for reassignment after corrections. */
  previousAssignee: string | null;
  /** Admin ID of the admin who created the task. */
  createdBy: string;
  /** Admin ID of the reviewer who last reviewed the task, or `null`. */
  reviewedBy: string | null;
  /** Aggregated counts of audio-draft statuses. */
  contentState: IContentState;
  /** Reason provided when the task is rejected, or `null`. */
  rejectionReason: string | null;
  /** Whether a contributor has suggested that the task should be rejected. */
  taskRejectionSuggested: boolean;
  /** Contributor's reason for suggesting rejection, or `null`. */
  taskRejectionSuggestedReason: string | null;
  /** IDs of published Audio documents (populated after publish). */
  publishedAudioIds: string[];
  /** Record creation timestamp (Mongoose `timestamps`). */
  createdAt: Date;
  /** Record last-update timestamp (Mongoose `timestamps`). */
  updatedAt: Date;
}

/* ── Create / Update types ───────────────────────────────────────────── */

/**
 * Fields required when creating a new task.
 * `id`, `createdAt`, `updatedAt` are auto-generated.
 */
export type ITaskCreate = Omit<ITask, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Fields that may be updated on an existing task (all optional).
 * `id`, `createdAt`, `updatedAt` are immutable / auto-managed.
 */
export type ITaskUpdate = Partial<Omit<ITask, 'id' | 'createdAt' | 'updatedAt'>>;
