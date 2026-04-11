/**
 * @file task.repository.impl.ts
 * @description Mongoose implementation of {@link ITaskRepository}.
 *
 * Handles all CRUD and query operations for the "tasks" collection.
 * Key behaviours:
 * - Filters support status, assignee, createdBy, sessionAuthor (regex), date range.
 * - Results are sorted by sessionDate descending, then _id for deterministic pagination.
 * - `updateById` returns the updated document (uses `findOneAndUpdate` with `{ new: true }`).
 */

import type { ITask, ITaskCreate, ITaskUpdate } from '../../models/interfaces/index.js';
import type { ITaskRepository, TaskFilters } from '../interfaces/index.js';
import { TaskModel, type TaskDocument } from './schemas/task.schema.js';

/* ── Entity mapper ───────────────────────────────────────────────────── */

/**
 * Converts a Mongoose `TaskDocument` (or lean object) into a domain `ITask`.
 * This is the single mapping point between the DB layer and the domain.
 */
function toEntity(doc: TaskDocument): ITask {
  return {
    id: doc._id.toString(),
    description: doc.description,
    sessionAuthor: doc.sessionAuthor,
    sessionDate: doc.sessionDate,
    status: doc.status,
    assignee: doc.assignee?.toString() ?? null,
    previousAssignee: doc.previousAssignee?.toString() ?? null,
    createdBy: doc.createdBy.toString(),
    reviewedBy: doc.reviewedBy?.toString() ?? null,
    contentState: {
      total: doc.contentState.total,
      done: doc.contentState.done,
      approved: doc.contentState.approved,
      rejected: doc.contentState.rejected,
      correctionNeeded: doc.contentState.correctionNeeded,
      pending: doc.contentState.pending,
    },
    rejectionReason: doc.rejectionReason,
    taskRejectionSuggested: doc.taskRejectionSuggested,
    taskRejectionSuggestedReason: doc.taskRejectionSuggestedReason,
    publishedAudioIds: doc.publishedAudioIds.map((oid) => oid.toString()),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/* ── Filter builder ──────────────────────────────────────────────────── */

/**
 * Builds a Mongoose-compatible query object from the domain-level {@link TaskFilters}.
 */
function buildQuery(filter: TaskFilters): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (filter.status) query.status = filter.status;
  if (filter.assignee) query.assignee = filter.assignee;
  if (filter.createdBy) query.createdBy = filter.createdBy;

  // Case-insensitive substring match on sessionAuthor.
  if (filter.sessionAuthor) {
    query.sessionAuthor = { $regex: filter.sessionAuthor, $options: 'i' };
  }

  // Date-range filter on sessionDate.
  const dateFilter: Record<string, Date> = {};
  if (filter.minDate) dateFilter.$gte = filter.minDate;
  if (filter.maxDate) dateFilter.$lte = filter.maxDate;
  if (Object.keys(dateFilter).length > 0) query.sessionDate = dateFilter;

  return query;
}

/* ── Repository implementation ───────────────────────────────────────── */

export class MongoTaskRepository implements ITaskRepository {
  /** @inheritdoc */
  async create(data: ITaskCreate): Promise<ITask> {
    const doc = await TaskModel.create(data);
    return toEntity(doc);
  }

  /** @inheritdoc */
  async findById(id: string): Promise<ITask | null> {
    const doc = await TaskModel.findById(id).lean<TaskDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findMany(filter: TaskFilters, skip: number, limit: number): Promise<ITask[]> {
    const query = buildQuery(filter);
    const docs = await TaskModel.find(query)
      .sort({ sessionDate: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean<TaskDocument[]>();

    return docs.map(toEntity);
  }

  /** @inheritdoc */
  async count(filter: TaskFilters): Promise<number> {
    return TaskModel.countDocuments(buildQuery(filter));
  }

  /** @inheritdoc */
  async updateById(id: string, data: ITaskUpdate): Promise<ITask | null> {
    const doc = await TaskModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).lean<TaskDocument>();

    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async deleteById(id: string): Promise<boolean> {
    const result = await TaskModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
