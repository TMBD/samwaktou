/**
 * @file audio.repository.ts
 * @description Contract (interface) for Audio persistence operations.
 *
 * Database-agnostic — the Mongoose implementation lives in
 * `repositories/mongoose/audio.repository.impl.ts`.
 */

import type { IAudio, IAudioCreate, IAudioUpdate } from '../../models/interfaces/index.js';

export interface IAudioRepository {
  /** Persist a new audio record and return its read-model. */
  create(data: IAudioCreate): Promise<IAudio>;

  /** Find a single audio by its unique ID, or `null` if not found. */
  findById(id: string): Promise<IAudio | null>;

  /** Find a single audio by its S3 URI key, or `null` if not found. */
  findByUri(uri: string): Promise<IAudio | null>;

  /**
   * Return a paginated, filtered list of audio records.
   *
   * @param filter   - Field-level filters (theme, author, keywords full-text, date range).
   * @param skip     - Number of records to skip (offset-based pagination).
   * @param limit    - Maximum number of records to return.
   */
  findMany(
    filter: {
      theme?: string;
      author?: string;
      /** Full-text search keywords (uses MongoDB `$text` operator). */
      keywords?: string;
      /** Inclusive lower bound for the `date` field. */
      minDate?: Date;
      /** Inclusive upper bound for the `date` field. */
      maxDate?: Date;
    },
    skip: number,
    limit: number,
  ): Promise<IAudio[]>;

  /** Update an audio by ID. Returns `true` if at least one field was modified. */
  updateById(id: string, data: IAudioUpdate): Promise<boolean>;

  /** Delete an audio by ID. Returns `true` if the record existed and was removed. */
  deleteById(id: string): Promise<boolean>;

  /**
   * Return all unique values for the given field, trimmed, sorted alphabetically.
   * Used to populate theme/author filter dropdowns on the frontend.
   */
  getDistinctValues(field: 'theme' | 'author'): Promise<string[]>;
}
