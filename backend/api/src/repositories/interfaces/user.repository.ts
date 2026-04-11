/**
 * @file user.repository.ts
 * @description Contract (interface) for User persistence operations.
 *
 * Database-agnostic — the Mongoose implementation lives in
 * `repositories/mongoose/user.repository.impl.ts`.
 */

import type { IUser, IUserCreate, IUserUpdate } from '../../models/interfaces/index.js';

export interface IUserRepository {
  /** Persist a new user and return its read-model. */
  create(data: IUserCreate): Promise<IUser>;

  /** Find a single user by its unique ID, or `null` if not found. */
  findById(id: string): Promise<IUser | null>;

  /** Find a single user by username, or `null` if not found. */
  findByUsername(username: string): Promise<IUser | null>;

  /**
   * Return a paginated list of users matching the given filter criteria.
   *
   * @param filter - Optional field-level filters and date comparison.
   * @param skip   - Number of records to skip (offset-based pagination).
   * @param limit  - Maximum number of records to return.
   */
  findMany(
    filter: {
      username?: string;
      tel?: string;
      email?: string;
      /** Optional date comparison: `gte: true` → date ≥ value, `gte: false` → date ≤ value. */
      dateFilter?: { date: Date; gte: boolean } | null;
    },
    skip: number,
    limit: number,
  ): Promise<IUser[]>;

  /** Update a user by ID. Returns `true` if at least one field was modified. */
  updateById(id: string, data: IUserUpdate): Promise<boolean>;

  /** Delete a user by ID. Returns `true` if the record existed and was removed. */
  deleteById(id: string): Promise<boolean>;
}
