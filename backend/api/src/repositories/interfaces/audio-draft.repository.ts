/**
 * @file audio-draft.repository.ts
 * @description Contract (interface) for AudioDraft persistence operations.
 *
 * Database-agnostic — the Mongoose implementation lives in
 * `repositories/mongoose/audio-draft.repository.impl.ts`.
 */

import type { AudioDraftStatus } from '../../config/constants.js';
import type { IAudioDraft, IAudioDraftCreate, IAudioDraftUpdate } from '../../models/interfaces/index.js';

/** Filters accepted by the {@link IAudioDraftRepository.findByTask} method. */
export interface AudioDraftFilters {
  /** Filter by exact draft status. */
  status?: AudioDraftStatus;
}

export interface IAudioDraftRepository {
  /** Persist a new audio draft and return its read-model. */
  create(data: IAudioDraftCreate): Promise<IAudioDraft>;

  /** Persist multiple audio drafts in one operation (bulk insert). */
  createMany(data: IAudioDraftCreate[]): Promise<IAudioDraft[]>;

  /** Find a single audio draft by its unique ID, or `null` if not found. */
  findById(id: string): Promise<IAudioDraft | null>;

  /**
   * Return all drafts for a given task, optionally filtered by status.
   * Results are sorted by `order` ascending.
   *
   * @param taskId - The parent task ID.
   * @param filter - Optional status filter.
   */
  findByTask(taskId: string, filter?: AudioDraftFilters): Promise<IAudioDraft[]>;

  /** Update a draft by ID. Returns the updated read-model, or `null` if not found. */
  updateById(id: string, data: IAudioDraftUpdate): Promise<IAudioDraft | null>;

  /** Delete all drafts belonging to a given task. Returns the number of deleted records. */
  deleteByTask(taskId: string): Promise<number>;

  /**
   * Count drafts by status for a given task.
   * Returns a map of `{ [status]: count }` — used to recalculate {@link IContentState}.
   */
  countByStatus(taskId: string): Promise<Record<string, number>>;
}
