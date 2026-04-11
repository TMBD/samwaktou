/**
 * @file AudioDraftWorkPage.tsx
 * @description Page for working on audio drafts within a task.
 *
 * Accessed via /admin/tasks/:taskId/drafts/:draftId
 *
 * Features:
 * - Audio playback via `AudioPlayer`.
 * - Editable metadata (description, theme, keywords) for assignees.
 * - Review actions (approve, reject, request corrections) for reviewers.
 * - Draft status badge + navigation back to the parent task.
 */

import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconArrowLeft, IconCheck, IconX } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { useTask } from '@/hooks/useTasks';
import { useAudioDraft, useUpdateDraft, useReviewDraft } from '@/hooks/useAudioDrafts';
import { useThemes } from '@/hooks/useThemes';
import { AudioDraftStatus, TaskStatus } from '@/types';
import type { AudioDraftReviewPayload } from '@/types';
import { DraftStatusBadge } from '@/components/draft/DraftStatusBadge';
import { AudioPlayer } from '@/components/draft/AudioPlayer';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { EmptyState } from '@/components/common/EmptyState';

/* ── Metadata form values ─────────────────────────────────────────────── */

interface MetadataFormValues {
  description: string;
  theme: string;
  keywords: string[];
}

/* ── Component ────────────────────────────────────────────────────────── */

export function AudioDraftWorkPage() {
  const { taskId, draftId } = useParams<{ taskId: string; draftId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Data fetching ────────────────────────────────────────────────── */
  const { data: taskRes, isLoading: taskLoading } = useTask(taskId);
  const { data: draftRes, isLoading: draftLoading } = useAudioDraft(taskId, draftId);
  const { data: themesRes } = useThemes({ isValidated: true, limit: 200 });

  const task = taskRes?.data ?? null;
  const draft = draftRes?.data ?? null;
  const themes = themesRes?.data ?? [];

  /* ── Mutations ────────────────────────────────────────────────────── */
  const updateMut = useUpdateDraft();
  const reviewMut = useReviewDraft();

  /* ── Local UI state ───────────────────────────────────────────────── */
  const [reviewComment, setReviewComment] = useState('');
  const [correctionComment, setCorrectionComment] = useState('');

  /* ── Metadata form ────────────────────────────────────────────────── */
  const metaForm = useForm<MetadataFormValues>({
    initialValues: {
      description: draft?.description ?? '',
      theme: draft?.theme ?? '',
      keywords: draft?.keywords ?? [],
    },
  });

  /* Sync form when draft data arrives */
  if (draft && metaForm.values.description === '' && draft.description) {
    metaForm.setValues({
      description: draft.description,
      theme: draft.theme,
      keywords: [...draft.keywords],
    });
  }

  /* ── Derived state ────────────────────────────────────────────────── */
  const isAssignee = task?.assignee === user?.id;
  const isReviewer = task?.reviewedBy === user?.id;
  const canEdit =
    isAssignee &&
    (task?.status === TaskStatus.IN_PROGRESS ||
      task?.status === TaskStatus.CORRECTIONS_NEEDED);
  const canReview =
    isReviewer && task?.status === TaskStatus.IN_REVIEW;

  /* Theme options for Select */
  const themeOptions = themes.map((t) => ({ value: t.name, label: t.name }));

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const handleSaveMetadata = useCallback(
    (values: MetadataFormValues) => {
      if (!taskId || !draftId) return;
      updateMut.mutate({
        taskId,
        draftId,
        payload: {
          description: values.description.trim() || undefined,
          theme: values.theme || undefined,
          keywords: values.keywords.length > 0 ? values.keywords : undefined,
        },
      });
    },
    [taskId, draftId, updateMut],
  );

  const handleReview = useCallback(
    (status: AudioDraftStatus) => {
      if (!taskId || !draftId) return;
      const payload: AudioDraftReviewPayload = {
        status,
        reviewComment: reviewComment.trim() || undefined,
        correctionComment: correctionComment.trim() || undefined,
      };
      reviewMut.mutate(
        { taskId, draftId, payload },
        {
          onSuccess: () => {
            setReviewComment('');
            setCorrectionComment('');
          },
        },
      );
    },
    [taskId, draftId, reviewComment, correctionComment, reviewMut],
  );

  /* ── Loading / error ──────────────────────────────────────────────── */
  if (taskLoading || draftLoading) {
    return <LoadingOverlay visible inline />;
  }

  if (!task || !draft) {
    return (
      <EmptyState
        title="Brouillon introuvable"
        description="Ce brouillon n'existe pas ou a été supprimé."
        action={
          <Button variant="light" onClick={() => navigate(taskId ? `/admin/tasks/${taskId}` : '/admin/tasks')}>
            Retour à la tâche
          </Button>
        }
      />
    );
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => navigate(`/admin/tasks/${taskId}`)}>
            <IconArrowLeft size={20} stroke={1.5} />
          </ActionIcon>
          <Title order={3}>Brouillon audio</Title>
        </Group>
        <DraftStatusBadge status={draft.status} size="lg" />
      </Group>

      <Grid>
        {/* ── Left: audio + metadata ─────────────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {/* Audio player */}
            <AudioPlayer taskId={task.id} draftId={draft.id} fileName={draft.originalFileName} />

            {/* Metadata editing */}
            <Card>
              <form onSubmit={metaForm.onSubmit(handleSaveMetadata)}>
                <Stack gap="sm">
                  <Text size="sm" fw={600}>Métadonnées</Text>

                  <Textarea
                    label="Description"
                    placeholder="Description du contenu audio…"
                    minRows={2}
                    disabled={!canEdit}
                    {...metaForm.getInputProps('description')}
                  />

                  <Select
                    label="Thème"
                    placeholder="Sélectionner un thème"
                    data={themeOptions}
                    searchable
                    clearable
                    disabled={!canEdit}
                    {...metaForm.getInputProps('theme')}
                  />

                  <TagsInput
                    label="Mots-clés"
                    placeholder="Ajouter des mots-clés…"
                    disabled={!canEdit}
                    {...metaForm.getInputProps('keywords')}
                  />

                  {canEdit && (
                    <Group justify="flex-end">
                      <Button type="submit" loading={updateMut.isPending}>
                        Enregistrer
                      </Button>
                    </Group>
                  )}
                </Stack>
              </form>
            </Card>
          </Stack>
        </Grid.Col>

        {/* ── Right: info + review actions ────────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Draft info */}
            <Card>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Fichier</Text>
                <Text size="sm" fw={500}>{draft.originalFileName}</Text>

                <Divider />

                <Text size="xs" c="dimmed">Ordre</Text>
                <Text size="sm">{draft.order}</Text>

                {draft.isNewTheme && (
                  <Badge color="cyan" variant="light" size="sm">
                    Nouveau thème
                  </Badge>
                )}
              </Stack>
            </Card>

            {/* Review comments display */}
            {draft.reviewComment && (
              <Alert color="blue" variant="light" title="Commentaire de revue">
                {draft.reviewComment}
              </Alert>
            )}
            {draft.correctionComment && (
              <Alert color="orange" variant="light" title="Corrections demandées">
                {draft.correctionComment}
              </Alert>
            )}
            {draft.rejectionSuggestedReason && (
              <Alert color="yellow" variant="light" title="Suggestion de rejet">
                {draft.rejectionSuggestedReason}
              </Alert>
            )}

            {/* Review actions (reviewer only, task IN_REVIEW) */}
            {canReview && (
              <Card>
                <Stack gap="sm">
                  <Text size="sm" fw={600}>Revue du brouillon</Text>

                  <Textarea
                    label="Commentaire de revue"
                    placeholder="Optionnel…"
                    minRows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.currentTarget.value)}
                  />

                  <Textarea
                    label="Commentaire de correction"
                    placeholder="Si des corrections sont nécessaires…"
                    minRows={2}
                    value={correctionComment}
                    onChange={(e) => setCorrectionComment(e.currentTarget.value)}
                  />

                  <Group gap="xs">
                    <Button
                      size="xs"
                      color="green"
                      leftSection={<IconCheck size={14} stroke={1.5} />}
                      onClick={() => handleReview(AudioDraftStatus.APPROVED)}
                      loading={reviewMut.isPending}
                    >
                      Approuver
                    </Button>
                    <Button
                      size="xs"
                      color="orange"
                      variant="light"
                      onClick={() => handleReview(AudioDraftStatus.CORRECTIONS_NEEDED)}
                      loading={reviewMut.isPending}
                    >
                      Corrections
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      variant="light"
                      leftSection={<IconX size={14} stroke={1.5} />}
                      onClick={() => handleReview(AudioDraftStatus.REJECTED)}
                      loading={reviewMut.isPending}
                    >
                      Rejeter
                    </Button>
                  </Group>
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
