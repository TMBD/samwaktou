/**
 * @file activity-log.schema.ts
 * @description Mongoose schema and model for the ActivityLog collection.
 *
 * Activity logs are an immutable audit trail: once created, entries are
 * never updated or deleted. Only `createdAt` is generated (no `updatedAt`).
 *
 * Indexes:
 * - `{ entityType: 1, entityId: 1 }` — filter logs for a specific entity.
 * - `{ createdAt: -1 }`              — newest-first timeline.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';

/* ── ActivityLog document interface ──────────────────────────────────── */

/** Mongoose document shape for the "activitylogs" collection. */
export interface ActivityLogDocument extends Document {
  entityType: 'task' | 'audio_draft' | 'theme';
  entityId: mongoose.Types.ObjectId;
  action: string;
  performedBy: mongoose.Types.ObjectId;
  details: Record<string, unknown>;
  createdAt: Date;
}

/* ── Schema definition ───────────────────────────────────────────────── */

const ActivityLogSchema = new Schema<ActivityLogDocument>(
  {
    entityType: {
      type: String,
      enum: ['task', 'audio_draft', 'theme'],
      required: true,
    },
    entityId:    { type: Schema.Types.ObjectId, required: true },
    action:      { type: String, required: true, maxlength: 100 },
    performedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    details:     { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only — no updatedAt.
  },
);

/* ── Indexes ─────────────────────────────────────────────────────────── */

ActivityLogSchema.index({ entityType: 1, entityId: 1 });
ActivityLogSchema.index({ createdAt: -1 });

/* ── Model export ────────────────────────────────────────────────────── */

/** Compiled Mongoose model — maps to the "activitylogs" MongoDB collection. */
export const ActivityLogModel: Model<ActivityLogDocument> = mongoose.model<ActivityLogDocument>(
  'ActivityLog',
  ActivityLogSchema,
);
