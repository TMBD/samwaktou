/**
 * @file DraftStatusBadge.tsx
 * @description Coloured badge displaying the human-readable audio-draft status.
 */

import { Badge, type BadgeProps } from '@mantine/core';
import type { AudioDraftStatus } from '@/types';
import { getDraftStatusLabel, getDraftStatusColor } from '@/utils/format.utils';

interface DraftStatusBadgeProps extends Omit<BadgeProps, 'color' | 'children'> {
  status: AudioDraftStatus;
}

export function DraftStatusBadge({ status, ...rest }: DraftStatusBadgeProps) {
  return (
    <Badge color={getDraftStatusColor(status)} variant="light" {...rest}>
      {getDraftStatusLabel(status)}
    </Badge>
  );
}
