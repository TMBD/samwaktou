/**
 * @file analytic.service.ts
 * @description Business-logic layer for Analytic (usage tracking) operations.
 *
 * Analytics are fire-and-forget: the frontend sends a single event,
 * and this service persists it without any further processing.
 * There are no read/update/delete operations exposed through the API.
 *
 * This class depends on {@link IAnalyticRepository} (injected via DI).
 */

import type { IAnalytic, IAnalyticCreate } from '../models/interfaces/index.js';
import type { IAnalyticRepository } from '../repositories/interfaces/index.js';

export class AnalyticService {
  constructor(private readonly analyticRepo: IAnalyticRepository) {}

  /**
   * Record a new analytic event.
   *
   * @param data.clientId  - Opaque client-side identifier (device fingerprint).
   * @param data.eventName - One of the allowed event types (e.g. "PAGE_LOAD").
   * @param data.date      - Optional timestamp; defaults to "now" if omitted.
   * @returns The persisted analytic record.
   */
  async create(data: { clientId: string; eventName: IAnalytic['eventName']; date?: Date }): Promise<IAnalytic> {
    const toCreate: IAnalyticCreate = {
      clientId: data.clientId,
      eventName: data.eventName,
      date: data.date ?? new Date(),
    };

    return this.analyticRepo.create(toCreate);
  }
}
