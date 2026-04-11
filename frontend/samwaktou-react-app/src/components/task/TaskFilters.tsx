/**
 * @file TaskFilters.tsx
 * @description Filter bar for the task list page.
 *
 * Allows filtering tasks by status, assignee, and free-text search.
 * All filter values are lifted to the parent via `onChange` so the
 * parent can pass them to the `useTasks` query hook.
 */

import { useCallback } from 'react';
import { Group, Select } from '@mantine/core';
import { TaskStatus } from '@/types';
import type { TaskFilters as TaskFiltersType } from '@/types';
import { getTaskStatusLabel } from '@/utils/format.utils';
import { SearchBar } from '@/components/common/SearchBar';

interface TaskFiltersProps {
  /** Current filter values. */
  filters: TaskFiltersType;
  /** Called when any filter value changes. */
  onChange: (filters: TaskFiltersType) => void;
}

/** Build Select data from the TaskStatus enum. */
const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  ...Object.values(TaskStatus).map((s) => ({
    value: s,
    label: getTaskStatusLabel(s),
  })),
];

export function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  const handleStatusChange = useCallback(
    (value: string | null) => {
      onChange({
        ...filters,
        status: (value || undefined) as TaskStatus | undefined,
        page: 1,
      });
    },
    [filters, onChange],
  );

  const handleSearch = useCallback(
    (value: string) => {
      onChange({
        ...filters,
        sessionAuthor: value || undefined,
        page: 1,
      });
    },
    [filters, onChange],
  );

  return (
    <Group gap="sm">
      <Select
        data={STATUS_OPTIONS}
        value={filters.status ?? ''}
        onChange={handleStatusChange}
        placeholder="Statut"
        clearable={false}
        w={200}
      />
      <SearchBar
        onChange={handleSearch}
        placeholder="Rechercher par auteur…"
        w={250}
      />
    </Group>
  );
}
