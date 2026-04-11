/**
 * @file theme.repository.ts
 * @description Contract (interface) for Theme persistence operations.
 *
 * Database-agnostic — the Mongoose implementation lives in
 * `repositories/mongoose/theme.repository.impl.ts`.
 */

import type { ITheme, IThemeCreate, IThemeUpdate } from '../../models/interfaces/index.js';

export interface IThemeRepository {
  /** Persist a new theme and return its read-model. */
  create(data: IThemeCreate): Promise<ITheme>;

  /** Find a single theme by its unique ID, or `null` if not found. */
  findById(id: string): Promise<ITheme | null>;

  /** Find a theme by its exact (upper-cased) name, or `null` if not found. */
  findByName(name: string): Promise<ITheme | null>;

  /**
   * Return a paginated list of themes, optionally filtered.
   *
   * @param filter - Optional filters (validated status, name search).
   * @param skip   - Number of records to skip.
   * @param limit  - Maximum number of records to return.
   */
  findMany(
    filter: {
      /** Filter by validation status. */
      isValidated?: boolean;
      /** Case-insensitive substring search on theme name. */
      name?: string;
    },
    skip: number,
    limit: number,
  ): Promise<ITheme[]>;

  /** Update a theme by ID. Returns the updated read-model, or `null` if not found. */
  updateById(id: string, data: IThemeUpdate): Promise<ITheme | null>;

  /** Delete a theme by ID. Returns `true` if the record existed and was removed. */
  deleteById(id: string): Promise<boolean>;

  /** Return the total count of themes matching the given filter. */
  count(filter: { isValidated?: boolean; name?: string }): Promise<number>;
}
