/**
 * @file LoadingOverlay.tsx
 * @description Full-page or inline loading indicator.
 *
 * Wraps Mantine's `<LoadingOverlay>` with sensible defaults and an
 * optional "full-page" mode that covers the viewport.
 */

import { Center, Loader, LoadingOverlay as MantineOverlay } from '@mantine/core';

interface LoadingOverlayProps {
  /** Whether the overlay is visible. */
  visible: boolean;
  /** If true, renders a centered spinner instead of an overlay. */
  inline?: boolean;
}

/**
 * Renders either a Mantine LoadingOverlay (for containers with
 * `position: relative`) or a standalone centered spinner.
 */
export function LoadingOverlay({ visible, inline }: LoadingOverlayProps) {
  if (inline) {
    return visible ? (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    ) : null;
  }

  return <MantineOverlay visible={visible} overlayProps={{ blur: 2 }} />;
}
