/**
 * @file audio.schema.ts
 * @description Mongoose schema and model for the Audio collection.
 *
 * Each document represents the metadata for a single audio file stored on S3.
 * The `uri` field holds the S3 object key that links the DB record to its file.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';

/** Mongoose document shape for the "audios" collection. */
export interface AudioDocument extends Document {
  /** S3 object key (e.g. "files/audios/1714000000_sermon.mp3"). */
  uri: string;
  theme: string;
  author: string;
  description: string;
  /** Space-separated keywords for full-text search. */
  keywords: string;
  date: Date;
  /** ID of the source task (null for legacy / manual uploads). */
  taskId: mongoose.Types.ObjectId | null;
}

const AudioSchema = new Schema<AudioDocument>({
  uri:         { type: String, required: true },
  theme:       { type: String, required: true,  minlength: 1, maxlength: 200 },
  author:      { type: String, required: false, minlength: 1, maxlength: 200, default: 'Inconnu' },
  description: { type: String, required: true,  minlength: 1, maxlength: 1000 },
  keywords:    { type: String, required: true,  minlength: 1, maxlength: 500 },
  date:        { type: Date,   default: () => new Date() },
  taskId:      { type: Schema.Types.ObjectId, ref: 'Task', default: null },
});

/** Compiled Mongoose model — maps to the "audios" MongoDB collection. */
export const AudioModel: Model<AudioDocument> = mongoose.model<AudioDocument>('Audio', AudioSchema);
