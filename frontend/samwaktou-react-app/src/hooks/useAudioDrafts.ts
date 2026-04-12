/**
 * @file useAudioDrafts.ts
 * @description TanStack Query hooks for the AudioDraft entity.
 *
 * Provides `useAudioDrafts` (list by task) and `useAudioDraft` (single),
 * plus mutation hooks for updating metadata and reviewing drafts.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import * as draftApi from '@/api/audio-draft.api';
import { ApiError } from '@/api/client';
import { taskKeys } from './useTasks';
import type {
  AudioDraft,
  AudioDraftUpdatePayload,
  AudioDraftReviewPayload,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

/* ── Query keys ───────────────────────────────────────────────────────── */

export const draftKeys = {
  all: ['audio-drafts'] as const,
  lists: () => [...draftKeys.all, 'list'] as const,
  list: (taskId: string) => [...draftKeys.lists(), taskId] as const,
  details: () => [...draftKeys.all, 'detail'] as const,
  detail: (taskId: string, draftId: string) =>
    [...draftKeys.details(), taskId, draftId] as const,
};

/* ── Query hooks ──────────────────────────────────────────────────────── */

/** Fetch all drafts for a task. */
export function useAudioDrafts(
  taskId: string | undefined,
  options?: Omit<UseQueryOptions<PaginatedResponse<AudioDraft>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: draftKeys.list(taskId!),
    queryFn: () => draftApi.getDrafts(taskId!),
    enabled: !!taskId,
    ...options,
  });
}

/** Fetch a single draft. */
export function useAudioDraft(
  taskId: string | undefined,
  draftId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<AudioDraft>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: draftKeys.detail(taskId!, draftId!),
    queryFn: () => draftApi.getDraft(taskId!, draftId!),
    enabled: !!taskId && !!draftId,
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

/** Update draft metadata (description, theme, keywords). */
export function useUpdateDraft() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      draftId,
      payload,
    }: {
      taskId: string;
      draftId: string;
      payload: AudioDraftUpdatePayload;
    }) => draftApi.updateDraft(taskId, draftId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: draftKeys.list(variables.taskId) });
      qc.invalidateQueries({
        queryKey: draftKeys.detail(variables.taskId, variables.draftId),
      });
      qc.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      notifications.show({
        title: 'Succès',
        message: 'Brouillon mis à jour.',
        color: 'green',
      });
    },
    onError: showError,
  });
}

/** Review a draft (approve, reject, request corrections, etc.). */
export function useReviewDraft() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      draftId,
      payload,
    }: {
      taskId: string;
      draftId: string;
      payload: AudioDraftReviewPayload;
    }) => draftApi.reviewDraft(taskId, draftId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: draftKeys.list(variables.taskId) });
      qc.invalidateQueries({
        queryKey: draftKeys.detail(variables.taskId, variables.draftId),
      });
      qc.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      notifications.show({
        title: 'Succès',
        message: 'Revue du brouillon enregistrée.',
        color: 'green',
      });
    },
    onError: showError,
  });
}
