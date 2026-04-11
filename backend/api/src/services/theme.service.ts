/**
 * @file theme.service.ts
 * @description Business-logic service for Theme management.
 *
 * Themes categorise audio content (e.g. "TAWHID", "FIQH"). This service
 * enforces the following domain rules:
 *
 * 1. **Uniqueness** — Theme names are upper-cased and must be unique.
 * 2. **Auto-validation** — When a Reviewer+ creates or proposes a theme,
 *    it is automatically marked as validated.
 * 3. **getOrCreate** — Convenience method used during task creation to
 *    either return an existing theme or create a new one.
 * 4. **Validation** — Only a Reviewer+ can validate an unvalidated theme.
 *
 * @see IThemeRepository for the data-access contract.
 */

import { AdminRole, ROLE_HIERARCHY } from '../config/constants.js';
import { AppError } from '../lib/app-error.js';
import type { ITheme } from '../models/interfaces/index.js';
import type { IThemeRepository } from '../repositories/interfaces/index.js';

export class ThemeService {
  constructor(private readonly themeRepo: IThemeRepository) {}

  /* ── Queries ───────────────────────────────────────────────────────── */

  /** Return a single theme by ID, or throw 404. */
  async findById(id: string): Promise<ITheme> {
    const theme = await this.themeRepo.findById(id);
    if (!theme) {
      throw AppError.notFound('Thème introuvable.');
    }
    return theme;
  }

  /** Return a single theme by its exact name (upper-cased), or `null`. */
  async findByName(name: string): Promise<ITheme | null> {
    return this.themeRepo.findByName(name.trim().toUpperCase());
  }

  /**
   * Return a paginated list of themes with optional filters.
   *
   * @param filter - Optional `isValidated` boolean and `name` substring.
   * @param skip   - Offset for pagination.
   * @param limit  - Max records to return.
   */
  async findMany(
    filter: { isValidated?: boolean; name?: string },
    skip: number,
    limit: number,
  ): Promise<{ data: ITheme[]; total: number }> {
    const [data, total] = await Promise.all([
      this.themeRepo.findMany(filter, skip, limit),
      this.themeRepo.count(filter),
    ]);
    return { data, total };
  }

  /* ── Commands ──────────────────────────────────────────────────────── */

  /**
   * Create a new theme.
   *
   * - Name is normalised to upper-case and trimmed.
   * - Duplicate names are rejected with a 409 Conflict.
   * - Reviewer+ roles auto-validate the theme on creation.
   *
   * @param name      - The theme name (will be upper-cased).
   * @param adminId   - ID of the admin creating the theme.
   * @param adminRole - Role of the admin (for auto-validation check).
   */
  async create(name: string, adminId: string, adminRole: AdminRole): Promise<ITheme> {
    const normalised = name.trim().toUpperCase();

    // Prevent duplicates.
    const existing = await this.themeRepo.findByName(normalised);
    if (existing) {
      throw AppError.conflict(`Le thème "${normalised}" existe déjà.`);
    }

    // Reviewer+ auto-validates the theme on creation.
    const isReviewerOrAbove = ROLE_HIERARCHY[adminRole] <= ROLE_HIERARCHY[AdminRole.REVIEWER];

    return this.themeRepo.create({
      name: normalised,
      isValidated: isReviewerOrAbove,
      createdBy: adminId,
      validatedBy: isReviewerOrAbove ? adminId : null,
    });
  }

  /**
   * Get an existing theme by name, or create it if it doesn't exist.
   *
   * This is the primary method used during task creation to handle
   * theme references in audio drafts. It ensures every draft theme
   * has a corresponding Theme document.
   *
   * @param name      - Theme name (will be upper-cased).
   * @param adminId   - ID of the admin proposing the theme.
   * @param adminRole - Role of the admin (for auto-validation).
   * @returns The existing or newly created theme, and whether it was new.
   */
  async getOrCreate(
    name: string,
    adminId: string,
    adminRole: AdminRole,
  ): Promise<{ theme: ITheme; isNew: boolean }> {
    const normalised = name.trim().toUpperCase();
    const existing = await this.themeRepo.findByName(normalised);

    if (existing) {
      return { theme: existing, isNew: false };
    }

    const theme = await this.create(normalised, adminId, adminRole);
    return { theme, isNew: true };
  }

  /**
   * Validate an unvalidated theme (Reviewer+ only).
   *
   * @param themeId  - ID of the theme to validate.
   * @param adminId  - ID of the admin performing the validation.
   */
  async validate(themeId: string, adminId: string): Promise<ITheme> {
    const theme = await this.findById(themeId);

    if (theme.isValidated) {
      throw AppError.conflict('Ce thème est déjà validé.');
    }

    const updated = await this.themeRepo.updateById(themeId, {
      isValidated: true,
      validatedBy: adminId,
    });

    // Should not happen if findById succeeded, but guard for safety.
    if (!updated) {
      throw AppError.notFound('Thème introuvable après mise à jour.');
    }

    return updated;
  }

  /**
   * Update a theme's name.
   *
   * @param themeId - ID of the theme to update.
   * @param name    - New theme name (will be upper-cased).
   */
  async update(themeId: string, name: string): Promise<ITheme> {
    // Ensure the theme exists.
    await this.findById(themeId);

    const normalised = name.trim().toUpperCase();

    // Check for duplicate name (different theme with same name).
    const existing = await this.themeRepo.findByName(normalised);
    if (existing && existing.id !== themeId) {
      throw AppError.conflict(`Le thème "${normalised}" existe déjà.`);
    }

    const updated = await this.themeRepo.updateById(themeId, { name: normalised });
    if (!updated) {
      throw AppError.notFound('Thème introuvable après mise à jour.');
    }

    return updated;
  }

  /**
   * Delete a theme by ID.
   *
   * @param themeId - ID of the theme to delete.
   */
  async deleteById(themeId: string): Promise<void> {
    const deleted = await this.themeRepo.deleteById(themeId);
    if (!deleted) {
      throw AppError.notFound('Thème introuvable.');
    }
  }
}
