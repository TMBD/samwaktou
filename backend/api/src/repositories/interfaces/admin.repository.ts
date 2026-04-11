/**
 * @file admin.repository.ts
 * @description Contract (interface) for Admin persistence operations.
 *
 * This interface is **database-agnostic**: it describes *what* the repository
 * can do, not *how* it does it. The concrete implementation (e.g. Mongoose)
 * lives in `repositories/mongoose/admin.repository.impl.ts`.
 *
 * Using an interface allows us to swap databases or mock the repository
 * in unit tests without changing any service code.
 */

import type { IAdmin, IAdminCreate, IAdminUpdate } from '../../models/interfaces/index.js';

export interface IAdminRepository {
  /** Persist a new admin and return its read-model representation. */
  create(data: IAdminCreate): Promise<IAdmin>;

  /** Find a single admin by its unique ID, or `null` if not found. */
  findById(id: string): Promise<IAdmin | null>;

  /** Find a single admin by email address, or `null` if not found. */
  findByEmail(email: string): Promise<IAdmin | null>;

  /**
   * Return a paginated list of admins matching the given filter criteria.
   *
   * @param filter - Optional field-level filters and date comparison.
   * @param skip   - Number of records to skip (offset-based pagination).
   * @param limit  - Maximum number of records to return.
   */
  findMany(
    filter: {
      surname?: string;
      name?: string;
      email?: string;
      isSuperAdmin?: boolean;
      /** Optional date comparison: `gte: true` → date ≥ value, `gte: false` → date ≤ value. */
      dateFilter?: { date: Date; gte: boolean } | null;
    },
    skip: number,
    limit: number,
  ): Promise<IAdmin[]>;

  /** Update an admin by ID. Returns `true` if at least one field was modified. */
  updateById(id: string, data: IAdminUpdate): Promise<boolean>;

  /** Delete an admin by ID. Returns `true` if the record existed and was removed. */
  deleteById(id: string): Promise<boolean>;
}
