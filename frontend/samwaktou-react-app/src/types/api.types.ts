/**
 * @file api.types.ts
 * @description Generic API response wrapper types.
 *
 * Every backend endpoint returns a JSON envelope with `success` and `data`
 * (or `error`).  These types let us type the wrapper once and re-use it
 * everywhere.
 */

/* ── Success envelope ─────────────────────────────────────────────────── */

/** Standard API success response. */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/** Paginated list response. */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    skip: number;
    limit: number;
    hasMore: boolean;
  };
}

/* ── Error envelope ───────────────────────────────────────────────────── */

/** Standard API error response. */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    reason?: string;
    details?: Record<string, unknown>;
  };
}

/* ── Activity log ─────────────────────────────────────────────────────── */

/** Activity log entry as returned by the API. */
export interface ActivityLog {
  id: string;
  entityType: 'task' | 'audio_draft' | 'theme';
  entityId: string;
  action: string;
  performedBy: string;
  details: Record<string, unknown>;
  createdAt: string;
}
