/**
 * @file admin.api.ts
 * @description API functions for the Admin entity.
 *
 * Each function maps to a single backend endpoint and returns typed data.
 * Authentication is handled transparently by the shared `client`.
 */

import { get, getList, post, put, del, buildQuery } from './client';
import type {
  Admin,
  AdminCreatePayload,
  AdminUpdatePayload,
  AdminPasswordPayload,
  LoginPayload,
  LoginResponse,
} from '@/types';

/* ── Auth ──────────────────────────────────────────────────────────────── */

/** POST /admin/login — Authenticate an admin. */
export function login(payload: LoginPayload): Promise<LoginResponse> {
  // Use the v1 path; the client prepends API_PREFIX automatically.
  return post<LoginResponse['data']>('/admin/login', payload) as unknown as Promise<LoginResponse>;
}

/* ── CRUD ──────────────────────────────────────────────────────────────── */

/** GET /admin — List all admins. */
export async function getAdmins() {
  return getList<Admin>('/admin');
}

/** GET /admin/me — Get the current admin profile. */
export async function getMe() {
  return get<Admin>('/admin/me');
}

/** GET /admin/:id — Get a single admin. */
export async function getAdmin(id: string) {
  return get<Admin>(`/admin/${id}`);
}

/** POST /admin — Create a new admin. */
export async function createAdmin(payload: AdminCreatePayload) {
  return post<Admin>('/admin', payload);
}

/** PUT /admin/:id — Update an admin. */
export async function updateAdmin(id: string, payload: AdminUpdatePayload) {
  return put<Admin>(`/admin/${id}`, payload);
}

/** PUT /admin/:id/password — Change an admin's password. */
export async function updatePassword(id: string, payload: AdminPasswordPayload) {
  return put<void>(`/admin/${id}/password`, payload);
}

/** DELETE /admin/:id — Delete an admin. */
export async function deleteAdmin(id: string) {
  return del(`/admin/${id}`);
}

/* ── Query helpers ────────────────────────────────────────────────────── */

/** Build a query string for admin list filters (future use). */
export function buildAdminQuery(filters: Record<string, unknown>): string {
  return buildQuery(filters);
}
