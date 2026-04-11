/**
 * @file ThemeManagementPage.tsx
 * @description Admin page for managing audio themes (CRUD + validation).
 *
 * Features:
 * - Table listing all themes with name, description, validation status.
 * - Inline create / edit modal.
 * - Validate and delete actions.
 * - Role-gated: REVIEWER+ can view, SYSTEM_ADMIN can delete.
 */

import { useCallback, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useThemes,
  useCreateTheme,
  useUpdateTheme,
  useValidateTheme,
  useDeleteTheme,
} from '@/hooks/useThemes';
import { AdminRole } from '@/types';
import type { Theme, ThemeCreatePayload, ThemeUpdatePayload } from '@/types';
import { formatDate } from '@/utils/date.utils';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

/* ── Form values ──────────────────────────────────────────────────────── */

interface ThemeFormValues {
  name: string;
  description: string;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function ThemeManagementPage() {
  const { hasRole } = useAuth();

  /* ── Data ──────────────────────────────────────────────────────────── */
  const { data, isLoading, isError } = useThemes();
  const themes = data?.data ?? [];

  /* ── Mutations ─────────────────────────────────────────────────────── */
  const createMut = useCreateTheme();
  const updateMut = useUpdateTheme();
  const validateMut = useValidateTheme();
  const deleteMut = useDeleteTheme();

  /* ── Local UI state ────────────────────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Theme | null>(null);

  /* ── Form ──────────────────────────────────────────────────────────── */
  const form = useForm<ThemeFormValues>({
    initialValues: { name: '', description: '' },
    validate: {
      name: (v) => (v.trim().length < 2 ? 'Le nom est trop court (min 2 car.)' : null),
    },
  });

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const openCreate = useCallback(() => {
    setEditingTheme(null);
    form.reset();
    setModalOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (theme: Theme) => {
      setEditingTheme(theme);
      form.setValues({ name: theme.name, description: theme.description ?? '' });
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmitForm = useCallback(
    (values: ThemeFormValues) => {
      if (editingTheme) {
        const payload: ThemeUpdatePayload = {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
        };
        updateMut.mutate(
          { id: editingTheme.id, payload },
          { onSuccess: () => setModalOpen(false) },
        );
      } else {
        const payload: ThemeCreatePayload = {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
        };
        createMut.mutate(payload, { onSuccess: () => setModalOpen(false) });
      }
    },
    [editingTheme, createMut, updateMut],
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }, [deleteTarget, deleteMut]);

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Gestion des thèmes</Title>
        <Button leftSection={<IconPlus size={16} stroke={1.5} />} onClick={openCreate}>
          Nouveau thème
        </Button>
      </Group>

      <Paper pos="relative" p={0}>
        <LoadingOverlay visible={isLoading} />

        {isError && (
          <Text c="red" ta="center" py="xl">
            Impossible de charger les thèmes.
          </Text>
        )}

        {!isLoading && !isError && themes.length === 0 && (
          <EmptyState
            title="Aucun thème"
            description="Créez votre premier thème pour organiser les contenus audio."
          />
        )}

        {themes.length > 0 && (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nom</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Statut</Table.Th>
                <Table.Th>Créé le</Table.Th>
                <Table.Th w={120}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {themes.map((theme) => (
                <Table.Tr key={theme.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{theme.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" truncate maw={300}>
                      {theme.description || '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={theme.isValidated ? 'green' : 'yellow'}
                      variant="light"
                    >
                      {theme.isValidated ? 'Validé' : 'En attente'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(theme.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {/* Edit */}
                      <Tooltip label="Modifier">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => openEdit(theme)}
                        >
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>

                      {/* Validate */}
                      {!theme.isValidated && hasRole(AdminRole.REVIEWER) && (
                        <Tooltip label="Valider">
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            onClick={() => validateMut.mutate(theme.id)}
                            loading={validateMut.isPending}
                          >
                            <IconCheck size={16} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      )}

                      {/* Delete (SysAdmin only) */}
                      {hasRole(AdminRole.SYSTEM_ADMIN) && (
                        <Tooltip label="Supprimer">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => setDeleteTarget(theme)}
                          >
                            <IconTrash size={16} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* ── Create / Edit modal ──────────────────────────────────────── */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTheme ? 'Modifier le thème' : 'Nouveau thème'}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmitForm)}>
          <Stack gap="sm">
            <TextInput
              label="Nom"
              placeholder="Nom du thème"
              {...form.getInputProps('name')}
            />
            <Textarea
              label="Description"
              placeholder="Description optionnelle"
              minRows={2}
              {...form.getInputProps('description')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                loading={createMut.isPending || updateMut.isPending}
              >
                {editingTheme ? 'Enregistrer' : 'Créer'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      <ConfirmDialog
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le thème"
        message={`Êtes-vous sûr de vouloir supprimer le thème « ${deleteTarget?.name ?? ''} » ?`}
        confirmLabel="Supprimer"
        loading={deleteMut.isPending}
      />
    </Stack>
  );
}
