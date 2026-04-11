/**
 * @file task.repository.ts
 * @description Contract (interface) for Task persistence operations.
 *
 * Database-agnostic — the Mongoose implementation lives in
 * `repositories/mongoose/task.repository.impl.ts`.
 */

import type { TaskStatus } from '../../config/constants.js';
import type { ITask, ITaskCreate, ITaskUpdate } from '../../models/interfaces/index.js';

/** Filters accepted by the {@link ITaskRepository.findMany} method. */
export interface TaskFilters {
  /** Filter by exact task status. */
  status?: TaskStatus;
  /** Filter by assigned admin ID. */
  assignee?: string;
  /** Filter by the admin who created the task. */
  createdBy?: string;
  /** Filter by session author name (case-insensitive substring). */
  sessionAuthor?: string;
  /** Inclusive lower bound for sessionDate. */
  minDate?: Date;
  /** Inclusive upper bound for sessionDate. */
  maxDate?: Date;
}

export interface ITaskRepository {
  /** Persist a new task and return its read-model. */
  create(data: ITaskCreate): Promise<ITask>;

  /** Find a single task by its unique ID, or `null` if not found. */
  findById(id: string): Promise<ITask | null>;

  /**
   * Return a paginated, filtered list of tasks.
   *
   * @param filter - Field-level filters (status, assignee, author, date range).
   * @param skip   - Number of records to skip (offset-based pagination).
   * @param limit  - Maximum number of records to return.
   */
  findMany(filter: TaskFilters, skip: number, limit: number): Promise<ITask[]>;

  /**
   * Count the total number of tasks matching the given filters.
   * Used for pagination metadata alongside {@link findMany}.
   */
  count(filter: TaskFilters): Promise<number>;

  /** Update a task by ID. Returns the updated read-model, or `null` if not found. */
  updateById(id: string, data: ITaskUpdate): Promise<ITask | null>;

  /** Delete a task by ID. Returns `true` if the record existed and was removed. */
  deleteById(id: string): Promise<boolean>;
}
