/**
 * @file useTasks.ts
 * @description TanStack Query hooks for the Task entity.
 *
 * Provides `useTasks` (list with filters) and `useTask` (single by ID),
 * plus mutation hooks for every task state transition.
 *
 * All hooks automatically invalidate the relevant query cache on mutation
 * success so the UI stays in sync without manual refetches.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import * as taskApi from '@/api/task.api';
import { ApiError } from '@/api/client';
import type {
  Task,
  TaskFilters,
  TaskRejectPayload,
  TaskReassignPayload,
  TaskSuggestRejectionPayload,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

/* ── Query keys ───────────────────────────────────────────────────────── */

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  activityLog: (id: string) => [...taskKeys.detail(id), 'activity-log'] as const,
};

/* ── Query hooks ──────────────────────────────────────────────────────── */

/** Fetch a paginated list of tasks. */
export function useTasks(
  filters?: TaskFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<Task>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskApi.getTasks(filters),
    ...options,
  });
}

/** Fetch a single task by ID. */
export function useTask(
  taskId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Task>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: taskKeys.detail(taskId!),
    queryFn: () => taskApi.getTask(taskId!),
    enabled: !!taskId,
    ...options,
  });
}

/** Fetch the activity log for a task. */
export function useTaskActivityLog(taskId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.activityLog(taskId!),
    queryFn: () => taskApi.getTaskActivityLog(taskId!),
    enabled: !!taskId,
  });
}

/* ── Mutation helpers ─────────────────────────────────────────────────── */

/** Show a Mantine error notification from an `ApiError`. */
function showError(err: unknown) {
  const message =
    err instanceof ApiError
      ? err.message
      : 'Une erreur inattendue s\'est produite.';
  notifications.show({ title: 'Erreur', message, color: 'red' });
}

/**
 * Factory for simple task state-transition mutations (no payload).
 * On success: invalidate task queries + show a success notification.
 */
function useTaskTransition(
  apiFn: (id: string) => Promise<ApiResponse<Task>>,
  successMessage: string,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => apiFn(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      notifications.show({ title: 'Succès', message: successMessage, color: 'green' });
    },
    onError: showError,
  });
}

/* ── Mutation hooks ───────────────────────────────────────────────────── */

/** Create a new task (with audio files). */
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: Parameters<typeof taskApi.createTask>[0]; files: File[] }) =>
      taskApi.createTask(payload, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      notifications.show({ title: 'Succès', message: 'Tâche créée avec succès.', color: 'green' });
    },
    onError: showError,
  });
}

/** Self-assign a task. */
export function useAssignTask() {
  return useTaskTransition(taskApi.assignTask, 'Tâche assignée.');
}

/** Unassign a task → OPEN. */
export function useUnassignTask() {
  return useTaskTransition(taskApi.unassignTask, 'Tâche désassignée.');
}

/** Submit task for review → READY_FOR_REVIEW. */
export function useSubmitTask() {
  return useTaskTransition(taskApi.submitTask, 'Tâche soumise pour revue.');
}

/** Pick task for review → IN_REVIEW. */
export function usePickTaskForReview() {
  return useTaskTransition(taskApi.pickTaskForReview, 'Tâche prise en revue.');
}

/** Approve task → APPROVED. */
export function useApproveTask() {
  return useTaskTransition(taskApi.approveTask, 'Tâche approuvée.');
}

/** Request corrections on a task. */
export function useRequestCorrections() {
  return useTaskTransition(taskApi.requestCorrections, 'Corrections demandées.');
}

/** Publish task → PUBLISHED. */
export function usePublishTask() {
  return useTaskTransition(taskApi.publishTask, 'Tâche publiée avec succès.');
}

/** Unpublish task → APPROVED. */
export function useUnpublishTask() {
  return useTaskTransition(taskApi.unpublishTask, 'Tâche dépubliée.');
}

/** Delete a task. */
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => taskApi.deleteTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      notifications.show({ title: 'Succès', message: 'Tâche supprimée.', color: 'green' });
    },
    onError: showError,
  });
}

/** Reassign a task to another admin. */
export function useReassignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: TaskReassignPayload }) =>
      taskApi.reassignTask(taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      notifications.show({ title: 'Succès', message: 'Tâche réassignée.', color: 'green' });
    },
    onError: showError,
  });
}

/** Reject a task. */
export function useRejectTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: TaskRejectPayload }) =>
      taskApi.rejectTask(taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      notifications.show({ title: 'Succès', message: 'Tâche rejetée.', color: 'green' });
    },
    onError: showError,
  });
}

/** Suggest rejection (contributor). */
export function useSuggestRejection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: TaskSuggestRejectionPayload }) =>
      taskApi.suggestRejection(taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      notifications.show({ title: 'Succès', message: 'Suggestion de rejet envoyée.', color: 'green' });
    },
    onError: showError,
  });
}
