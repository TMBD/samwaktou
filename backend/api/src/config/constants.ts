/**
 * @file constants.ts
 * @description Application-wide constants grouped by domain.
 *
 * All values are declared `as const` so TypeScript can narrow their types
 * and they can safely be used in switch statements and type guards.
 */

/* ── Admin roles ─────────────────────────────────────────────────────── */

/**
 * Enum of all possible admin roles, ordered from most to least privileged.
 *
 * - **SYSTEM_ADMIN** — Full access: user management, publishing, reviewing, contributing.
 * - **PUBLISHER**    — Can publish/unpublish approved content and create tasks.
 * - **REVIEWER**     — Can review, approve, or reject contributor work.
 * - **CONTRIBUTOR**  — Can work on assigned tasks and submit content for review.
 */
export enum AdminRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  PUBLISHER    = 'PUBLISHER',
  REVIEWER     = 'REVIEWER',
  CONTRIBUTOR  = 'CONTRIBUTOR',
}

/**
 * Numeric hierarchy for role-based access control (RBAC).
 *
 * A **lower** number means **higher** privilege.  The `requireRole` middleware
 * grants access when the authenticated admin's level is ≤ the required level.
 *
 * Example: `requireRole(AdminRole.REVIEWER)` allows SYSTEM_ADMIN (0),
 * PUBLISHER (1), and REVIEWER (2) but blocks CONTRIBUTOR (3).
 */
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  [AdminRole.SYSTEM_ADMIN]: 0,
  [AdminRole.PUBLISHER]:    1,
  [AdminRole.REVIEWER]:     2,
  [AdminRole.CONTRIBUTOR]:  3,
} as const;

/* ── Task statuses ────────────────────────────────────────────────────── */

/**
 * Finite state machine states for a Task.
 *
 * Transitions (see TaskService for enforcement):
 * ```
 * OPEN → IN_PROGRESS (assign)
 * IN_PROGRESS → READY_FOR_REVIEW (submit) | OPEN (unassign)
 * READY_FOR_REVIEW → IN_REVIEW (pick) | OPEN (unassign by reviewer)
 * IN_REVIEW → APPROVED | CORRECTIONS_NEEDED | REJECTED
 * CORRECTIONS_NEEDED → IN_PROGRESS (re-pick by contributor)
 * APPROVED → PUBLISHED (publish)
 * PUBLISHED → APPROVED (unpublish, SysAdmin only)
 * REJECTED → (terminal)
 * ```
 */
export enum TaskStatus {
  OPEN                = 'OPEN',
  IN_PROGRESS         = 'IN_PROGRESS',
  READY_FOR_REVIEW    = 'READY_FOR_REVIEW',
  IN_REVIEW           = 'IN_REVIEW',
  CORRECTIONS_NEEDED  = 'CORRECTIONS_NEEDED',
  APPROVED            = 'APPROVED',
  REJECTED            = 'REJECTED',
  PUBLISHED           = 'PUBLISHED',
}

/* ── Audio-draft statuses ────────────────────────────────────────────── */

/**
 * Status values for individual audio drafts within a task.
 *
 * Each draft starts as `PENDING` and progresses through the review cycle.
 * The task's `contentState` is recalculated whenever a draft status changes.
 */
export enum AudioDraftStatus {
  PENDING              = 'PENDING',
  DONE                 = 'DONE',
  REJECTION_SUGGESTED  = 'REJECTION_SUGGESTED',
  APPROVED             = 'APPROVED',
  CORRECTIONS_NEEDED   = 'CORRECTIONS_NEEDED',
  REJECTED             = 'REJECTED',
}

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

  TASK_MAX_LIMIT: 100,
  TASK_DEFAULT_LIMIT: 20,
  TASK_DEFAULT_SKIP: 0,

  AUDIO_DRAFT_MAX_LIMIT: 200,
  AUDIO_DRAFT_DEFAULT_LIMIT: 50,
  AUDIO_DRAFT_DEFAULT_SKIP: 0,

  THEME_MAX_LIMIT: 200,
  THEME_DEFAULT_LIMIT: 50,
  THEME_DEFAULT_SKIP: 0,

  AUTHOR_MAX_LIMIT: 200,
  AUTHOR_DEFAULT_LIMIT: 50,
  AUTHOR_DEFAULT_SKIP: 0,
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
  /** Prefix for published audio files (e.g. "files/audios/1714000000_audio.mp3"). */
  AUDIO_FILE_LOCATION: 'files/audios/',
  /** Prefix for audio-draft files (e.g. "drafts/<taskId>/<draftId>.mp3"). */
  DRAFT_FILE_LOCATION: 'drafts/',
} as const;
