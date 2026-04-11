/**
 * @file TaskProgressBar.tsx
 * @description Visual progress indicator for a task's content state.
 *
 * Renders a segmented Mantine `Progress` bar showing what fraction
 * of audio drafts are approved, done, pending, need corrections, or
 * are rejected.  A compact legend is shown below.
 */

import { Group, Progress, Text, Tooltip } from '@mantine/core';
import type { ContentState } from '@/types';

interface TaskProgressBarProps {
  contentState: ContentState;
}

export function TaskProgressBar({ contentState }: TaskProgressBarProps) {
  const { total, approved, done, pending, correctionNeeded, rejected } = contentState;

  /* Avoid division by zero when the task has no drafts. */
  if (total === 0) {
    return (
      <Text size="xs" c="dimmed">
        Aucun brouillon
      </Text>
    );
  }

  const pct = (n: number) => (n / total) * 100;

  return (
    <>
      <Progress.Root size="lg">
        <Tooltip label={`Approuvé : ${approved}`}>
          <Progress.Section value={pct(approved)} color="green" />
        </Tooltip>
        <Tooltip label={`Terminé : ${done}`}>
          <Progress.Section value={pct(done)} color="blue" />
        </Tooltip>
        <Tooltip label={`En attente : ${pending}`}>
          <Progress.Section value={pct(pending)} color="gray" />
        </Tooltip>
        <Tooltip label={`Corrections : ${correctionNeeded}`}>
          <Progress.Section value={pct(correctionNeeded)} color="orange" />
        </Tooltip>
        <Tooltip label={`Rejeté : ${rejected}`}>
          <Progress.Section value={pct(rejected)} color="red" />
        </Tooltip>
      </Progress.Root>

      {/* Compact legend */}
      <Group gap="xs" mt={4}>
        <Text size="xs" c="dimmed">
          {approved}/{total} approuvé(s)
        </Text>
        {correctionNeeded > 0 && (
          <Text size="xs" c="orange">
            {correctionNeeded} correction(s)
          </Text>
        )}
        {rejected > 0 && (
          <Text size="xs" c="red">
            {rejected} rejeté(s)
          </Text>
        )}
      </Group>
    </>
  );
}
