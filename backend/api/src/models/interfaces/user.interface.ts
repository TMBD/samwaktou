/**
 * @file user.interface.ts
 * @description Database-agnostic interface for the User entity.
 *
 * A "User" is a public-facing listener who uses the mobile or web app.
 * Authentication is based on `username` + `tel` (no password).
 */

/** Read-model representation of a User. */
export interface IUser {
  /** Unique identifier (mapped from the DB primary key). */
  id: string;
  /** Unique username, lower-cased — serves as the login identifier. */
  username: string;
  /** Phone number — used together with `username` for login verification. */
  tel: string;
  /** Optional email address. `null` when the user did not provide one. */
  email: string | null;
  /** Account creation date. */
  date: Date;
}

/** Fields required when creating a new user (all except the auto-generated `id`). */
export type IUserCreate = Omit<IUser, 'id'>;

/** Fields that may be updated on an existing user (all optional). */
export type IUserUpdate = Partial<Omit<IUser, 'id'>>;
