/**
 * @file audio-draft.schema.ts
 * @description Mongoose schema and model for the AudioDraft collection.
 *
 * An AudioDraft is a single audio file within a {@link Task}. Each draft
 * progresses independently through the {@link AudioDraftStatus} review cycle.
 *
 * Draft files are stored on S3 under `drafts/<taskId>/<draftId>.<ext>`.
 *
 * Indexes:
 * - `{ task: 1, order: 1 }`   — list drafts for a task in display order.
 * - `{ task: 1, status: 1 }`  — count/filter drafts by status within a task.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';

import { AudioDraftStatus } from '../../../config/constants.js';

/* ── AudioDraft document interface ───────────────────────────────────── */

/** Mongoose document shape for the "audiodrafts" collection. */
export interface AudioDraftDocument extends Document {
  task: mongoose.Types.ObjectId;
  uri: string;
  originalFileName: string;
  description: string;
  theme: string;
  keywords: string;
  status: AudioDraftStatus;
  isNewTheme: boolean;
  rejectionSuggestedReason: string | null;
  reviewComment: string | null;
  correctionComment: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema definition ───────────────────────────────────────────────── */

const AudioDraftSchema = new Schema<AudioDraftDocument>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    uri:  { type: String, required: true },
    originalFileName: { type: String, required: true, maxlength: 500 },
    description: { type: String, required: true, minlength: 1, maxlength: 1000 },
    theme:       { type: String, required: true, minlength: 1, maxlength: 200 },
    keywords:    { type: String, required: true, minlength: 1, maxlength: 500 },
    status: {
      type: String,
      enum: Object.values(AudioDraftStatus),
      default: AudioDraftStatus.PENDING,
      required: true,
    },
    isNewTheme: { type: Boolean, default: false },
    rejectionSuggestedReason: { type: String, default: null, maxlength: 2000 },
    reviewComment:            { type: String, default: null, maxlength: 2000 },
    correctionComment:        { type: String, default: null, maxlength: 2000 },
    order: { type: Number, required: true, min: 1 },
  },
  {
    timestamps: true, // Auto-manages createdAt + updatedAt.
  },
);

/* ── Indexes ─────────────────────────────────────────────────────────── */

AudioDraftSchema.index({ task: 1, order: 1 });
AudioDraftSchema.index({ task: 1, status: 1 });

/* ── Model export ────────────────────────────────────────────────────── */

/** Compiled Mongoose model — maps to the "audiodrafts" MongoDB collection. */
export const AudioDraftModel: Model<AudioDraftDocument> = mongoose.model<AudioDraftDocument>(
  'AudioDraft',
  AudioDraftSchema,
);
