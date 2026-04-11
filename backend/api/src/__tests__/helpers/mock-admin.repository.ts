/**
 * @file mock-admin.repository.ts
 * @description In-memory implementation of IAdminRepository for unit tests.
 *
 * This mock stores admins in a plain `Map` — no MongoDB dependency required.
 * Every method faithfully implements the interface contract so services under
 * test behave exactly as they would with the real Mongoose implementation.
 */

import { randomUUID } from 'node:crypto';

import type { IAdmin, IAdminCreate, IAdminUpdate } from '../../models/interfaces/index.js';
import type { IAdminRepository } from '../../repositories/interfaces/index.js';
import type { AdminRole } from '../../config/constants.js';

export class MockAdminRepository implements IAdminRepository {
  /** Internal store keyed by admin ID. */
  private readonly store = new Map<string, IAdmin>();

  /* ── Helper to seed data in tests ───────────────────────────────────── */

  /** Insert a pre-built admin directly (bypasses service-level logic). */
  seed(admin: IAdmin): void {
    this.store.set(admin.id, { ...admin });
  }

  /** Remove all seeded data between tests. */
  clear(): void {
    this.store.clear();
  }

  /* ── IAdminRepository implementation ────────────────────────────────── */

  async create(data: IAdminCreate): Promise<IAdmin> {
    const now = new Date();
    const admin: IAdmin = {
      id: randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(admin.id, admin);
    return { ...admin };
  }

  async findById(id: string): Promise<IAdmin | null> {
    const admin = this.store.get(id);
    return admin ? { ...admin } : null;
  }

  async findByEmail(email: string): Promise<IAdmin | null> {
    for (const admin of this.store.values()) {
      if (admin.email === email.toLowerCase()) {
        return { ...admin };
      }
    }
    return null;
  }

  async findMany(
    filter: {
      surname?: string;
      name?: string;
      email?: string;
      role?: AdminRole;
      isActive?: boolean;
      dateFilter?: { date: Date; gte: boolean } | null;
    },
    skip: number,
    limit: number,
  ): Promise<IAdmin[]> {
    let results = [...this.store.values()];

    if (filter.surname) results = results.filter((a) => a.surname.toLowerCase().includes(filter.surname!.toLowerCase()));
    if (filter.name) results = results.filter((a) => a.name.toLowerCase().includes(filter.name!.toLowerCase()));
    if (filter.email) results = results.filter((a) => a.email.includes(filter.email!.toLowerCase()));
    if (filter.role) results = results.filter((a) => a.role === filter.role);
    if (filter.isActive !== undefined) results = results.filter((a) => a.isActive === filter.isActive);
    if (filter.dateFilter) {
      const { date, gte } = filter.dateFilter;
      results = results.filter((a) => (gte ? a.createdAt >= date : a.createdAt <= date));
    }

    return results.slice(skip, skip + limit).map((a) => ({ ...a }));
  }

  async updateById(id: string, data: IAdminUpdate): Promise<boolean> {
    const existing = this.store.get(id);
    if (!existing) return false;

    this.store.set(id, { ...existing, ...data, updatedAt: new Date() });
    return true;
  }

  async deleteById(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
