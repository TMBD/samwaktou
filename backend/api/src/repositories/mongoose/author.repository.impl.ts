/**
 * @file author.repository.impl.ts
 * @description Mongoose implementation of {@link IAuthorRepository}.
 *
 * Handles all CRUD and query operations for the "authors" collection.
 */

import type { IAuthor, IAuthorCreate, IAuthorUpdate } from '../../models/interfaces/index.js';
import type { IAuthorRepository } from '../interfaces/index.js';
import { AuthorModel, type AuthorDocument } from './schemas/author.schema.js';

/* ── Entity mapper ───────────────────────────────────────────────────── */

function toEntity(doc: AuthorDocument): IAuthor {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? null,
    createdBy: doc.createdBy.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/* ── Filter builder ──────────────────────────────────────────────────── */

function buildQuery(filter: { name?: string }): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (filter.name) {
    query.name = { $regex: filter.name, $options: 'i' };
  }
  return query;
}

/* ── Repository implementation ───────────────────────────────────────── */

export class MongoAuthorRepository implements IAuthorRepository {
  async create(data: IAuthorCreate): Promise<IAuthor> {
    const doc = await AuthorModel.create(data);
    return toEntity(doc);
  }

  async findById(id: string): Promise<IAuthor | null> {
    const doc = await AuthorModel.findById(id).lean<AuthorDocument>();
    return doc ? toEntity(doc) : null;
  }

  async findByName(name: string): Promise<IAuthor | null> {
    const doc = await AuthorModel.findOne({ name: name.toUpperCase() }).lean<AuthorDocument>();
    return doc ? toEntity(doc) : null;
  }

  async findMany(
    filter: { name?: string },
    skip: number,
    limit: number,
  ): Promise<IAuthor[]> {
    const query = buildQuery(filter);
    const docs = await AuthorModel.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean<AuthorDocument[]>();
    return docs.map(toEntity);
  }

  async updateById(id: string, data: IAuthorUpdate): Promise<IAuthor | null> {
    const doc = await AuthorModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).lean<AuthorDocument>();
    return doc ? toEntity(doc) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await AuthorModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async count(filter: { name?: string }): Promise<number> {
    return AuthorModel.countDocuments(buildQuery(filter));
  }
}
