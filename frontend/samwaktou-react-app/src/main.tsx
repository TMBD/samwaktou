/**
 * @file main.tsx
 * @description Application entry point — Phase 3 rewrite.
 *
 * Wires together:
 *   - MantineProvider  (theme + CSS)
 *   - QueryClientProvider (TanStack Query)
 *   - AuthProvider     (auth context)
 *   - React Router 7   (data-mode routes)
 *   - Notifications    (Mantine toast system)
 *
 * Route structure:
 *   /login                → LoginPage       (public)
 *   /admin/*              → AuthGuard → AdminLayout
 *     /admin/dashboard    → DashboardPage
 *     /admin/tasks        → TaskListPage       (placeholder)
 *     /admin/tasks/new    → TaskCreatePage      (placeholder)
 *     /admin/tasks/:id    → TaskDetailPage      (placeholder)
 *     /admin/themes       → ThemeManagementPage (placeholder)
 *     /admin/admins       → AdminManagementPage (placeholder)
 *   /                     → redirect → /admin/dashboard
 *   *                     → redirect → /admin/dashboard
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/* Mantine required CSS */
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

/* App-level providers & components */
import { theme } from '@/styles/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';

/* Pages */
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TaskListPage } from '@/pages/TaskListPage';
import { TaskCreatePage } from '@/pages/TaskCreatePage';
import { TaskDetailPage } from '@/pages/TaskDetailPage';
import { ThemeManagementPage } from '@/pages/ThemeManagementPage';
import { AdminManagementPage } from '@/pages/AdminManagementPage';
import { AudioDraftWorkPage } from '@/pages/AudioDraftWorkPage';
import { AuthorManagementPage } from '@/pages/AuthorManagementPage';

/* ── TanStack Query client ────────────────────────────────────────────── */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 minute before data is considered stale
      retry: 1,                   // retry failed queries once
      refetchOnWindowFocus: false, // avoid noisy re-fetches during dev
    },
  },
});

/* ── Router ───────────────────────────────────────────────────────────── */

const router = createBrowserRouter([
  /* Public routes */
  {
    path: '/login',
    element: <LoginPage />,
  },

  /* Protected admin routes — wrapped in AuthGuard + AdminLayout */
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/dashboard', element: <DashboardPage /> },

          /* Task routes */
          { path: '/admin/tasks', element: <TaskListPage /> },
          { path: '/admin/tasks/new', element: <TaskCreatePage /> },
          { path: '/admin/tasks/:taskId', element: <TaskDetailPage /> },
          { path: '/admin/tasks/:taskId/drafts/:draftId', element: <AudioDraftWorkPage /> },

          /* Theme & Admin management */
          { path: '/admin/themes', element: <ThemeManagementPage /> },
          { path: '/admin/authors', element: <AuthorManagementPage /> },
          { path: '/admin/admins', element: <AdminManagementPage /> },
        ],
      },
    ],
  },

  /* Catch-all redirects */
  { path: '/', element: <Navigate to="/admin/dashboard" replace /> },
  { path: '*', element: <Navigate to="/admin/dashboard" replace /> },
]);

/* ── Mount ─────────────────────────────────────────────────────────────── */

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);