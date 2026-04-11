/**
 * @file AudioPlayer.tsx
 * @description Simple HTML5 audio player for streaming draft audio files.
 *
 * Builds the stream URL from the task/draft IDs using the API helper
 * and renders a native `<audio>` element with controls.
 */

import { Card, Group, Text } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import { getDraftStreamUrl } from '@/api/audio-draft.api';

interface AudioPlayerProps {
  /** Parent task ID. */
  taskId: string;
  /** Draft ID to stream. */
  draftId: string;
  /** Original file name (displayed as label). */
  fileName?: string;
}

export function AudioPlayer({ taskId, draftId, fileName }: AudioPlayerProps) {
  const streamUrl = getDraftStreamUrl(taskId, draftId);

  return (
    <Card p="sm" withBorder>
      <Group gap="xs" mb="xs">
        <IconPlayerPlay size={16} stroke={1.5} />
        <Text size="sm" fw={500} truncate>
          {fileName ?? 'Audio'}
        </Text>
      </Group>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls preload="metadata" style={{ width: '100%' }}>
        <source src={streamUrl} />
        Votre navigateur ne supporte pas la lecture audio.
      </audio>
    </Card>
  );
}
