/**
 * @file author.repository.ts
 * @description Contract (interface) for Author persistence operations.
 *
 * Database-agnostic — the Mongoose implementation lives in
 * `repositories/mongoose/author.repository.impl.ts`.
 */

import type { IAuthor, IAuthorCreate, IAuthorUpdate } from '../../models/interfaces/index.js';

export interface IAuthorRepository {
  /** Persist a new author and return its read-model. */
  create(data: IAuthorCreate): Promise<IAuthor>;

  /** Find a single author by its unique ID, or `null` if not found. */
  findById(id: string): Promise<IAuthor | null>;

  /** Find an author by its exact (upper-cased) name, or `null` if not found. */
  findByName(name: string): Promise<IAuthor | null>;

  /**
   * Return a paginated list of authors, optionally filtered.
   *
   * @param filter - Optional name search.
   * @param skip   - Number of records to skip.
   * @param limit  - Maximum number of records to return.
   */
  findMany(
    filter: { name?: string },
    skip: number,
    limit: number,
  ): Promise<IAuthor[]>;

  /** Update an author by ID. Returns the updated read-model, or `null` if not found. */
  updateById(id: string, data: IAuthorUpdate): Promise<IAuthor | null>;

  /** Delete an author by ID. Returns `true` if the record existed and was removed. */
  deleteById(id: string): Promise<boolean>;

  /** Return the total count of authors matching the given filter. */
  count(filter: { name?: string }): Promise<number>;
}
