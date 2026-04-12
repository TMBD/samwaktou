/**
 * @file author.api.ts
 * @description API functions for the Author entity.
 *
 * Each function maps to a single backend endpoint under `/authors`.
 */

import { get, getList, post, patch, del, buildQuery } from './client';
import type { Author, AuthorCreatePayload, AuthorUpdatePayload, AuthorFilters } from '@/types';

/* ── Queries ──────────────────────────────────────────────────────────── */

/** GET /authors — List authors with optional filters. */
export async function getAuthors(filters?: AuthorFilters) {
  const qs = filters ? buildQuery(filters as Record<string, unknown>) : '';
  return getList<Author>(`/authors${qs}`);
}

/** GET /authors/:id — Get a single author. */
export async function getAuthor(id: string) {
  return get<Author>(`/authors/${id}`);
}

/* ── Mutations ────────────────────────────────────────────────────────── */

/** POST /authors — Create a new author. */
export async function createAuthor(payload: AuthorCreatePayload) {
  return post<Author>('/authors', payload);
}

/** PATCH /authors/:id — Update an author. */
export async function updateAuthor(id: string, payload: AuthorUpdatePayload) {
  return patch<Author>(`/authors/${id}`, payload);
}

/** DELETE /authors/:id — Delete an author. */
export async function deleteAuthor(id: string) {
  return del(`/authors/${id}`);
}
