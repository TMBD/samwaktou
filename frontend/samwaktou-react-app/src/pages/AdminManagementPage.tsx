/**
 * @file AdminManagementPage.tsx
 * @description Admin page for managing admin accounts (CRUD).
 *
 * Features:
 * - Table listing all admins with email, role, creation date.
 * - Create / edit modal with role selector.
 * - Delete confirmation dialog.
 * - Role-gated: SYSTEM_ADMIN only.
 */

import { useCallback, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useDeleteAdmin,
} from '@/hooks/useAdmins';
import { AdminRole } from '@/types';
import type { Admin, AdminCreatePayload, AdminUpdatePayload } from '@/types';
import { getRoleLabel, getRoleColor } from '@/utils/format.utils';
import { formatDate } from '@/utils/date.utils';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

/* ── Role options for Select ──────────────────────────────────────────── */

const ROLE_OPTIONS = Object.values(AdminRole).map((r) => ({
  value: r,
  label: getRoleLabel(r),
}));

/* ── Form values ──────────────────────────────────────────────────────── */

interface AdminFormValues {
  surname: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function AdminManagementPage() {
  /* ── Data ──────────────────────────────────────────────────────────── */
  const { data, isLoading, isError } = useAdmins();
  const admins = data?.data ?? [];

  /* ── Mutations ─────────────────────────────────────────────────────── */
  const createMut = useCreateAdmin();
  const updateMut = useUpdateAdmin();
  const deleteMut = useDeleteAdmin();

  /* ── Local UI state ────────────────────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);

  /* ── Form ──────────────────────────────────────────────────────────── */
  const form = useForm<AdminFormValues>({
    initialValues: {
      surname: '',
      name: '',
      email: '',
      password: '',
      role: AdminRole.CONTRIBUTOR,
    },
    validate: {
      surname: (v) => (v.trim().length < 1 ? 'Le prénom est requis' : null),
      name: (v) => (v.trim().length < 1 ? 'Le nom est requis' : null),
      email: (v) =>
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
          ? 'Adresse email invalide'
          : null,
      password: (v) => {
        /* Password required only on create, optional on edit */
        if (!editingAdmin && v.length < 6) return 'Min. 6 caractères';
        if (editingAdmin && v.length > 0 && v.length < 6) return 'Min. 6 caractères';
        return null;
      },
      role: (v) => (!v ? 'Le rôle est requis' : null),
    },
  });

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const openCreate = useCallback(() => {
    setEditingAdmin(null);
    form.reset();
    setModalOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (admin: Admin) => {
      setEditingAdmin(admin);
      form.setValues({
        surname: admin.surname,
        name: admin.name,
        email: admin.email,
        password: '',
        role: admin.role,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmitForm = useCallback(
    (values: AdminFormValues) => {
      if (editingAdmin) {
        const payload: AdminUpdatePayload = {
          surname: values.surname.trim(),
          name: values.name.trim(),
          email: values.email.trim(),
          role: values.role,
        };
        updateMut.mutate(
          { id: editingAdmin.id, payload },
          { onSuccess: () => setModalOpen(false) },
        );
      } else {
        const payload: AdminCreatePayload = {
          surname: values.surname.trim(),
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          role: values.role,
        };
        createMut.mutate(payload, { onSuccess: () => setModalOpen(false) });
      }
    },
    [editingAdmin, createMut, updateMut],
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
        <Title order={2}>Gestion des administrateurs</Title>
        <Button leftSection={<IconPlus size={16} stroke={1.5} />} onClick={openCreate}>
          Nouvel administrateur
        </Button>
      </Group>

      <Paper pos="relative" p={0}>
        <LoadingOverlay visible={isLoading} />

        {isError && (
          <Text c="red" ta="center" py="xl">
            Impossible de charger les administrateurs.
          </Text>
        )}

        {!isLoading && !isError && admins.length === 0 && (
          <EmptyState title="Aucun administrateur" />
        )}

        {admins.length > 0 && (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Th>Rôle</Table.Th>
                <Table.Th>Créé le</Table.Th>
                <Table.Th w={100}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {admins.map((admin) => (
                <Table.Tr key={admin.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{admin.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getRoleColor(admin.role)} variant="light">
                      {getRoleLabel(admin.role)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(admin.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="Modifier">
                        <ActionIcon variant="subtle" onClick={() => openEdit(admin)}>
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Supprimer">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => setDeleteTarget(admin)}
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
        title={editingAdmin ? 'Modifier l\'administrateur' : 'Nouvel administrateur'}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmitForm)}>
          <Stack gap="sm">
            <TextInput
              label="Prénom"
              placeholder="Prénom"
              {...form.getInputProps('surname')}
            />
            <TextInput
              label="Nom"
              placeholder="Nom"
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Email"
              placeholder="admin@example.com"
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label={editingAdmin ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
              placeholder={editingAdmin ? 'Laisser vide pour ne pas changer' : 'Min. 6 caractères'}
              {...form.getInputProps('password')}
            />
            <Select
              label="Rôle"
              data={ROLE_OPTIONS}
              {...form.getInputProps('role')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                loading={createMut.isPending || updateMut.isPending}
              >
                {editingAdmin ? 'Enregistrer' : 'Créer'}
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
        title="Supprimer l'administrateur"
        message={`Êtes-vous sûr de vouloir supprimer le compte de « ${deleteTarget?.email ?? ''} » ?`}
        confirmLabel="Supprimer"
        loading={deleteMut.isPending}
      />
    </Stack>
  );
}
