/**
 * @file useAdmins.ts
 * @description TanStack Query hooks for the Admin entity.
 *
 * Provides `useAdmins` (list all), `useAdmin` (single by ID),
 * and mutation hooks for CRUD operations on admin accounts.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import * as adminApi from '@/api/admin.api';
import { ApiError } from '@/api/client';
import type {
  Admin,
  AdminCreatePayload,
  AdminUpdatePayload,
  AdminPasswordPayload,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

/* ── Query keys ───────────────────────────────────────────────────────── */

export const adminKeys = {
  all: ['admins'] as const,
  lists: () => [...adminKeys.all, 'list'] as const,
  list: () => [...adminKeys.lists()] as const,
  details: () => [...adminKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminKeys.details(), id] as const,
  me: () => [...adminKeys.all, 'me'] as const,
};

/* ── Query hooks ──────────────────────────────────────────────────────── */

/** Fetch all admins. */
export function useAdmins(
  options?: Omit<UseQueryOptions<PaginatedResponse<Admin>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminKeys.list(),
    queryFn: () => adminApi.getAdmins(),
    ...options,
  });
}

/** Fetch a single admin by ID. */
export function useAdmin(
  id: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Admin>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminKeys.detail(id!),
    queryFn: () => adminApi.getAdmin(id!),
    enabled: !!id,
    ...options,
  });
}

/** Fetch the current admin's profile. */
export function useMe(
  options?: Omit<UseQueryOptions<ApiResponse<Admin>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminKeys.me(),
    queryFn: () => adminApi.getMe(),
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

/** Create a new admin. */
export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminCreatePayload) => adminApi.createAdmin(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
      notifications.show({ title: 'Succès', message: 'Administrateur créé.', color: 'green' });
    },
    onError: showError,
  });
}

/** Update an admin. */
export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminUpdatePayload }) =>
      adminApi.updateAdmin(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
      notifications.show({ title: 'Succès', message: 'Administrateur mis à jour.', color: 'green' });
    },
    onError: showError,
  });
}

/** Change an admin's password. */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminPasswordPayload }) =>
      adminApi.updatePassword(id, payload),
    onSuccess: () => {
      notifications.show({ title: 'Succès', message: 'Mot de passe modifié.', color: 'green' });
    },
    onError: showError,
  });
}

/** Delete an admin. */
export function useDeleteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAdmin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
      notifications.show({ title: 'Succès', message: 'Administrateur supprimé.', color: 'green' });
    },
    onError: showError,
  });
}
