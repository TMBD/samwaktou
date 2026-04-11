/**
 * @file activity-log.repository.ts
 * @description Contract (interface) for ActivityLog persistence operations.
 *
 * Activity logs are append-only: they can be created and queried but
 * never updated or deleted through normal application flow.
 *
 * Database-agnostic — the Mongoose implementation lives in
 * `repositories/mongoose/activity-log.repository.impl.ts`.
 */

import type { ActivityEntityType, IActivityLog, IActivityLogCreate } from '../../models/interfaces/index.js';

export interface IActivityLogRepository {
  /** Persist a new activity log entry and return its read-model. */
  create(data: IActivityLogCreate): Promise<IActivityLog>;

  /**
   * Return all log entries for a given entity, sorted newest-first.
   *
   * @param entityType - The kind of entity (task, audio_draft, theme).
   * @param entityId   - The ID of the entity.
   * @param skip       - Number of records to skip.
   * @param limit      - Maximum number of records to return.
   */
  findByEntity(
    entityType: ActivityEntityType,
    entityId: string,
    skip: number,
    limit: number,
  ): Promise<IActivityLog[]>;
}
