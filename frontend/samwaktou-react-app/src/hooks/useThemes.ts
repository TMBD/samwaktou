/**
 * @file useThemes.ts
 * @description TanStack Query hooks for the Theme entity.
 *
 * Provides `useThemes` (paginated list), `useTheme` (single by ID),
 * and mutation hooks for CRUD + validation operations.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import * as themeApi from '@/api/theme.api';
import { ApiError } from '@/api/client';
import type {
  Theme,
  ThemeFilters,
  ThemeCreatePayload,
  ThemeUpdatePayload,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

/* ── Query keys ───────────────────────────────────────────────────────── */

export const themeKeys = {
  all: ['themes'] as const,
  lists: () => [...themeKeys.all, 'list'] as const,
  list: (filters?: ThemeFilters) => [...themeKeys.lists(), filters] as const,
  details: () => [...themeKeys.all, 'detail'] as const,
  detail: (id: string) => [...themeKeys.details(), id] as const,
};

/* ── Query hooks ──────────────────────────────────────────────────────── */

/** Fetch a paginated list of themes. */
export function useThemes(
  filters?: ThemeFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<Theme>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: themeKeys.list(filters),
    queryFn: () => themeApi.getThemes(filters),
    ...options,
  });
}

/** Fetch a single theme by ID. */
export function useTheme(
  id: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Theme>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: themeKeys.detail(id!),
    queryFn: () => themeApi.getTheme(id!),
    enabled: !!id,
    ...options,
  });
}

/* ── Mutation helpers ─────────────────────────────────────────────────── */

function showError(err: unknown) {
  const message =
    err instanceof ApiError
      ? err.message
      : 'Une erreur inattendue s\'est produite.';
  notifications.show({ title: 'Erreur', message, color: 'red' });
}

/* ── Mutation hooks ───────────────────────────────────────────────────── */

/** Create a new theme. */
export function useCreateTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ThemeCreatePayload) => themeApi.createTheme(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: themeKeys.all });
      notifications.show({ title: 'Succès', message: 'Thème créé.', color: 'green' });
    },
    onError: showError,
  });
}

/** Update a theme. */
export function useUpdateTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ThemeUpdatePayload }) =>
      themeApi.updateTheme(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: themeKeys.all });
      notifications.show({ title: 'Succès', message: 'Thème mis à jour.', color: 'green' });
    },
    onError: showError,
  });
}

/** Validate (approve) a theme. */
export function useValidateTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => themeApi.validateTheme(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: themeKeys.all });
      notifications.show({ title: 'Succès', message: 'Thème validé.', color: 'green' });
    },
    onError: showError,
  });
}

/** Delete a theme. */
export function useDeleteTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => themeApi.deleteTheme(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: themeKeys.all });
      notifications.show({ title: 'Succès', message: 'Thème supprimé.', color: 'green' });
    },
    onError: showError,
  });
}
