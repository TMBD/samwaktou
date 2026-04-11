/**
 * @file admin.types.ts
 * @description TypeScript types for the Admin entity on the frontend.
 *
 * These mirror the backend `IAdmin` interface but only include fields
 * that the API actually returns to the client (e.g. `password` is excluded).
 */

import type { AdminRole } from './enums';

/* ── Read model ───────────────────────────────────────────────────────── */

/** Admin as returned by the API (GET /admins, GET /admins/:id). */
export interface Admin {
  id: string;
  surname: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ── Write models ─────────────────────────────────────────────────────── */

/** Payload for POST /admins (create). */
export interface AdminCreatePayload {
  surname: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

/** Payload for PUT /admins/:id (update). */
export interface AdminUpdatePayload {
  surname?: string;
  name?: string;
  email?: string;
  role?: AdminRole;
  isActive?: boolean;
}

/** Payload for PUT /admins/:id/password. */
export interface AdminPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/* ── Auth ──────────────────────────────────────────────────────────────── */

/** Payload for POST /admins/login. */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Response from POST /admins/login. */
export interface LoginResponse {
  success: boolean;
  data: {
    id: string;
    role: AdminRole;
    email: string;
    token: string;
  };
}

/** Decoded user info stored in AuthContext (from the JWT / login response). */
export interface AuthUser {
  id: string;
  role: AdminRole;
  email: string;
  token: string;
}
