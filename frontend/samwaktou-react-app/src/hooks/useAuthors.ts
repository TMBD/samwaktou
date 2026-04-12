/**
 * @file useAuthors.ts
 * @description TanStack Query hooks for the Author entity.
 *
 * Provides `useAuthors` (paginated list), `useAuthor` (single by ID),
 * and mutation hooks for CRUD operations.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import * as authorApi from '@/api/author.api';
import { ApiError } from '@/api/client';
import type {
  Author,
  AuthorFilters,
  AuthorCreatePayload,
  AuthorUpdatePayload,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

/* ── Query keys ───────────────────────────────────────────────────────── */

export const authorKeys = {
  all: ['authors'] as const,
  lists: () => [...authorKeys.all, 'list'] as const,
  list: (filters?: AuthorFilters) => [...authorKeys.lists(), filters] as const,
  details: () => [...authorKeys.all, 'detail'] as const,
  detail: (id: string) => [...authorKeys.details(), id] as const,
};

/* ── Query hooks ──────────────────────────────────────────────────────── */

/** Fetch a paginated list of authors. */
export function useAuthors(
  filters?: AuthorFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<Author>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: authorKeys.list(filters),
    queryFn: () => authorApi.getAuthors(filters),
    ...options,
  });
}

/** Fetch a single author by ID. */
export function useAuthor(
  id: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Author>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: authorKeys.detail(id!),
    queryFn: () => authorApi.getAuthor(id!),
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

/** Create a new author. */
export function useCreateAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AuthorCreatePayload) => authorApi.createAuthor(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorKeys.all });
      notifications.show({ title: 'Succès', message: 'Auteur créé.', color: 'green' });
    },
    onError: showError,
  });
}

/** Update an author. */
export function useUpdateAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AuthorUpdatePayload }) =>
      authorApi.updateAuthor(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorKeys.all });
      notifications.show({ title: 'Succès', message: 'Auteur mis à jour.', color: 'green' });
    },
    onError: showError,
  });
}

/** Delete an author. */
export function useDeleteAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authorApi.deleteAuthor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorKeys.all });
      notifications.show({ title: 'Succès', message: 'Auteur supprimé.', color: 'green' });
    },
    onError: showError,
  });
}
