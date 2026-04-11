/**
 * @file audio.repository.impl.ts
 * @description Mongoose implementation of {@link IAudioRepository}.
 *
 * Handles all CRUD and query operations for the "audios" collection.
 * Key behaviours:
 * - Full-text search on `keywords` using MongoDB's `$text` operator.
 * - Date-range filtering via `$gte` / `$lte` on the `date` field.
 * - Results sorted by relevance score (when keywords provided), then
 *   by date descending, then by `_id` for deterministic ordering.
 */

import type { IAudio, IAudioCreate, IAudioUpdate } from '../../models/interfaces/index.js';
import type { IAudioRepository } from '../interfaces/index.js';
import { AudioModel, type AudioDocument } from './schemas/audio.schema.js';

/**
 * Converts a Mongoose `AudioDocument` (or lean object) into a domain `IAudio`.
 * This is the single mapping point between the DB layer and the domain.
 */
function toEntity(doc: AudioDocument): IAudio {
  return {
    id: doc._id.toString(),
    uri: doc.uri,
    theme: doc.theme,
    author: doc.author,
    description: doc.description,
    keywords: doc.keywords,
    date: doc.date,
    taskId: doc.taskId?.toString() ?? null,
  };
}

export class MongoAudioRepository implements IAudioRepository {
  /** @inheritdoc */
  async create(data: IAudioCreate): Promise<IAudio> {
    const doc = await AudioModel.create(data);
    return toEntity(doc);
  }

  /** @inheritdoc */
  async findById(id: string): Promise<IAudio | null> {
    const doc = await AudioModel.findById(id).lean<AudioDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findByUri(uri: string): Promise<IAudio | null> {
    const doc = await AudioModel.findOne({ uri }).lean<AudioDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findMany(
    filter: {
      theme?: string;
      author?: string;
      keywords?: string;
      minDate?: Date;
      maxDate?: Date;
    },
    skip: number,
    limit: number,
  ): Promise<IAudio[]> {
    // Build dynamic query and sort objects from the optional filters.
    const query: Record<string, unknown> = {};
    const sort: Record<string, 1 | -1 | { $meta: string }> = {};

    if (filter.theme) query.theme = filter.theme;
    if (filter.author) query.author = filter.author;

    // Full-text search: requires a MongoDB text index on the `keywords` field.
    // When active, results are also sorted by text relevance score.
    if (filter.keywords) {
      query.$text = {
        $search: filter.keywords,
        $caseSensitive: false,
        $language: 'fr',
      };
      sort.score = { $meta: 'textScore' };
    }

    // Date-range filter: build a `$gte` / `$lte` sub-document for the `date` field.
    const dateFilter: Record<string, Date> = {};
    if (filter.minDate) dateFilter.$gte = filter.minDate;
    if (filter.maxDate) dateFilter.$lte = filter.maxDate;
    if (Object.keys(dateFilter).length > 0) query.date = dateFilter;

    // Secondary sort: newest first, then by _id for deterministic pagination.
    sort.date = -1;
    sort._id = 1;

    const docs = await AudioModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean<AudioDocument[]>();

    return docs.map(toEntity);
  }

  /** @inheritdoc */
  async updateById(id: string, data: IAudioUpdate): Promise<boolean> {
    const result = await AudioModel.updateOne({ _id: id }, { $set: data });
    return result.modifiedCount > 0;
  }

  /** @inheritdoc */
  async deleteById(id: string): Promise<boolean> {
    const result = await AudioModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /** @inheritdoc */
  async getDistinctValues(field: 'theme' | 'author'): Promise<string[]> {
    const values = await AudioModel.distinct(field);

    // Trim, remove blanks, deduplicate, and sort alphabetically.
    return [...new Set(
      (values as string[])
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    )].sort();
  }
}
