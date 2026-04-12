/**
 * @file AuthorManagementPage.tsx
 * @description Admin page for managing session authors (CRUD).
 *
 * Features:
 * - Table listing all authors with name, description, creation date.
 * - Inline create / edit modal.
 * - Delete action.
 * - Role-gated: REVIEWER+ can manage authors.
 */

import { useCallback, useState } from 'react';
import {
  ActionIcon,
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
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import {
  useAuthors,
  useCreateAuthor,
  useUpdateAuthor,
  useDeleteAuthor,
} from '@/hooks/useAuthors';
import type { Author, AuthorCreatePayload, AuthorUpdatePayload } from '@/types';
import { formatDate } from '@/utils/date.utils';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

/* ── Form values ──────────────────────────────────────────────────────── */

interface AuthorFormValues {
  name: string;
  description: string;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function AuthorManagementPage() {
  /* ── Data ──────────────────────────────────────────────────────────── */
  const { data, isLoading, isError } = useAuthors({ limit: 200 });
  const authors = data?.data ?? [];

  /* ── Mutations ─────────────────────────────────────────────────────── */
  const createMut = useCreateAuthor();
  const updateMut = useUpdateAuthor();
  const deleteMut = useDeleteAuthor();

  /* ── Local UI state ────────────────────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null);

  /* ── Form ──────────────────────────────────────────────────────────── */
  const form = useForm<AuthorFormValues>({
    initialValues: { name: '', description: '' },
    validate: {
      name: (v) => (v.trim().length < 2 ? 'Le nom est trop court (min 2 car.)' : null),
    },
  });

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const openCreate = useCallback(() => {
    setEditingAuthor(null);
    form.reset();
    setModalOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (author: Author) => {
      setEditingAuthor(author);
      form.setValues({ name: author.name, description: author.description ?? '' });
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmitForm = useCallback(
    (values: AuthorFormValues) => {
      if (editingAuthor) {
        const payload: AuthorUpdatePayload = {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
        };
        updateMut.mutate(
          { id: editingAuthor.id, payload },
          { onSuccess: () => setModalOpen(false) },
        );
      } else {
        const payload: AuthorCreatePayload = {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
        };
        createMut.mutate(payload, { onSuccess: () => setModalOpen(false) });
      }
    },
    [editingAuthor, createMut, updateMut],
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
        <Title order={2}>Gestion des auteurs</Title>
        <Button leftSection={<IconPlus size={16} stroke={1.5} />} onClick={openCreate}>
          Nouvel auteur
        </Button>
      </Group>

      <Paper pos="relative" p={0}>
        <LoadingOverlay visible={isLoading} />

        {isError && (
          <Text c="red" ta="center" py="xl">
            Impossible de charger les auteurs.
          </Text>
        )}

        {!isLoading && !isError && authors.length === 0 && (
          <EmptyState
            title="Aucun auteur"
            description="Créez votre premier auteur pour les sélectionner lors de la création de tâches."
          />
        )}

        {authors.length > 0 && (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nom</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Créé le</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {authors.map((author) => (
                <Table.Tr key={author.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{author.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" truncate maw={300}>
                      {author.description || '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(author.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="Modifier">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => openEdit(author)}
                        >
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Supprimer">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => setDeleteTarget(author)}
                        >
                          <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
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
        title={editingAuthor ? "Modifier l'auteur" : 'Nouvel auteur'}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmitForm)}>
          <Stack gap="sm">
            <TextInput
              label="Nom"
              placeholder="Nom de l'auteur"
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
                {editingAuthor ? 'Enregistrer' : 'Créer'}
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
        title="Supprimer l'auteur"
        message={`Êtes-vous sûr de vouloir supprimer l'auteur « ${deleteTarget?.name ?? ''} » ?`}
        confirmLabel="Supprimer"
        loading={deleteMut.isPending}
      />
    </Stack>
  );
}
