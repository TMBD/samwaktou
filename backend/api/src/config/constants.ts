/**
 * @file constants.ts
 * @description Application-wide constants grouped by domain.
 *
 * All values are declared `as const` so TypeScript can narrow their types
 * and they can safely be used in switch statements and type guards.
 */

/* ── HTTP status codes ────────────────────────────────────────────────── */

/** Standard HTTP status codes used throughout the API responses. */
export const HTTP_CODE = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/* ── File upload constraints ──────────────────────────────────────────── */

/** Limits applied to uploaded audio files by express-fileupload. */
export const AUDIO_FILE_PARAMS = {
  /** Maximum allowed file size in bytes (100 MB). */
  MAX_FILE_SIZE: 100 * 1024 * 1024,
} as const;

/* ── Pagination defaults ──────────────────────────────────────────────── */

/**
 * Default and maximum values for paginated list endpoints.
 * Each entity has its own set so they can evolve independently.
 */
export const PAGINATION = {
  AUDIO_MAX_LIMIT: 100,
  AUDIO_DEFAULT_LIMIT: 20,
  AUDIO_DEFAULT_SKIP: 0,

  ADMIN_MAX_LIMIT: 100,
  ADMIN_DEFAULT_LIMIT: 10,
  ADMIN_DEFAULT_SKIP: 0,

  USER_MAX_LIMIT: 100,
  USER_DEFAULT_LIMIT: 10,
  USER_DEFAULT_SKIP: 0,
} as const;

/* ── Date handling ────────────────────────────────────────────────────── */

/**
 * Date format string used by `date-fns` for parsing user-provided dates.
 * Example input: "25-12-2024" → December 25, 2024.
 */
export const DATE_FORMAT = 'dd-MM-yyyy' as const;

/* ── JWT ──────────────────────────────────────────────────────────────── */

/** Duration string understood by the `jose` library for token expiration. */
export const JWT_DURATION = '24h' as const;

/* ── Object storage paths ─────────────────────────────────────────────── */

/** S3 key prefixes where files are stored inside the bucket. */
export const FILE_LOCATION = {
  /** Prefix for all audio files (e.g. "files/audios/1714000000_audio.mp3"). */
  AUDIO_FILE_LOCATION: 'files/audios/',
} as const;
