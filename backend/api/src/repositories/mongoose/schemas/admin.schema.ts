/**
 * @file admin.schema.ts
 * @description Mongoose schema and model for the Admin collection.
 *
 * The `AdminDocument` interface extends Mongoose's `Document` and mirrors
 * the domain-level `IAdmin` fields (minus `id`, which Mongoose provides as `_id`).
 *
 * Validation constraints (min/max length) act as a last safety net — the
 * primary validation layer is the Zod schema in `validators/admin.validators.ts`.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';

/** Mongoose document shape for the "admins" collection. */
export interface AdminDocument extends Document {
  surname: string;
  name: string;
  email: string;
  /** Bcrypt-hashed password (up to 1 024 chars to accommodate any hash algorithm). */
  password: string;
  date: Date;
  isSuperAdmin: boolean;
}

const AdminSchema = new Schema<AdminDocument>({
  surname:      { type: String,  required: true,  minlength: 2,  maxlength: 100  },
  name:         { type: String,  required: true,  minlength: 2,  maxlength: 100  },
  email:        { type: String,  required: true,  minlength: 6,  maxlength: 255  },
  password:     { type: String,  required: true,  minlength: 6,  maxlength: 1024 },
  date:         { type: Date,    default: () => new Date() },
  isSuperAdmin: { type: Boolean, default: false },
});

/** Compiled Mongoose model — maps to the "admins" MongoDB collection. */
export const AdminModel: Model<AdminDocument> = mongoose.model<AdminDocument>('Admin', AdminSchema);
