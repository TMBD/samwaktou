/**
 * @file date.utils.ts
 * @description Date formatting helpers using `date-fns`.
 *
 * Centralises every date transformation so the rest of the codebase
 * never calls `date-fns` directly — making future library swaps trivial.
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Format an ISO date string to a human-readable date.
 * @example formatDate('2025-04-11T20:30:00Z') → '11 avr. 2025'
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = parseISO(isoString);
  if (!isValid(date)) return '—';
  return format(date, 'd MMM yyyy', { locale: fr });
}

/**
 * Format an ISO date string to date + time.
 * @example formatDateTime('2025-04-11T20:30:00Z') → '11 avr. 2025 à 20:30'
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = parseISO(isoString);
  if (!isValid(date)) return '—';
  return format(date, "d MMM yyyy 'à' HH:mm", { locale: fr });
}

/**
 * Relative time from now (e.g. "il y a 3 jours").
 */
export function formatRelative(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = parseISO(isoString);
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

/**
 * Format a Date object to an ISO date string (YYYY-MM-DD) for API payloads.
 */
export function toISODateString(date: Date | null | undefined): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}
