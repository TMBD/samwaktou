/**
 * @file task.schema.ts
 * @description Mongoose schema and model for the Task collection.
 *
 * A Task represents a batch of audio files progressing through a
 * contributor → reviewer → publisher workflow. The `status` field
 * follows the {@link TaskStatus} finite state machine.
 *
 * Indexes:
 * - `{ status: 1 }`                — filter by current workflow step.
 * - `{ assignee: 1 }`              — find tasks assigned to a specific admin.
 * - `{ status: 1, assignee: 1 }`   — compound filter (status + assignee).
 * - `{ sessionAuthor: 1 }`         — filter by speaker name.
 * - `{ sessionDate: -1 }`          — sort by recording date (newest first).
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';

import { TaskStatus } from '../../../config/constants.js';

/* ── Content-state sub-schema ────────────────────────────────────────── */

/**
 * Embedded sub-document that mirrors {@link IContentState}.
 * Stored inline on the task for O(1) access to draft-status counts.
 */
const ContentStateSchema = new Schema(
  {
    total:            { type: Number, required: true, default: 0 },
    done:             { type: Number, required: true, default: 0 },
    approved:         { type: Number, required: true, default: 0 },
    rejected:         { type: Number, required: true, default: 0 },
    correctionNeeded: { type: Number, required: true, default: 0 },
    pending:          { type: Number, required: true, default: 0 },
  },
  { _id: false }, // No separate _id for embedded sub-documents.
);

/* ── Task document interface ─────────────────────────────────────────── */

/** Mongoose document shape for the "tasks" collection. */
export interface TaskDocument extends Document {
  description: string;
  sessionAuthor: string;
  sessionDate: Date;
  status: TaskStatus;
  assignee: mongoose.Types.ObjectId | null;
  previousAssignee: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  reviewedBy: mongoose.Types.ObjectId | null;
  contentState: {
    total: number;
    done: number;
    approved: number;
    rejected: number;
    correctionNeeded: number;
    pending: number;
  };
  rejectionReason: string | null;
  taskRejectionSuggested: boolean;
  taskRejectionSuggestedReason: string | null;
  publishedAudioIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema definition ───────────────────────────────────────────────── */

const TaskSchema = new Schema<TaskDocument>(
  {
    description: { type: String, required: true, minlength: 1, maxlength: 2000 },
    sessionAuthor: { type: String, required: true, minlength: 1, maxlength: 200 },
    sessionDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.OPEN,
      required: true,
    },
    assignee:         { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    previousAssignee: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    createdBy:        { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    reviewedBy:       { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    contentState:     { type: ContentStateSchema, required: true },
    rejectionReason:  { type: String, default: null, maxlength: 2000 },
    taskRejectionSuggested: { type: Boolean, default: false },
    taskRejectionSuggestedReason: { type: String, default: null, maxlength: 2000 },
    publishedAudioIds: [{ type: Schema.Types.ObjectId, ref: 'Audio' }],
  },
  {
    timestamps: true, // Auto-manages createdAt + updatedAt.
  },
);

/* ── Indexes ─────────────────────────────────────────────────────────── */

TaskSchema.index({ status: 1 });
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ status: 1, assignee: 1 });
TaskSchema.index({ sessionAuthor: 1 });
TaskSchema.index({ sessionDate: -1 });

/* ── Model export ────────────────────────────────────────────────────── */

/** Compiled Mongoose model — maps to the "tasks" MongoDB collection. */
export const TaskModel: Model<TaskDocument> = mongoose.model<TaskDocument>('Task', TaskSchema);
