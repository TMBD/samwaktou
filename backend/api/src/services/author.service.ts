/**
 * @file author.service.ts
 * @description Business-logic service for Author management.
 *
 * Authors represent the people whose audio sessions are recorded.
 * Only Reviewer+ admins can manage (CRUD) authors.
 *
 * Domain rules:
 * 1. Names are upper-cased and must be unique.
 * 2. Duplicate names are rejected with 409 Conflict.
 */

import { AppError } from '../lib/app-error.js';
import type { IAuthor } from '../models/interfaces/index.js';
import type { IAuthorRepository } from '../repositories/interfaces/index.js';

export class AuthorService {
  constructor(private readonly authorRepo: IAuthorRepository) {}

  /* ── Queries ───────────────────────────────────────────────────────── */

  async findById(id: string): Promise<IAuthor> {
    const author = await this.authorRepo.findById(id);
    if (!author) {
      throw AppError.notFound('Auteur introuvable.');
    }
    return author;
  }

  async findByName(name: string): Promise<IAuthor | null> {
    return this.authorRepo.findByName(name.trim().toUpperCase());
  }

  async findMany(
    filter: { name?: string },
    skip: number,
    limit: number,
  ): Promise<{ data: IAuthor[]; total: number }> {
    const [data, total] = await Promise.all([
      this.authorRepo.findMany(filter, skip, limit),
      this.authorRepo.count(filter),
    ]);
    return { data, total };
  }

  /* ── Commands ──────────────────────────────────────────────────────── */

  async create(name: string, adminId: string, description?: string): Promise<IAuthor> {
    const normalised = name.trim().toUpperCase();

    const existing = await this.authorRepo.findByName(normalised);
    if (existing) {
      throw AppError.conflict(`L'auteur "${normalised}" existe déjà.`);
    }

    return this.authorRepo.create({
      name: normalised,
      description: description?.trim() ?? null,
      createdBy: adminId,
    });
  }

  async update(authorId: string, data: { name?: string; description?: string }): Promise<IAuthor> {
    await this.findById(authorId);

    const updatePayload: Record<string, unknown> = {};

    if (data.name !== undefined) {
      const normalised = data.name.trim().toUpperCase();
      const existing = await this.authorRepo.findByName(normalised);
      if (existing && existing.id !== authorId) {
        throw AppError.conflict(`L'auteur "${normalised}" existe déjà.`);
      }
      updatePayload.name = normalised;
    }

    if (data.description !== undefined) {
      updatePayload.description = data.description.trim() || null;
    }

    const updated = await this.authorRepo.updateById(authorId, updatePayload);
    if (!updated) {
      throw AppError.notFound('Auteur introuvable après mise à jour.');
    }

    return updated;
  }

  async deleteById(authorId: string): Promise<void> {
    const deleted = await this.authorRepo.deleteById(authorId);
    if (!deleted) {
      throw AppError.notFound('Auteur introuvable.');
    }
  }
}
