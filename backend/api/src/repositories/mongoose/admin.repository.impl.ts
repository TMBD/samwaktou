/**
 * @file admin.repository.impl.ts
 * @description Mongoose implementation of {@link IAdminRepository}.
 *
 * This class translates every repository method into Mongoose queries
 * against the `AdminModel`. Results are converted from Mongoose documents
 * to plain domain objects via the private `toEntity()` helper, ensuring
 * that no Mongoose-specific data leaks outside the repository layer.
 */

import type { IAdmin, IAdminCreate, IAdminUpdate } from '../../models/interfaces/index.js';
import type { IAdminRepository } from '../interfaces/index.js';
import { AdminModel, type AdminDocument } from './schemas/admin.schema.js';

/**
 * Converts a Mongoose `AdminDocument` (or lean object) into a domain `IAdmin`.
 *
 * This mapping is the **only** place where Mongoose's `_id` is translated
 * to the generic `id` string used by the rest of the application.
 */
function toEntity(doc: AdminDocument): IAdmin {
  return {
    id: doc._id.toString(),
    surname: doc.surname,
    name: doc.name,
    email: doc.email,
    password: doc.password,
    date: doc.date,
    isSuperAdmin: doc.isSuperAdmin,
  };
}

export class MongoAdminRepository implements IAdminRepository {
  /** @inheritdoc */
  async create(data: IAdminCreate): Promise<IAdmin> {
    const doc = await AdminModel.create(data);
    return toEntity(doc);
  }

  /** @inheritdoc */
  async findById(id: string): Promise<IAdmin | null> {
    const doc = await AdminModel.findById(id).lean<AdminDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findByEmail(email: string): Promise<IAdmin | null> {
    const doc = await AdminModel.findOne({ email }).lean<AdminDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findMany(
    filter: {
      surname?: string;
      name?: string;
      email?: string;
      isSuperAdmin?: boolean;
      dateFilter?: { date: Date; gte: boolean } | null;
    },
    skip: number,
    limit: number,
  ): Promise<IAdmin[]> {
    // Build a dynamic MongoDB query object from the optional filters.
    const query: Record<string, unknown> = {};

    if (filter.surname) query.surname = filter.surname;
    if (filter.name) query.name = filter.name;
    if (filter.email) query.email = filter.email;
    if (filter.isSuperAdmin !== undefined) query.isSuperAdmin = filter.isSuperAdmin;

    // Date comparison: either "greater or equal" or "less or equal".
    if (filter.dateFilter) {
      query.date = filter.dateFilter.gte
        ? { $gte: filter.dateFilter.date }
        : { $lte: filter.dateFilter.date };
    }

    // Explicitly select fields to avoid returning the hashed password in list queries.
    const docs = await AdminModel.find(query)
      .select('_id surname name email date isSuperAdmin')
      .skip(skip)
      .limit(limit)
      .lean<AdminDocument[]>();

    return docs.map(toEntity);
  }

  /** @inheritdoc */
  async updateById(id: string, data: IAdminUpdate): Promise<boolean> {
    const result = await AdminModel.updateOne({ _id: id }, { $set: data });
    return result.modifiedCount > 0;
  }

  /** @inheritdoc */
  async deleteById(id: string): Promise<boolean> {
    const result = await AdminModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
