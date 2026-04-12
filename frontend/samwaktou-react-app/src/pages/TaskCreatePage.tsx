/**
 * @file TaskCreatePage.tsx
 * @description Form page for creating a new task with audio file uploads.
 *
 * Features:
 * - Description, session author, session date inputs.
 * - Drag-and-drop / click-to-upload for audio files.
 * - File list with remove capability.
 * - Submits FormData via the `useCreateTask` mutation hook.
 * - Redirects to the new task's detail page on success.
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  List,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { Dropzone } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { IconArrowLeft, IconMusic, IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import { useCreateTask } from '@/hooks/useTasks';
import { useAuthors } from '@/hooks/useAuthors';
import { toISODateString } from '@/utils/date.utils';

/* ── Form values ──────────────────────────────────────────────────────── */

interface CreateTaskFormValues {
  description: string;
  sessionAuthor: string;
  sessionDate: Date | null;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function TaskCreatePage() {
  const navigate = useNavigate();
  const createMut = useCreateTask();

  const [files, setFiles] = useState<File[]>([]);

  /* ── Authors dropdown data ──────────────────────────────────────────── */
  const { data: authorsData } = useAuthors({ limit: 200 });
  const authorOptions = (authorsData?.data ?? []).map((a) => ({
    value: a.name,
    label: a.name,
  }));

  /* ── Form setup ───────────────────────────────────────────────────── */
  const form = useForm<CreateTaskFormValues>({
    initialValues: {
      description: '',
      sessionAuthor: '',
      sessionDate: null,
    },
    validate: {
      description: (v) => (v.trim().length < 3 ? 'La description est trop courte (min 3 car.)' : null),
      sessionAuthor: (v) => (!v || v.trim().length < 2 ? 'L\'auteur est requis' : null),
      sessionDate: (v) => (!v ? 'La date de session est requise' : null),
    },
  });

  /* ── File handlers ────────────────────────────────────────────────── */
  const handleDrop = useCallback(
    (accepted: File[]) => setFiles((prev) => [...prev, ...accepted]),
    [],
  );

  const handleRemoveFile = useCallback(
    (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index)),
    [],
  );

  /* ── Submit ───────────────────────────────────────────────────────── */
  const handleSubmit = (values: CreateTaskFormValues) => {
    if (files.length === 0) return;

    createMut.mutate(
      {
        payload: {
          description: values.description.trim(),
          sessionAuthor: values.sessionAuthor.trim(),
          sessionDate: toISODateString(values.sessionDate),
        },
        files,
      },
      {
        onSuccess: (res) => {
          const newId = (res as { data?: { id?: string } })?.data?.id;
          navigate(newId ? `/admin/tasks/${newId}` : '/admin/tasks', { replace: true });
        },
      },
    );
  };

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <Stack gap="md">
      {/* Header */}
      <Group gap="xs">
        <ActionIcon variant="subtle" onClick={() => navigate('/admin/tasks')}>
          <IconArrowLeft size={20} stroke={1.5} />
        </ActionIcon>
        <Title order={3}>Nouvelle tâche</Title>
      </Group>

      <Card>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Description */}
            <Textarea
              label="Description"
              placeholder="Décrivez brièvement le contenu de la session…"
              minRows={3}
              {...form.getInputProps('description')}
            />

            {/* Session author */}
            <Select
              label="Auteur de la session"
              placeholder="Sélectionner un auteur"
              data={authorOptions}
              searchable
              nothingFoundMessage="Aucun auteur trouvé"
              {...form.getInputProps('sessionAuthor')}
            />

            {/* Session date */}
            <DateInput
              label="Date de la session"
              placeholder="Sélectionner la date"
              valueFormat="DD/MM/YYYY"
              {...form.getInputProps('sessionDate')}
            />

            {/* Audio file upload */}
            <div>
              <Text size="sm" fw={500} mb={4}>
                Fichiers audio
              </Text>

              <Dropzone
                onDrop={handleDrop}
                accept={['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']}
                maxSize={100 * 1024 * 1024} /* 100 MB */
              >
                <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: 'none' }}>
                  <Dropzone.Accept>
                    <IconUpload size={32} stroke={1.5} />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX size={32} stroke={1.5} />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconMusic size={32} stroke={1.5} />
                  </Dropzone.Idle>

                  <div>
                    <Text size="sm" inline>
                      Glissez vos fichiers audio ici ou cliquez pour sélectionner
                    </Text>
                    <Text size="xs" c="dimmed" inline mt={7}>
                      Formats acceptés : MP3, WAV, OGG, M4A — max. 100 Mo par fichier
                    </Text>
                  </div>
                </Group>
              </Dropzone>

              {/* File list */}
              {files.length > 0 && (
                <List mt="sm" spacing="xs" size="sm">
                  {files.map((file, idx) => (
                    <List.Item
                      key={`${file.name}-${idx}`}
                      icon={
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="subtle"
                          onClick={() => handleRemoveFile(idx)}
                        >
                          <IconTrash size={14} stroke={1.5} />
                        </ActionIcon>
                      }
                    >
                      {file.name}{' '}
                      <Text span size="xs" c="dimmed">
                        ({(file.size / 1024 / 1024).toFixed(1)} Mo)
                      </Text>
                    </List.Item>
                  ))}
                </List>
              )}

              {files.length === 0 && (
                <Text size="xs" c="red" mt={4}>
                  Au moins un fichier audio est requis.
                </Text>
              )}
            </div>

            {/* Submit button */}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => navigate('/admin/tasks')}>
                Annuler
              </Button>
              <Button
                type="submit"
                loading={createMut.isPending}
                disabled={files.length === 0}
              >
                Créer la tâche
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
