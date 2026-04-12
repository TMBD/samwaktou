/**
 * @file author.schema.ts
 * @description Mongoose schema and model for the Author collection.
 *
 * Authors represent the people whose audio sessions are recorded.
 * Names are stored upper-cased and enforced unique via a case-insensitive index.
 *
 * Indexes:
 * - `{ name: 1 }` unique — prevent duplicate author names.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';

/* ── Author document interface ──────────────────────────────────────── */

/** Mongoose document shape for the "authors" collection. */
export interface AuthorDocument extends Document {
  name: string;
  description: string | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema definition ───────────────────────────────────────────────── */

const AuthorSchema = new Schema<AuthorDocument>(
  {
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 200,
      uppercase: true,
      trim: true,
    },
    description: { type: String, default: null, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  {
    timestamps: true,
  },
);

/* ── Indexes ─────────────────────────────────────────────────────────── */

AuthorSchema.index({ name: 1 }, { unique: true });

/* ── Model export ────────────────────────────────────────────────────── */

/** Compiled Mongoose model — maps to the "authors" MongoDB collection. */
export const AuthorModel: Model<AuthorDocument> = mongoose.model<AuthorDocument>('Author', AuthorSchema);
