/**
 * @file user.repository.impl.ts
 * @description Mongoose implementation of {@link IUserRepository}.
 *
 * Handles all CRUD and query operations for the "users" collection.
 * The `toEntity()` helper ensures no Mongoose-specific data leaks
 * outside the repository layer.
 */

import type { IUser, IUserCreate, IUserUpdate } from '../../models/interfaces/index.js';
import type { IUserRepository } from '../interfaces/index.js';
import { UserModel, type UserDocument } from './schemas/user.schema.js';

/**
 * Converts a Mongoose `UserDocument` (or lean object) into a domain `IUser`.
 * This is the single mapping point between the DB layer and the domain.
 */
function toEntity(doc: UserDocument): IUser {
  return {
    id: doc._id.toString(),
    username: doc.username,
    tel: doc.tel,
    email: doc.email,
    date: doc.date,
  };
}

export class MongoUserRepository implements IUserRepository {
  /** @inheritdoc */
  async create(data: IUserCreate): Promise<IUser> {
    const doc = await UserModel.create(data);
    return toEntity(doc);
  }

  /** @inheritdoc */
  async findById(id: string): Promise<IUser | null> {
    const doc = await UserModel.findById(id).lean<UserDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findByUsername(username: string): Promise<IUser | null> {
    const doc = await UserModel.findOne({ username }).lean<UserDocument>();
    return doc ? toEntity(doc) : null;
  }

  /** @inheritdoc */
  async findMany(
    filter: {
      username?: string;
      tel?: string;
      email?: string;
      dateFilter?: { date: Date; gte: boolean } | null;
    },
    skip: number,
    limit: number,
  ): Promise<IUser[]> {
    // Build a dynamic MongoDB query object from the optional filters.
    const query: Record<string, unknown> = {};

    if (filter.username) query.username = filter.username;
    if (filter.tel) query.tel = filter.tel;
    if (filter.email) query.email = filter.email;

    // Date comparison: either "greater or equal" or "less or equal".
    if (filter.dateFilter) {
      query.date = filter.dateFilter.gte
        ? { $gte: filter.dateFilter.date }
        : { $lte: filter.dateFilter.date };
    }

    const docs = await UserModel.find(query)
      .skip(skip)
      .limit(limit)
      .lean<UserDocument[]>();

    return docs.map(toEntity);
  }

  /** @inheritdoc */
  async updateById(id: string, data: IUserUpdate): Promise<boolean> {
    const result = await UserModel.updateOne({ _id: id }, { $set: data });
    return result.modifiedCount > 0;
  }

  /** @inheritdoc */
  async deleteById(id: string): Promise<boolean> {
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
