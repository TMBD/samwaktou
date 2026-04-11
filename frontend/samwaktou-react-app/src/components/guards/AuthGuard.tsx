/**
 * @file AuthGuard.tsx
 * @description Route guard that redirects unauthenticated users to `/login`.
 *
 * Wrap any `<Route>` element with this component so that only
 * authenticated admins can access the child routes.
 *
 * While the auth context is still hydrating from localStorage the guard
 * renders a centered loader to avoid a flash of the login page.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';

export function AuthGuard() {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  /* Still loading auth state from localStorage — show spinner. */
  if (!isReady) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  /* Not authenticated — redirect to login, preserving intended URL. */
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /* Authenticated — render the child route. */
  return <Outlet />;
}
