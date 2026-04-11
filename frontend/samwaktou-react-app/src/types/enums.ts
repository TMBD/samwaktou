/**
 * @file enums.ts
 * @description Shared enumerations mirroring the backend constants.
 *
 * Keep these in sync with `backend/api/src/config/constants.ts`.
 * Using string enums for readability in UI labels and API payloads.
 */

/* ── Admin roles ──────────────────────────────────────────────────────── */

export enum AdminRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  PUBLISHER = 'PUBLISHER',
  REVIEWER = 'REVIEWER',
  CONTRIBUTOR = 'CONTRIBUTOR',
}

/** Numeric privilege level — lower = more powerful. */
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  [AdminRole.SYSTEM_ADMIN]: 0,
  [AdminRole.PUBLISHER]: 1,
  [AdminRole.REVIEWER]: 2,
  [AdminRole.CONTRIBUTOR]: 3,
};

/* ── Task statuses ────────────────────────────────────────────────────── */

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  CORRECTIONS_NEEDED = 'CORRECTIONS_NEEDED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

/* ── Audio-draft statuses ─────────────────────────────────────────────── */

export enum AudioDraftStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  REJECTION_SUGGESTED = 'REJECTION_SUGGESTED',
  APPROVED = 'APPROVED',
  CORRECTIONS_NEEDED = 'CORRECTIONS_NEEDED',
  REJECTED = 'REJECTED',
}
