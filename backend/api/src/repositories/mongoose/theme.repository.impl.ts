/**
 * @file theme.repository.impl.ts
 * @description Mongoose implementation of {@link IThemeRepository}.
 *
 * Handles all CRUD and query operations for the "themes" collection.
 * Key behaviours:
 * - Theme names are stored upper-cased (enforced by the Mongoose schema).
 * - `findByName` expects an already-uppercased name for exact match.
 * - `findMany` supports case-insensitive substring search on name and
 *   optional filter by validation status.
 */

import type { ITheme, IThemeCreate, IThemeUpdate } from '../../models/interfaces/index.js';
import type { IThemeRepository } from '../interfaces/index.js';
import { ThemeModel, type ThemeDocument } from './schemas/theme.schema.js';

/* ── Entity mapper ───────────────────────────────────────────────────── */

/**
 * Converts a Mongoose `ThemeDocument` (or lean object) into a domain `ITheme`.
 * This is the single mapping point between the DB layer and the domain.
 */
function toEntity(doc: ThemeDocument): ITheme {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? null,
    isValidated: doc.isValidated,
    createdBy: doc.createdBy.toString(),
    validatedBy: doc.validatedBy?.toString() ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/* ── Filter builder ──────────────────────────────────────────────────── */

/** Builds a Mongoose query from the domain-level theme filters. */
function buildQuery(filter: { isValidated?: boolean; name?: string }): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (filter.isValidated !== undefined) query.isValidated = filter.isValidated;

  // Case-insensitive substring match on theme name.
  if (filter.name) {
    query.name = { $regex: filter.name, $options: 'i' };
  }

  return query;
}

/* ── Repository implementation ───────────────────────────────────────── */

export class MongoThemeRepository implements IThemeRepository {
  /** @inheritdoc */
  async create(data: IThemeCreate): Promise<ITheme> {
    const doc = await ThemeModel.create(data);
    return toEntity(doc);
  }

  /** @inheritdoc */
  async findById(id: string): Promise<ITheme | null> {
    const doc = await ThemeModel.findById(id).lean<ThemeDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findByName(name: string): Promise<ITheme | null> {
    const doc = await ThemeModel.findOne({ name: name.toUpperCase() }).lean<ThemeDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findMany(
    filter: { isValidated?: boolean; name?: string },
    skip: number,
    limit: number,
  ): Promise<ITheme[]> {
    const query = buildQuery(filter);
    const docs = await ThemeModel.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean<ThemeDocument[]>();

    return docs.map(toEntity);
  }

  /** @inheritdoc */
  async updateById(id: string, data: IThemeUpdate): Promise<ITheme | null> {
    const doc = await ThemeModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).lean<ThemeDocument>();

    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async deleteById(id: string): Promise<boolean> {
    const result = await ThemeModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /** @inheritdoc */
  async count(filter: { isValidated?: boolean; name?: string }): Promise<number> {
    return ThemeModel.countDocuments(buildQuery(filter));
  }
}
