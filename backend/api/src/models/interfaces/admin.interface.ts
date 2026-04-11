/**
 * @file admin.interface.ts
 * @description Database-agnostic interface for the Admin entity.
 *
 * These types are the **single source of truth** for the Admin shape used
 * across services, controllers, and routes. They intentionally contain no
 * Mongoose/DB-specific details so the domain layer stays portable.
 */

/** Read-model representation of an Admin (as returned by the repository). */
export interface IAdmin {
  /** Unique identifier (mapped from the DB's primary key, e.g. Mongo `_id`). */
  id: string;
  /** First name / surname, capitalised (e.g. "Thierno"). */
  surname: string;
  /** Last name, upper-cased (e.g. "DIALLO"). */
  name: string;
  /** Email address, lower-cased — used as the login identifier. */
  email: string;
  /** Bcrypt-hashed password — never exposed to the client. */
  password: string;
  /** Account creation date. */
  date: Date;
  /** `true` if the admin has elevated privileges (can manage other admins). */
  isSuperAdmin: boolean;
}

/** Fields required when creating a new admin (all except the auto-generated `id`). */
export type IAdminCreate = Omit<IAdmin, 'id'>;

/** Fields that may be updated on an existing admin (all optional, except `id` which is immutable). */
export type IAdminUpdate = Partial<Omit<IAdmin, 'id'>>;
