/**
 * @file analytic.repository.impl.ts
 * @description Mongoose implementation of {@link IAnalyticRepository}.
 *
 * Write-only repository — analytics events are inserted but never
 * read back through the API (they are consumed by reporting tools).
 */

import type { IAnalytic, IAnalyticCreate } from '../../models/interfaces/index.js';
import type { IAnalyticRepository } from '../interfaces/index.js';
import { AnalyticModel, type AnalyticDocument } from './schemas/analytic.schema.js';

/**
 * Converts a Mongoose `AnalyticDocument` into a domain `IAnalytic`.
 *
 * The `eventName` is cast to the domain union type because Mongoose
 * stores it as a plain string.
 */
function toEntity(doc: AnalyticDocument): IAnalytic {
  return {
    id: doc._id.toString(),
    clientId: doc.clientId,
    date: doc.date,
    eventName: doc.eventName as IAnalytic['eventName'],
  };
}

export class MongoAnalyticRepository implements IAnalyticRepository {
  /** @inheritdoc */
  async create(data: IAnalyticCreate): Promise<IAnalytic> {
    const doc = await AnalyticModel.create(data);
    return toEntity(doc);
  }
}
