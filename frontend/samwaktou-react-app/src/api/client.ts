/**
 * @file client.ts
 * @description Centralised HTTP client for communicating with the backend API.
 *
 * Features:
 * - Automatic `auth-token` header injection from localStorage.
 * - Token refresh: if the API returns a new token in the `auth-token`
 *   response header, localStorage is updated transparently.
 * - 401 auto-logout: clears stored auth and redirects to `/login`.
 * - Typed JSON / FormData request helpers.
 * - Human-readable error messages (French, matching the existing UX).
 */

import type { ApiResponse, PaginatedResponse, ApiErrorResponse } from '@/types';

/* ── Configuration ────────────────────────────────────────────────────── */

const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL ?? 'http://localhost:8080';
const API_PREFIX = '/api/v1';

/** localStorage key where the auth user JSON is persisted. */
const AUTH_STORAGE_KEY = 'samwaktou_auth';

/* ── Token helpers ────────────────────────────────────────────────────── */

/**
 * Read the current auth token from localStorage.
 * Returns `null` if no token is stored.
 */
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Persist an updated token back to localStorage without
 * touching the rest of the stored auth object.
 */
function updateStoredToken(newToken: string): void {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    parsed.token = newToken;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Swallow — best-effort update.
  }
}

/* ── Error handling ───────────────────────────────────────────────────── */

/**
 * Custom error class carrying the HTTP status and the parsed API error
 * body so callers can inspect both.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly reason?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Map a failed `Response` to a human-readable `ApiError`.
 *
 * Tries to parse the JSON error body first; falls back to generic
 * French error messages based on the status code.
 */
async function handleErrorResponse(res: Response): Promise<never> {
  let message = 'Une erreur inattendue s\'est produite.';
  let reason: string | undefined;
  let details: Record<string, unknown> | undefined;

  try {
    const body = (await res.json()) as ApiErrorResponse;
    if (body?.error?.message) {
      message = body.error.message;
      reason = body.error.reason;
      details = body.error.details;
    }
  } catch {
    // JSON parsing failed — use status-based fallbacks.
    if (res.status === 401) {
      message = 'Session expirée. Veuillez vous reconnecter.';
    } else if (res.status === 403) {
      message = 'Vous n\'avez pas les droits nécessaires.';
    } else if (res.status === 404) {
      message = 'Ressource introuvable.';
    } else if (res.status === 409) {
      message = 'Conflit : l\'opération ne peut pas être effectuée.';
    } else if (res.status >= 500) {
      message = 'Erreur interne du serveur. Réessayez plus tard.';
    }
  }

  // Auto-logout on 401.
  if (res.status === 401) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = '/login';
  }

  throw new ApiError(message, res.status, reason, details);
}

/* ── Core fetch wrapper ───────────────────────────────────────────────── */

interface RequestOptions {
  method: string;
  path: string;
  body?: unknown;
  isFormData?: boolean;
  /** If true, path is used as-is (no API_PREFIX prepend). */
  rawPath?: boolean;
}

/**
 * Internal fetch wrapper shared by all public helpers.
 *
 * - Prepends `API_BASE_URL + API_PREFIX` to the path.
 * - Attaches the auth token header.
 * - Handles token refresh from response headers.
 * - Delegates error responses to `handleErrorResponse`.
 */
async function request<T>(opts: RequestOptions): Promise<T> {
  const url = opts.rawPath
    ? `${API_BASE_URL}${opts.path}`
    : `${API_BASE_URL}${API_PREFIX}${opts.path}`;

  const headers: Record<string, string> = {};

  // Attach auth token if available.
  const token = getStoredToken();
  if (token) {
    headers['auth-token'] = token;
  }

  // Set Content-Type for JSON bodies (FormData sets its own boundary).
  if (!opts.isFormData && opts.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method: opts.method,
    headers,
    body: opts.isFormData
      ? (opts.body as FormData)
      : opts.body
        ? JSON.stringify(opts.body)
        : undefined,
  });

  // Refresh token if the backend sent an updated one.
  const refreshedToken = res.headers.get('auth-token');
  if (refreshedToken) {
    updateStoredToken(refreshedToken);
  }

  // Non-OK → throw typed error.
  if (!res.ok) {
    await handleErrorResponse(res);
  }

  // 204 No Content — nothing to parse.
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

/* ── Public helpers ───────────────────────────────────────────────────── */

/** GET request returning typed JSON. */
export async function get<T>(path: string): Promise<ApiResponse<T>> {
  return request<ApiResponse<T>>({ method: 'GET', path });
}

/** GET request returning a paginated list. */
export async function getList<T>(path: string): Promise<PaginatedResponse<T>> {
  return request<PaginatedResponse<T>>({ method: 'GET', path });
}

/** POST request with a JSON body. */
export async function post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<ApiResponse<T>>({ method: 'POST', path, body });
}

/**
 * POST request returning the raw JSON (no `ApiResponse` envelope).
 * Used for endpoints like `/admin/login` that return data directly.
 */
export async function postRaw<T>(path: string, body?: unknown): Promise<T> {
  return request<T>({ method: 'POST', path, body });
}

/** POST request with FormData (file uploads). */
export async function postForm<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  return request<ApiResponse<T>>({ method: 'POST', path, body: formData, isFormData: true });
}

/** PUT request with a JSON body. */
export async function put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<ApiResponse<T>>({ method: 'PUT', path, body });
}

/** PATCH request with a JSON body. */
export async function patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<ApiResponse<T>>({ method: 'PATCH', path, body });
}

/** DELETE request. */
export async function del<T = void>(path: string): Promise<ApiResponse<T>> {
  return request<ApiResponse<T>>({ method: 'DELETE', path });
}

/**
 * Build a query string from an object of filters.
 * Skips `undefined` and `null` values.
 *
 * @example buildQuery({ status: 'OPEN', page: 1 }) → '?status=OPEN&page=1'
 */
export function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const qs = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString();
  return `?${qs}`;
}

/* ── Re-exports for convenience ───────────────────────────────────────── */

export { AUTH_STORAGE_KEY };
