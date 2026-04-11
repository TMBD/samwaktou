/**
 * @file EmptyState.tsx
 * @description Placeholder displayed when a list or table has no data.
 *
 * Shows a centred icon, title, and optional description + action button.
 */

import { Center, Stack, Text, ThemeIcon, type MantineColor } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Primary message (e.g. "Aucune tâche trouvée"). */
  title: string;
  /** Optional secondary description. */
  description?: string;
  /** Optional action button or link. */
  action?: ReactNode;
  /** Icon colour (default: "gray"). */
  color?: MantineColor;
}

export function EmptyState({
  title,
  description,
  action,
  color = 'gray',
}: EmptyStateProps) {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs">
        <ThemeIcon variant="light" size={56} radius="xl" color={color}>
          <IconInbox size={28} stroke={1.5} />
        </ThemeIcon>
        <Text fw={500} size="lg">
          {title}
        </Text>
        {description && (
          <Text size="sm" c="dimmed" ta="center" maw={360}>
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Center>
  );
}
