/**
 * @file analytic.interface.ts
 * @description Database-agnostic interface for the Analytic entity.
 *
 * Analytics are lightweight, fire-and-forget events sent by the frontend
 * to track anonymous usage (page loads, audio plays, downloads).
 * They are identified by a `clientId` (device fingerprint, not a user ID).
 */

/** Exhaustive list of analytics event types the frontend can report. */
export type EventName = 'PAGE_LOAD' | 'START_LISTENING_AUDIO' | 'AUDIO_DOWNLOADED';

/** Read-model representation of a single analytic event. */
export interface IAnalytic {
  /** Unique identifier (mapped from the DB primary key). */
  id: string;
  /** Opaque client-side identifier (device fingerprint or random UUID). */
  clientId: string;
  /** Timestamp when the event occurred. */
  date: Date;
  /** Type of event that was tracked. */
  eventName: EventName;
}

/** Fields required when recording a new analytic event (all except the auto-generated `id`). */
export type IAnalyticCreate = Omit<IAnalytic, 'id'>;
