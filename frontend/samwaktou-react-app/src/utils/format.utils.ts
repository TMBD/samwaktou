/**
 * @file format.utils.ts
 * @description Formatting helpers for labels, statuses, and display values.
 *
 * Keeps all human-readable label logic in one place so components stay
 * lean and labels remain consistent across the whole UI.
 */

import { TaskStatus, AudioDraftStatus, AdminRole } from '@/types';

/* ── Task status ──────────────────────────────────────────────────────── */

/** Human-readable French labels for task statuses. */
const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.OPEN]: 'Ouvert',
  [TaskStatus.IN_PROGRESS]: 'En cours',
  [TaskStatus.READY_FOR_REVIEW]: 'Prêt pour revue',
  [TaskStatus.IN_REVIEW]: 'En revue',
  [TaskStatus.CORRECTIONS_NEEDED]: 'Corrections requises',
  [TaskStatus.APPROVED]: 'Approuvé',
  [TaskStatus.REJECTED]: 'Rejeté',
  [TaskStatus.PUBLISHED]: 'Publié',
};

/** Mantine color keys for task status badges. */
const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.OPEN]: 'gray',
  [TaskStatus.IN_PROGRESS]: 'blue',
  [TaskStatus.READY_FOR_REVIEW]: 'indigo',
  [TaskStatus.IN_REVIEW]: 'violet',
  [TaskStatus.CORRECTIONS_NEEDED]: 'orange',
  [TaskStatus.APPROVED]: 'green',
  [TaskStatus.REJECTED]: 'red',
  [TaskStatus.PUBLISHED]: 'teal',
};

export function getTaskStatusLabel(status: TaskStatus): string {
  return TASK_STATUS_LABELS[status] ?? status;
}

export function getTaskStatusColor(status: TaskStatus): string {
  return TASK_STATUS_COLORS[status] ?? 'gray';
}

/* ── Audio-draft status ───────────────────────────────────────────────── */

const DRAFT_STATUS_LABELS: Record<AudioDraftStatus, string> = {
  [AudioDraftStatus.PENDING]: 'En attente',
  [AudioDraftStatus.DONE]: 'Terminé',
  [AudioDraftStatus.REJECTION_SUGGESTED]: 'Rejet suggéré',
  [AudioDraftStatus.APPROVED]: 'Approuvé',
  [AudioDraftStatus.CORRECTIONS_NEEDED]: 'Corrections requises',
  [AudioDraftStatus.REJECTED]: 'Rejeté',
};

const DRAFT_STATUS_COLORS: Record<AudioDraftStatus, string> = {
  [AudioDraftStatus.PENDING]: 'gray',
  [AudioDraftStatus.DONE]: 'blue',
  [AudioDraftStatus.REJECTION_SUGGESTED]: 'yellow',
  [AudioDraftStatus.APPROVED]: 'green',
  [AudioDraftStatus.CORRECTIONS_NEEDED]: 'orange',
  [AudioDraftStatus.REJECTED]: 'red',
};

export function getDraftStatusLabel(status: AudioDraftStatus): string {
  return DRAFT_STATUS_LABELS[status] ?? status;
}

export function getDraftStatusColor(status: AudioDraftStatus): string {
  return DRAFT_STATUS_COLORS[status] ?? 'gray';
}

/* ── Admin role ───────────────────────────────────────────────────────── */

const ROLE_LABELS: Record<AdminRole, string> = {
  [AdminRole.SYSTEM_ADMIN]: 'Administrateur système',
  [AdminRole.PUBLISHER]: 'Éditeur',
  [AdminRole.REVIEWER]: 'Réviseur',
  [AdminRole.CONTRIBUTOR]: 'Contributeur',
};

const ROLE_COLORS: Record<AdminRole, string> = {
  [AdminRole.SYSTEM_ADMIN]: 'red',
  [AdminRole.PUBLISHER]: 'violet',
  [AdminRole.REVIEWER]: 'blue',
  [AdminRole.CONTRIBUTOR]: 'gray',
};

export function getRoleLabel(role: AdminRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function getRoleColor(role: AdminRole): string {
  return ROLE_COLORS[role] ?? 'gray';
}

/* ── Generic helpers ──────────────────────────────────────────────────── */

/**
 * Truncate a string to `maxLen` characters, appending "…" if truncated.
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

/**
 * Format a number as a compact string (e.g. 1.2K, 3.5M).
 */
export function formatCompactNumber(n: number): string {
  return Intl.NumberFormat('fr', { notation: 'compact' }).format(n);
}
