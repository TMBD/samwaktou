/**
 * @file audio-draft.interface.ts
 * @description Database-agnostic interface for the AudioDraft entity.
 *
 * An AudioDraft is a single audio file within a {@link ITask}. It goes through
 * its own review cycle ({@link AudioDraftStatus}) independently of sibling
 * drafts, and the parent task's `contentState` is recalculated after every
 * draft status change.
 *
 * Draft files are stored on S3 under `drafts/<taskId>/<draftId>.<ext>`.
 */

import type { AudioDraftStatus } from '../../config/constants.js';

/** Read-model representation of an AudioDraft (as returned by the repository). */
export interface IAudioDraft {
  /** Unique identifier (mapped from the DB primary key). */
  id: string;
  /** ID of the parent task this draft belongs to. */
  task: string;
  /** S3 object key for the draft audio file (e.g. "drafts/<taskId>/<draftId>.mp3"). */
  uri: string;
  /** Original file name as uploaded by the publisher. */
  originalFileName: string;
  /** Free-text description of the audio content. */
  description: string;
  /** Theme name (upper-cased). References the Theme collection conceptually. */
  theme: string;
  /** Search keywords (array of individual keyword strings). */
  keywords: string[];
  /** Current position in the audio-draft review cycle. */
  status: AudioDraftStatus;
  /** Whether this draft introduces a theme that doesn't exist yet. */
  isNewTheme: boolean;
  /** Reason provided by a contributor when suggesting rejection, or `null`. */
  rejectionSuggestedReason: string | null;
  /** Comment left by the reviewer during review, or `null`. */
  reviewComment: string | null;
  /** Comment left by the reviewer when requesting corrections, or `null`. */
  correctionComment: string | null;
  /** Display order within the task (1-based). */
  order: number;
  /** Record creation timestamp (Mongoose `timestamps`). */
  createdAt: Date;
  /** Record last-update timestamp (Mongoose `timestamps`). */
  updatedAt: Date;
}

/**
 * Fields required when creating a new audio draft.
 * `id`, `createdAt`, `updatedAt` are auto-generated.
 */
export type IAudioDraftCreate = Omit<IAudioDraft, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Fields that may be updated on an existing audio draft (all optional).
 * `id`, `createdAt`, `updatedAt` are immutable / auto-managed.
 */
export type IAudioDraftUpdate = Partial<Omit<IAudioDraft, 'id' | 'createdAt' | 'updatedAt'>>;
