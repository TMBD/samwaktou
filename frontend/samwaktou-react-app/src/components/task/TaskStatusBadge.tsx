/**
 * @file TaskStatusBadge.tsx
 * @description Coloured badge displaying the human-readable task status.
 *
 * Uses the label/colour mappings from `format.utils` so every part of
 * the UI renders consistent status indicators.
 */

import { Badge, type BadgeProps } from '@mantine/core';
import type { TaskStatus } from '@/types';
import { getTaskStatusLabel, getTaskStatusColor } from '@/utils/format.utils';

interface TaskStatusBadgeProps extends Omit<BadgeProps, 'color' | 'children'> {
  status: TaskStatus;
}

export function TaskStatusBadge({ status, ...rest }: TaskStatusBadgeProps) {
  return (
    <Badge color={getTaskStatusColor(status)} variant="light" {...rest}>
      {getTaskStatusLabel(status)}
    </Badge>
  );
}
