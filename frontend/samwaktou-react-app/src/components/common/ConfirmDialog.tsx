/**
 * @file ConfirmDialog.tsx
 * @description Reusable confirmation modal for destructive or important actions.
 *
 * Wraps Mantine's `<Modal>` with confirm / cancel buttons and a
 * customisable message.  The caller controls visibility via `opened`.
 */

import { Button, Group, Modal, Text } from '@mantine/core';

interface ConfirmDialogProps {
  /** Whether the modal is open. */
  opened: boolean;
  /** Called when the user cancels or closes the modal. */
  onClose: () => void;
  /** Called when the user confirms the action. */
  onConfirm: () => void;
  /** Modal title. */
  title: string;
  /** Body message displayed inside the modal. */
  message: string;
  /** Label for the confirm button (default: "Confirmer"). */
  confirmLabel?: string;
  /** Mantine color for the confirm button (default: "red"). */
  confirmColor?: string;
  /** Whether the confirm action is currently loading. */
  loading?: boolean;
}

export function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  confirmColor = 'red',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Text size="sm" mb="lg">
        {message}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button color={confirmColor} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
