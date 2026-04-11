/**
 * @file admin.schema.ts
 * @description Mongoose schema and model for the Admin collection.
 *
 * The `AdminDocument` interface extends Mongoose's `Document` and mirrors
 * the domain-level `IAdmin` fields (minus `id`, which Mongoose provides as `_id`).
 *
 * Validation constraints (min/max length) act as a last safety net — the
 * primary validation layer is the Zod schema in `validators/admin.validators.ts`.
 *
 * Phase 1 changes:
 * - `isSuperAdmin` removed → `role` (AdminRole enum, default CONTRIBUTOR).
 * - `date` removed → Mongoose `timestamps: true` (auto `createdAt` / `updatedAt`).
 * - Added `isActive` (default `true`) for soft-disable without deletion.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';
import { AdminRole } from '../../../config/constants.js';

/** Mongoose document shape for the "admins" collection. */
export interface AdminDocument extends Document {
  surname: string;
  name: string;
  email: string;
  /** Bcrypt-hashed password (up to 1 024 chars to accommodate any hash algorithm). */
  password: string;
  /** RBAC role — see {@link AdminRole} for allowed values. */
  role: AdminRole;
  /** Whether the account is active (inactive admins cannot log in). */
  isActive: boolean;
  /** Auto-managed by Mongoose `timestamps`. */
  createdAt: Date;
  /** Auto-managed by Mongoose `timestamps`. */
  updatedAt: Date;
}

const AdminSchema = new Schema<AdminDocument>(
  {
    surname:  { type: String,  required: true, minlength: 2, maxlength: 100  },
    name:     { type: String,  required: true, minlength: 2, maxlength: 100  },
    email:    { type: String,  required: true, minlength: 6, maxlength: 255, unique: true },
    password: { type: String,  required: true, minlength: 6, maxlength: 1024 },
    role: {
      type: String,
      enum: Object.values(AdminRole),
      default: AdminRole.CONTRIBUTOR,
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields.
    timestamps: true,
  },
);

/** Compiled Mongoose model — maps to the "admins" MongoDB collection. */
export const AdminModel: Model<AdminDocument> = mongoose.model<AdminDocument>('Admin', AdminSchema);
