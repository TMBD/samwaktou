/**
 * @file analytic.repository.ts
 * @description Contract (interface) for Analytic persistence operations.
 *
 * Analytics are write-only — there is no read/update/delete endpoint.
 * The Mongoose implementation lives in
 * `repositories/mongoose/analytic.repository.impl.ts`.
 */

import type { IAnalytic, IAnalyticCreate } from '../../models/interfaces/index.js';

export interface IAnalyticRepository {
  /** Persist a new analytic event and return its read-model. */
  create(data: IAnalyticCreate): Promise<IAnalytic>;
}
