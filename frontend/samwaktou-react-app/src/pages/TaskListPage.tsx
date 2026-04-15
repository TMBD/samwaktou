/**
 * @file TaskListPage.tsx
 * @description Admin page listing all tasks with filtering, pagination,
 * and quick-action buttons.
 *
 * Features:
 * - Filter by status and session author (via `TaskFilters` component).
 * - Paginated table with sortable columns.
 * - Click a row to navigate to the task detail page.
 * - "New task" button (visible to PUBLISHER+).
 * - Content-state progress bar per row.
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Group,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useAdminMap } from '@/hooks/useAdminMap';
import { AdminRole, type TaskFilters as TaskFiltersType } from '@/types';
import { formatDate, formatRelative } from '@/utils/date.utils';
import { TaskStatusBadge } from '@/components/task/TaskStatusBadge';
import { TaskProgressBar } from '@/components/task/TaskProgressBar';
import { TaskFilters } from '@/components/task/TaskFilters';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { EmptyState } from '@/components/common/EmptyState';

/* ── Constants ────────────────────────────────────────────────────────── */

const PAGE_SIZE = 15;

/* ── Component ────────────────────────────────────────────────────────── */

export function TaskListPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  /* ── Filter state ─────────────────────────────────────────────────── */
  const [filters, setFilters] = useState<TaskFiltersType>({
    page: 1,
    limit: PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  /* ── Data fetching ────────────────────────────────────────────────── */
  const { data, isLoading, isError } = useTasks(filters);
  const { resolveAdmin, resolveAdminInfo } = useAdminMap();

  const tasks = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const handlePageChange = useCallback(
    (page: number) => setFilters((prev) => ({ ...prev, page })),
    [],
  );

  const handleRowClick = useCallback(
    (taskId: string) => navigate(`/admin/tasks/${taskId}`),
    [navigate],
  );

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <Title order={2}>Tâches</Title>
        {hasRole(AdminRole.PUBLISHER) && (
          <Button
            leftSection={<IconPlus size={16} stroke={1.5} />}
            onClick={() => navigate('/admin/tasks/new')}
          >
            Nouvelle tâche
          </Button>
        )}
      </Group>

      {/* Filters */}
      <TaskFilters filters={filters} onChange={setFilters} />

      {/* Table */}
      <Paper pos="relative" p={0}>
        <LoadingOverlay visible={isLoading} />

        {isError && (
          <Text c="red" ta="center" py="xl">
            Impossible de charger les tâches. Veuillez réessayer.
          </Text>
        )}

        {!isLoading && !isError && tasks.length === 0 && (
          <EmptyState
            title="Aucune tâche trouvée"
            description="Modifiez vos filtres ou créez une nouvelle tâche."
            action={
              hasRole(AdminRole.PUBLISHER) ? (
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => navigate('/admin/tasks/new')}
                >
                  Créer une tâche
                </Button>
              ) : undefined
            }
          />
        )}

        {tasks.length > 0 && (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Description</Table.Th>
                <Table.Th>Auteur</Table.Th>
                <Table.Th>Date session</Table.Th>
                <Table.Th>Assigné à</Table.Th>
                <Table.Th>Statut</Table.Th>
                <Table.Th>Progression</Table.Th>
                <Table.Th>Mis à jour</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tasks.map((task) => (
                <Table.Tr
                  key={task.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(task.id)}
                >
                  <Table.Td maw={280}>
                    <Text size="sm" truncate fw={500}>
                      {task.description}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{task.sessionAuthor}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(task.sessionDate)}</Text>
                  </Table.Td>
                  <Table.Td>
                    {task.assignee ? (
                      <Tooltip label={resolveAdminInfo(task.assignee)?.email ?? ''}>
                        <Text size="sm">{resolveAdmin(task.assignee)}</Text>
                      </Tooltip>
                    ) : (
                      <Text size="xs" c="dimmed" fs="italic">Non assigné</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <TaskStatusBadge status={task.status} />
                  </Table.Td>
                  <Table.Td w={180}>
                    <TaskProgressBar contentState={task.contentState} />
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={formatDate(task.updatedAt)}>
                      <Text size="xs" c="dimmed">
                        {formatRelative(task.updatedAt)}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination
            total={totalPages}
            value={filters.page ?? 1}
            onChange={handlePageChange}
          />
        </Group>
      )}
    </Stack>
  );
}
