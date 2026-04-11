/**
 * @file theme.types.ts
 * @description TypeScript types for the Theme entity on the frontend.
 */

/* ── Read model ───────────────────────────────────────────────────────── */

/** Theme as returned by the API (GET /themes). */
export interface Theme {
  id: string;
  name: string;
  description?: string;
  isValidated: boolean;
  createdBy: string;
  validatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Write models ─────────────────────────────────────────────────────── */

/** Payload for POST /themes (create). */
export interface ThemeCreatePayload {
  name: string;
  description?: string;
}

/** Payload for PATCH /themes/:id (update). */
export interface ThemeUpdatePayload {
  name?: string;
  description?: string;
}

/* ── Query filters ────────────────────────────────────────────────────── */

/** Query string parameters for GET /themes. */
export interface ThemeFilters {
  isValidated?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
