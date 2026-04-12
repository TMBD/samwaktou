/**
 * @file audio-draft.repository.impl.ts
 * @description Mongoose implementation of {@link IAudioDraftRepository}.
 *
 * Handles all CRUD and query operations for the "audiodrafts" collection.
 * Key behaviours:
 * - Drafts are always returned sorted by `order` ascending within a task.
 * - `countByStatus` uses a MongoDB aggregation pipeline to group drafts by status.
 * - `createMany` uses `insertMany` for efficient bulk creation.
 */

import type { IAudioDraft, IAudioDraftCreate, IAudioDraftUpdate } from '../../models/interfaces/index.js';
import type { IAudioDraftRepository, AudioDraftFilters } from '../interfaces/index.js';
import { AudioDraftModel, type AudioDraftDocument } from './schemas/audio-draft.schema.js';

/* ── Entity mapper ───────────────────────────────────────────────────── */

/**
 * Converts a Mongoose `AudioDraftDocument` (or lean object) into a domain `IAudioDraft`.
 * This is the single mapping point between the DB layer and the domain.
 */
function toEntity(doc: AudioDraftDocument): IAudioDraft {
  return {
    id: doc._id.toString(),
    task: doc.task.toString(),
    uri: doc.uri,
    originalFileName: doc.originalFileName,
    description: doc.description,
    theme: doc.theme,
    keywords: doc.keywords ? doc.keywords.split(/[,\s]+/).filter(Boolean) : [],
    status: doc.status,
    isNewTheme: doc.isNewTheme,
    rejectionSuggestedReason: doc.rejectionSuggestedReason,
    reviewComment: doc.reviewComment,
    correctionComment: doc.correctionComment,
    order: doc.order,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/* ── Repository implementation ───────────────────────────────────────── */

export class MongoAudioDraftRepository implements IAudioDraftRepository {
  /** @inheritdoc */
  async create(data: IAudioDraftCreate): Promise<IAudioDraft> {
    const doc = await AudioDraftModel.create({ ...data, keywords: Array.isArray(data.keywords) ? data.keywords.join(' ') : data.keywords });
    return toEntity(doc);
  }

  /** @inheritdoc */
  async createMany(data: IAudioDraftCreate[]): Promise<IAudioDraft[]> {
    const mapped = data.map(d => ({ ...d, keywords: Array.isArray(d.keywords) ? d.keywords.join(' ') : d.keywords }));
    const docs = await AudioDraftModel.insertMany(mapped);
    return docs.map((d) => toEntity(d as unknown as AudioDraftDocument));
  }

  /** @inheritdoc */
  async findById(id: string): Promise<IAudioDraft | null> {
    const doc = await AudioDraftModel.findById(id).lean<AudioDraftDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findByTask(taskId: string, filter?: AudioDraftFilters): Promise<IAudioDraft[]> {
    const query: Record<string, unknown> = { task: taskId };
    if (filter?.status) query.status = filter.status;

    const docs = await AudioDraftModel.find(query)
      .sort({ order: 1 })
      .lean<AudioDraftDocument[]>();

    return docs.map(toEntity);
  }

  /** @inheritdoc */
  async updateById(id: string, data: IAudioDraftUpdate): Promise<IAudioDraft | null> {
    const doc = await AudioDraftModel.findByIdAndUpdate(
      id,
      { $set: { ...data, ...(data.keywords !== undefined && { keywords: Array.isArray(data.keywords) ? data.keywords.join(' ') : data.keywords }) } },
      { new: true, runValidators: true },
    ).lean<AudioDraftDocument>();

    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async deleteByTask(taskId: string): Promise<number> {
    const result = await AudioDraftModel.deleteMany({ task: taskId });
    return result.deletedCount;
  }

  /**
   * @inheritdoc
   *
   * Uses a MongoDB aggregation pipeline:
   * ```js
   * db.audiodrafts.aggregate([
   *   { $match: { task: taskId } },
   *   { $group: { _id: '$status', count: { $sum: 1 } } },
   * ])
   * ```
   * Returns e.g. `{ PENDING: 3, DONE: 2, APPROVED: 1 }`.
   */
  async countByStatus(taskId: string): Promise<Record<string, number>> {
    const pipeline = [
      { $match: { task: taskId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ];

    const results = await AudioDraftModel.aggregate<{ _id: string; count: number }>(pipeline);

    const counts: Record<string, number> = {};
    for (const row of results) {
      counts[row._id] = row.count;
    }
    return counts;
  }
}
