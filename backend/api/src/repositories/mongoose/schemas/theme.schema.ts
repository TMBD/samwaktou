/**
 * @file theme.schema.ts
 * @description Mongoose schema and model for the Theme collection.
 *
 * Themes categorise audio content (e.g. "TAWHID", "FIQH").
 * Names are stored upper-cased and enforced unique via a case-insensitive index.
 *
 * Indexes:
 * - `{ name: 1 }` unique   — prevent duplicate theme names.
 * - `{ isValidated: 1 }`   — quickly list validated / unvalidated themes.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';

/* ── Theme document interface ────────────────────────────────────────── */

/** Mongoose document shape for the "themes" collection. */
export interface ThemeDocument extends Document {
  name: string;
  isValidated: boolean;
  createdBy: mongoose.Types.ObjectId;
  validatedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema definition ───────────────────────────────────────────────── */

const ThemeSchema = new Schema<ThemeDocument>(
  {
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 200,
      uppercase: true,  // Mongoose auto-transforms to upper-case on save.
      trim: true,
    },
    isValidated: { type: Boolean, default: false },
    createdBy:   { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    validatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  {
    timestamps: true, // Auto-manages createdAt + updatedAt.
  },
);

/* ── Indexes ─────────────────────────────────────────────────────────── */

ThemeSchema.index({ name: 1 }, { unique: true });
ThemeSchema.index({ isValidated: 1 });

/* ── Model export ────────────────────────────────────────────────────── */

/** Compiled Mongoose model — maps to the "themes" MongoDB collection. */
export const ThemeModel: Model<ThemeDocument> = mongoose.model<ThemeDocument>('Theme', ThemeSchema);
