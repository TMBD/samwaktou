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

import { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  IconArrowLeft,
  IconCheck,
  IconCircleCheck,
  IconExclamationCircle,
  IconInfoCircle,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { useTask } from '@/hooks/useTasks';
import { useAudioDraft, useUpdateDraft, useReviewDraft } from '@/hooks/useAudioDrafts';
import { useThemes } from '@/hooks/useThemes';
import { useAdminMap } from '@/hooks/useAdminMap';
import { AdminRole, AudioDraftStatus, TaskStatus } from '@/types';
import { getTaskStatusLabel } from '@/utils/format.utils';
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
  const { user, hasRole } = useAuth();

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
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  /* ── Metadata form ────────────────────────────────────────────────── */
  const metaForm = useForm<MetadataFormValues>({
    initialValues: {
      description: '',
      theme: '',
      keywords: [],
    },
  });

  /* Sync form when draft data arrives or is refreshed after mutation */
  const lastSyncedAt = useRef<string | null>(null);
  useEffect(() => {
    if (draft && draft.updatedAt !== lastSyncedAt.current) {
      lastSyncedAt.current = draft.updatedAt;
      metaForm.setValues({
        description: draft.description ?? '',
        theme: draft.theme ?? '',
        keywords: draft.keywords ? [...draft.keywords] : [],
      });
    }
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived state ────────────────────────────────────────────────── */
  const { resolveAdmin } = useAdminMap();
  const isAssignee = task?.assignee === user?.id;
  const isReviewer = task?.reviewedBy === user?.id;
  const canEdit =
    isAssignee &&
    (task?.status === TaskStatus.IN_PROGRESS ||
      task?.status === TaskStatus.CORRECTIONS_NEEDED);
  const canReview =
    isReviewer && task?.status === TaskStatus.IN_REVIEW;

  /** Human-readable reason explaining why the user cannot edit. */
  const readOnlyReason: string | null = (() => {
    if (canEdit) return null;
    if (!task) return null;
    if (!task.assignee) {
      return 'Cette tâche n\u2019est assignée à personne. Assignez-vous la tâche depuis la page de détail pour pouvoir modifier les brouillons.';
    }
    if (!isAssignee) {
      return `Vous n\u2019êtes pas l\u2019assigné de cette tâche. Elle est actuellement assignée à ${resolveAdmin(task.assignee)}.`;
    }
    // Assignee but wrong task status
    return `La tâche est au statut « ${getTaskStatusLabel(task.status)} ». Les modifications ne sont possibles que lorsque la tâche est en cours ou en corrections.`;
  })();

  /* Theme options for Select with dynamic creation */
  const isReviewerOrAbove = hasRole(AdminRole.REVIEWER);
  const [themeSearch, setThemeSearch] = useState('');

  const baseThemeOptions = themes.map((t) => ({ value: t.name, label: t.name }));
  const themeOptions = (() => {
    const opts = [...baseThemeOptions];
    // If the current form value is custom (not in existing themes), add it so Select displays it
    const currentVal = metaForm.values.theme;
    if (currentVal && !themes.some((t) => t.name === currentVal)) {
      opts.push({ value: currentVal, label: currentVal });
    }
    // If the user is typing a search that doesn't match any option, offer to create it
    const searchUpper = themeSearch.trim().toUpperCase();
    if (
      searchUpper.length > 0 &&
      !opts.some((o) => o.value === searchUpper) &&
      !themes.some((t) => t.name === searchUpper)
    ) {
      opts.push({ value: searchUpper, label: `+ Créer « ${searchUpper} »` });
    }
    return opts;
  })();

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const handleSaveMetadata = useCallback(
    (values: MetadataFormValues) => {
      if (!taskId || !draftId) return;
      updateMut.mutate({
        taskId,
        draftId,
        payload: {
          description: values.description.trim(),
          theme: values.theme || undefined,
          keywords: values.keywords,
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

      {/* Read-only explanation */}
      {readOnlyReason && (
        <Alert
          icon={<IconInfoCircle size={18} stroke={1.5} />}
          color="blue"
          variant="light"
          title="Consultation seule"
        >
          {readOnlyReason}
        </Alert>
      )}

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
                    minRows={4}
                    maxRows={12}
                    autosize
                    resize="vertical"
                    disabled={!canEdit}
                    {...metaForm.getInputProps('description')}
                  />

                  <Select
                    label="Thème"
                    placeholder="Sélectionner ou saisir un nouveau thème"
                    data={themeOptions}
                    searchable
                    clearable
                    nothingFoundMessage="Tapez pour créer un nouveau thème"
                    disabled={!canEdit}
                    onSearchChange={setThemeSearch}
                    {...metaForm.getInputProps('theme')}
                  />
                  {metaForm.values.theme &&
                    !themes.some((t) => t.name === metaForm.values.theme) && (
                      <Group gap={4} mt={-8}>
                        <IconSparkles size={14} stroke={1.5} color="var(--mantine-color-cyan-6)" />
                        <Text size="xs" c={isReviewerOrAbove ? 'green' : 'yellow'}>
                          {isReviewerOrAbove
                            ? 'Nouveau thème — sera créé et validé automatiquement.'
                            : 'Nouveau thème — sera soumis à validation par un réviseur.'}
                        </Text>
                      </Group>
                    )}

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

                  {/* Status actions for assignees — available as long as the task is not submitted */}
                  {canEdit && (
                    <>
                      <Divider label="Statut du brouillon" labelPosition="center" />

                      {/* Rejection reason input — shown when suggesting rejection */}
                      {(draft.status === AudioDraftStatus.PENDING || draft.status === AudioDraftStatus.DONE) && (
                        <Stack gap="xs">
                          <Textarea
                            label="Raison du rejet suggéré"
                            placeholder="Expliquez pourquoi ce brouillon devrait être rejeté…"
                            minRows={2}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.currentTarget.value)}
                            style={{ display: showRejectionInput ? undefined : 'none' }}
                          />
                          <Group gap="xs">
                            {draft.status !== AudioDraftStatus.DONE && (
                              <Button
                                size="xs"
                                color="teal"
                                variant="light"
                                leftSection={<IconCircleCheck size={14} stroke={1.5} />}
                                loading={updateMut.isPending}
                                onClick={() => {
                                  if (!taskId || !draftId) return;
                                  updateMut.mutate({ taskId, draftId, payload: { status: AudioDraftStatus.DONE } });
                                }}
                              >
                                Marquer comme terminé
                              </Button>
                            )}
                            {draft.status === AudioDraftStatus.DONE && (
                              <Button
                                size="xs"
                                color="gray"
                                variant="light"
                                loading={updateMut.isPending}
                                onClick={() => {
                                  if (!taskId || !draftId) return;
                                  updateMut.mutate({ taskId, draftId, payload: { status: AudioDraftStatus.PENDING } });
                                }}
                              >
                                Remettre en attente
                              </Button>
                            )}
                            {!showRejectionInput ? (
                              <Button
                                size="xs"
                                color="yellow"
                                variant="light"
                                leftSection={<IconExclamationCircle size={14} stroke={1.5} />}
                                onClick={() => setShowRejectionInput(true)}
                              >
                                Suggérer le rejet
                              </Button>
                            ) : (
                              <Group gap="xs">
                                <Button
                                  size="xs"
                                  color="yellow"
                                  leftSection={<IconExclamationCircle size={14} stroke={1.5} />}
                                  loading={updateMut.isPending}
                                  disabled={!rejectionReason.trim()}
                                  onClick={() => {
                                    if (!taskId || !draftId || !rejectionReason.trim()) return;
                                    updateMut.mutate(
                                      {
                                        taskId,
                                        draftId,
                                        payload: {
                                          status: AudioDraftStatus.REJECTION_SUGGESTED,
                                          rejectionSuggestedReason: rejectionReason.trim(),
                                        },
                                      },
                                      { onSuccess: () => { setShowRejectionInput(false); setRejectionReason(''); } },
                                    );
                                  }}
                                >
                                  Confirmer le rejet
                                </Button>
                                <Button
                                  size="xs"
                                  variant="default"
                                  onClick={() => { setShowRejectionInput(false); setRejectionReason(''); }}
                                >
                                  Annuler
                                </Button>
                              </Group>
                            )}
                          </Group>
                        </Stack>
                      )}

                      {draft.status === AudioDraftStatus.REJECTION_SUGGESTED && (
                        <Stack gap="xs">
                          <Alert color="yellow" variant="light" title="Rejet suggéré">
                            {draft.rejectionSuggestedReason || 'Aucune raison fournie.'}
                          </Alert>
                          <Button
                            size="xs"
                            color="gray"
                            variant="light"
                            loading={updateMut.isPending}
                            onClick={() => {
                              if (!taskId || !draftId) return;
                              updateMut.mutate({ taskId, draftId, payload: { status: AudioDraftStatus.PENDING } });
                            }}
                          >
                            Remettre en attente
                          </Button>
                        </Stack>
                      )}
                    </>
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
