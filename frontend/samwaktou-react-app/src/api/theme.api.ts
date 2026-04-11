/**
 * @file theme.api.ts
 * @description API functions for the Theme entity.
 *
 * Each function maps to a single backend endpoint under `/themes`.
 */

import { get, getList, post, patch, del, buildQuery } from './client';
import type { Theme, ThemeCreatePayload, ThemeUpdatePayload, ThemeFilters } from '@/types';

/* ── Queries ──────────────────────────────────────────────────────────── */

/** GET /themes — List themes with optional filters. */
export async function getThemes(filters?: ThemeFilters) {
  const qs = filters ? buildQuery(filters as Record<string, unknown>) : '';
  return getList<Theme>(`/themes${qs}`);
}

/** GET /themes/:id — Get a single theme. */
export async function getTheme(id: string) {
  return get<Theme>(`/themes/${id}`);
}

/* ── Mutations ────────────────────────────────────────────────────────── */

/** POST /themes — Create a new theme. */
export async function createTheme(payload: ThemeCreatePayload) {
  return post<Theme>('/themes', payload);
}

/** PATCH /themes/:id — Update a theme. */
export async function updateTheme(id: string, payload: ThemeUpdatePayload) {
  return patch<Theme>(`/themes/${id}`, payload);
}

/** PATCH /themes/:id/validate — Validate (approve) a theme. */
export async function validateTheme(id: string) {
  return patch<Theme>(`/themes/${id}/validate`);
}

/** DELETE /themes/:id — Delete a theme. */
export async function deleteTheme(id: string) {
  return del(`/themes/${id}`);
}
