/**
 * @file theme.interface.ts
 * @description Database-agnostic interface for the Theme entity.
 *
 * Themes categorise audio content (e.g. "TAWHID", "FIQH").
 * A Contributor can propose a new theme (unvalidated), while a Reviewer+
 * can validate it so it becomes available for all future tasks.
 *
 * Theme names are stored in upper-case and must be unique.
 */

/** Read-model representation of a Theme (as returned by the repository). */
export interface ITheme {
  /** Unique identifier (mapped from the DB primary key). */
  id: string;
  /** Upper-cased theme name (unique). */
  name: string;
  /** Whether the theme has been validated by a Reviewer or above. */
  isValidated: boolean;
  /** Admin ID of the admin who created this theme. */
  createdBy: string;
  /** Admin ID of the reviewer who validated this theme, or `null`. */
  validatedBy: string | null;
  /** Record creation timestamp (Mongoose `timestamps`). */
  createdAt: Date;
  /** Record last-update timestamp (Mongoose `timestamps`). */
  updatedAt: Date;
}

/**
 * Fields required when creating a new theme.
 * `id`, `createdAt`, `updatedAt` are auto-generated.
 */
export type IThemeCreate = Omit<ITheme, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Fields that may be updated on an existing theme (all optional).
 * `id`, `createdAt`, `updatedAt` are immutable / auto-managed.
 */
export type IThemeUpdate = Partial<Omit<ITheme, 'id' | 'createdAt' | 'updatedAt'>>;
