/**
 * @file useAuth.ts
 * @description Convenience hook for consuming the AuthContext.
 *
 * Throws a clear error if used outside an `<AuthProvider>`, making
 * debugging straightforward during development.
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/contexts/AuthContext';

/**
 * Access the current authentication state and helpers.
 *
 * @example
 * const { user, isAuthenticated, hasRole, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuth() must be used inside an <AuthProvider>. ' +
      'Wrap your component tree with <AuthProvider> in main.tsx.',
    );
  }
  return ctx;
}
