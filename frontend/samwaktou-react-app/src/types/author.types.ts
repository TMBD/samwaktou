/**
 * @file author.types.ts
 * @description TypeScript types for the Author entity on the frontend.
 */

/* ── Read model ───────────────────────────────────────────────────────── */

/** Author as returned by the API (GET /authors). */
export interface Author {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Write models ─────────────────────────────────────────────────────── */

/** Payload for POST /authors (create). */
export interface AuthorCreatePayload {
  name: string;
  description?: string;
}

/** Payload for PATCH /authors/:id (update). */
export interface AuthorUpdatePayload {
  name?: string;
  description?: string;
}

/* ── Query filters ────────────────────────────────────────────────────── */

/** Query string parameters for GET /authors. */
export interface AuthorFilters {
  name?: string;
  skip?: number;
  limit?: number;
}
