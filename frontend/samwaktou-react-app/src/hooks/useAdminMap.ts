/**
 * @file useAdminMap.ts
 * @description Utility hook that fetches the admin list once and provides
 * a lookup map from admin ID → display label.
 *
 * The display label is "Surname Name" with the email available separately
 * so callers can show it in a tooltip for disambiguation.
 */

import { useMemo } from 'react';
import { useAdmins } from './useAdmins';

export interface AdminInfo {
  /** "Surname Name" */
  displayName: string;
  email: string;
}

/**
 * Returns a `Map<string, AdminInfo>` keyed by admin ID.
 *
 * The data comes from `useAdmins` which is cached by TanStack Query,
 * so calling this hook from multiple components won't cause extra fetches.
 */
export function useAdminMap() {
  const { data: adminsRes, isLoading } = useAdmins();
  const admins = adminsRes?.data ?? [];

  const map = useMemo(() => {
    const m = new Map<string, AdminInfo>();
    for (const a of admins) {
      m.set(a.id, {
        displayName: `${a.surname} ${a.name}`.trim(),
        email: a.email,
      });
    }
    return m;
  }, [admins]);

  /** Resolve an ID to a display name, with fallback. */
  const resolveAdmin = (id: string | null | undefined): string => {
    if (!id) return '— non assigné —';
    const info = map.get(id);
    return info ? info.displayName : id;
  };

  /** Resolve an ID and get full info for tooltip usage. */
  const resolveAdminInfo = (id: string | null | undefined): AdminInfo | null => {
    if (!id) return null;
    return map.get(id) ?? null;
  };

  return { map, resolveAdmin, resolveAdminInfo, isLoading };
}
