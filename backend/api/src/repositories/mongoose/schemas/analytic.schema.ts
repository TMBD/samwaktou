/**
 * @file analytic.schema.ts
 * @description Mongoose schema and model for the Analytic collection.
 *
 * Each document is a lightweight, write-only event logged by the frontend
 * for anonymous usage tracking.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';

/** Mongoose document shape for the "analytics" collection. */
export interface AnalyticDocument extends Document {
  /** Opaque client-side identifier (device fingerprint or UUID). */
  clientId: string;
  date: Date;
  /** Event type string (e.g. "PAGE_LOAD", "START_LISTENING_AUDIO"). */
  eventName: string;
}

const AnalyticSchema = new Schema<AnalyticDocument>({
  clientId:  { type: String, required: true },
  date:      { type: Date,   default: () => new Date() },
  eventName: { type: String, required: true },
});

/** Compiled Mongoose model — maps to the "analytics" MongoDB collection. */
export const AnalyticModel: Model<AnalyticDocument> = mongoose.model<AnalyticDocument>('Analytic', AnalyticSchema);
