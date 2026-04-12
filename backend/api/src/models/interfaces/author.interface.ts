/**
 * @file author.interface.ts
 * @description Database-agnostic interface for the Author entity.
 *
 * Authors represent the people whose audio sessions are recorded.
 * They are selected from a dropdown during task creation.
 * Only Reviewer+ admins can manage (CRUD) authors.
 *
 * Author names are stored in upper-case and must be unique.
 */

/** Read-model representation of an Author (as returned by the repository). */
export interface IAuthor {
  /** Unique identifier (mapped from the DB primary key). */
  id: string;
  /** Upper-cased author name (unique). */
  name: string;
  /** Optional description / bio of the author. */
  description: string | null;
  /** Admin ID of the admin who created this author. */
  createdBy: string;
  /** Record creation timestamp (Mongoose `timestamps`). */
  createdAt: Date;
  /** Record last-update timestamp (Mongoose `timestamps`). */
  updatedAt: Date;
}

/**
 * Fields required when creating a new author.
 * `id`, `createdAt`, `updatedAt` are auto-generated.
 */
export type IAuthorCreate = Omit<IAuthor, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Fields that may be updated on an existing author (all optional).
 * `id`, `createdAt`, `updatedAt` are immutable / auto-managed.
 */
export type IAuthorUpdate = Partial<Omit<IAuthor, 'id' | 'createdAt' | 'updatedAt'>>;
