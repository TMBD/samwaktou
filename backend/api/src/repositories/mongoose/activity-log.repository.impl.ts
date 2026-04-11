/**
 * @file activity-log.repository.impl.ts
 * @description Mongoose implementation of {@link IActivityLogRepository}.
 *
 * Handles creation and querying of the immutable "activitylogs" collection.
 * Key behaviours:
 * - Append-only: no update or delete methods exposed.
 * - `findByEntity` returns logs newest-first (sorted by `createdAt` desc).
 */

import type { ActivityEntityType, IActivityLog, IActivityLogCreate } from '../../models/interfaces/index.js';
import type { IActivityLogRepository } from '../interfaces/index.js';
import { ActivityLogModel, type ActivityLogDocument } from './schemas/activity-log.schema.js';

/* ── Entity mapper ───────────────────────────────────────────────────── */

/**
 * Converts a Mongoose `ActivityLogDocument` (or lean object) into a domain `IActivityLog`.
 * This is the single mapping point between the DB layer and the domain.
 */
function toEntity(doc: ActivityLogDocument): IActivityLog {
  return {
    id: doc._id.toString(),
    entityType: doc.entityType,
    entityId: doc.entityId.toString(),
    action: doc.action,
    performedBy: doc.performedBy.toString(),
    details: doc.details,
    createdAt: doc.createdAt,
  };
}

/* ── Repository implementation ───────────────────────────────────────── */

export class MongoActivityLogRepository implements IActivityLogRepository {
  /** @inheritdoc */
  async create(data: IActivityLogCreate): Promise<IActivityLog> {
    const doc = await ActivityLogModel.create(data);
    return toEntity(doc);
  }

  /** @inheritdoc */
  async findByEntity(
    entityType: ActivityEntityType,
    entityId: string,
    skip: number,
    limit: number,
  ): Promise<IActivityLog[]> {
    const docs = await ActivityLogModel.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<ActivityLogDocument[]>();

    return docs.map(toEntity);
  }
}
