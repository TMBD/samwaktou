/**
 * @file AuthContext.tsx
 * @description React Context for authentication state management.
 *
 * Stores the authenticated admin's profile and JWT token in both
 * React state and localStorage so the session survives page refreshes.
 *
 * Usage:
 *   Wrap the app with `<AuthProvider>` in `main.tsx`.
 *   Consume via `useAuth()` in any component.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AUTH_STORAGE_KEY } from '@/api/client';
import type { AuthUser } from '@/types';
import { AdminRole, ROLE_HIERARCHY } from '@/types';

/* ── Context shape ────────────────────────────────────────────────────── */

export interface AuthContextValue {
  /** The currently authenticated user, or `null` if not logged in. */
  user: AuthUser | null;

  /** Whether the initial hydration from localStorage is complete. */
  isReady: boolean;

  /** Whether a user is currently logged in. */
  isAuthenticated: boolean;

  /** Persist user data after a successful login. */
  login: (user: AuthUser) => void;

  /** Clear all auth state and redirect to login page. */
  logout: () => void;

  /**
   * Check whether the current user has at least the given role.
   * Returns `false` if not authenticated.
   */
  hasRole: (minimumRole: AdminRole) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  /* Hydrate from localStorage on mount (survives page refresh). */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed.token && parsed.id && parsed.role) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  /* ── login ────────────────────────────────────────────────────────── */
  const login = useCallback((authUser: AuthUser) => {
    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
  }, []);

  /* ── logout ───────────────────────────────────────────────────────── */
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Redirect handled by the router guard, but force it as safety net.
    window.location.href = '/login';
  }, []);

  /* ── hasRole ──────────────────────────────────────────────────────── */
  const hasRole = useCallback(
    (minimumRole: AdminRole): boolean => {
      if (!user) return false;
      return ROLE_HIERARCHY[user.role] <= ROLE_HIERARCHY[minimumRole];
    },
    [user],
  );

  /* ── Memoised context value ───────────────────────────────────────── */
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: user !== null,
      login,
      logout,
      hasRole,
    }),
    [user, isReady, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
