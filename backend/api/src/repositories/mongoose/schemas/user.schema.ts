/**
 * @file user.schema.ts
 * @description Mongoose schema and model for the User collection.
 *
 * Users authenticate via `username` + `tel` (no password).
 * The `email` field is optional and may be `null`.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose';

/** Mongoose document shape for the "users" collection. */
export interface UserDocument extends Document {
  username: string;
  tel: string;
  /** Optional email — stored as `null` when the user chose not to provide one. */
  email: string | null;
  date: Date;
}

const UserSchema = new Schema<UserDocument>({
  username: { type: String, required: true,  minlength: 3, maxlength: 100 },
  tel:      { type: String, required: true,  minlength: 6, maxlength: 20  },
  email:    { type: String, required: false, minlength: 6, maxlength: 255, default: null },
  date:     { type: Date,   default: () => new Date() },
});

/** Compiled Mongoose model — maps to the "users" MongoDB collection. */
export const UserModel: Model<UserDocument> = mongoose.model<UserDocument>('User', UserSchema);
