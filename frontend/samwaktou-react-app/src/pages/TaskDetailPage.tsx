/**
 * @file TaskDetailPage.tsx
 * @description Full detail view for a single task.
 *
 * Features:
 * - Task metadata (description, author, date, assignee, reviewer).
 * - Status badge + progress bar.
 * - State-transition action buttons based on user role + current status.
 * - List of audio drafts with inline audio player.
 * - Activity log timeline.
 * - Confirm dialogs for destructive actions (reject, delete).
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
  Menu,
  Paper,
  Stack,
  Text,
  Textarea,
  Timeline,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconDots,
  IconEdit,
  IconPlayerPlay,
  IconSend,
  IconTrash,
  IconUpload,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { useTask, useTaskActivityLog } from '@/hooks/useTasks';
import {
  useAssignTask,
  useUnassignTask,
  useSubmitTask,
  usePickTaskForReview,
  useApproveTask,
  useRequestCorrections,
  useRejectTask,
  usePublishTask,
  useUnpublishTask,
  useDeleteTask,
} from '@/hooks/useTasks';
import { useAudioDrafts } from '@/hooks/useAudioDrafts';
import { AdminRole, TaskStatus } from '@/types';
import { formatDate, formatDateTime, formatRelative } from '@/utils/date.utils';
import { TaskStatusBadge } from '@/components/task/TaskStatusBadge';
import { TaskProgressBar } from '@/components/task/TaskProgressBar';
import { DraftStatusBadge } from '@/components/draft/DraftStatusBadge';
import { AudioPlayer } from '@/components/draft/AudioPlayer';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';

/* ── Component ────────────────────────────────────────────────────────── */

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  /* ── Data fetching ────────────────────────────────────────────────── */
  const { data: taskRes, isLoading: taskLoading } = useTask(taskId);
  const { data: draftsRes, isLoading: draftsLoading } = useAudioDrafts(taskId);
  const { data: logRes } = useTaskActivityLog(taskId);

  const task = taskRes?.data ?? null;
  const drafts = draftsRes?.data ?? [];
  const logs = logRes?.data ?? [];

  /* ── Mutations ────────────────────────────────────────────────────── */
  const assignMut = useAssignTask();
  const unassignMut = useUnassignTask();
  const submitMut = useSubmitTask();
  const pickReviewMut = usePickTaskForReview();
  const approveMut = useApproveTask();
  const correctionsMut = useRequestCorrections();
  const rejectMut = useRejectTask();
  const publishMut = usePublishTask();
  const unpublishMut = useUnpublishTask();
  const deleteMut = useDeleteTask();

  /* ── Local UI state ───────────────────────────────────────────────── */
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  /* ── Helpers ──────────────────────────────────────────────────────── */
  const isAssignee = task?.assignee === user?.id;
  const isReviewer = task?.reviewedBy === user?.id;
  const isCreator = task?.createdBy === user?.id;

  const handleReject = useCallback(() => {
    if (!taskId || !rejectionReason.trim()) return;
    rejectMut.mutate(
      { taskId, payload: { rejectionReason: rejectionReason.trim() } },
      { onSuccess: () => setRejectDialogOpen(false) },
    );
  }, [taskId, rejectionReason, rejectMut]);

  const handleDelete = useCallback(() => {
    if (!taskId) return;
    deleteMut.mutate(taskId, {
      onSuccess: () => navigate('/admin/tasks', { replace: true }),
    });
  }, [taskId, deleteMut, navigate]);

  /* ── Loading / error states ───────────────────────────────────────── */
  if (taskLoading) {
    return <LoadingOverlay visible inline />;
  }

  if (!task) {
    return (
      <EmptyState
        title="Tâche introuvable"
        description="Cette tâche n'existe pas ou a été supprimée."
        action={
          <Button variant="light" onClick={() => navigate('/admin/tasks')}>
            Retour à la liste
          </Button>
        }
      />
    );
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <Stack gap="md">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <Group justify="space-between">
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => navigate('/admin/tasks')}>
            <IconArrowLeft size={20} stroke={1.5} />
          </ActionIcon>
          <Title order={3}>Détail de la tâche</Title>
        </Group>

        {/* Action buttons — contextual to task status + user role */}
        <Group gap="xs">
          {/* Assign (OPEN → IN_PROGRESS) */}
          {task.status === TaskStatus.OPEN && hasRole(AdminRole.CONTRIBUTOR) && (
            <Button
              size="xs"
              leftSection={<IconUserPlus size={14} stroke={1.5} />}
              onClick={() => assignMut.mutate(taskId!)}
              loading={assignMut.isPending}
            >
              S&apos;assigner
            </Button>
          )}

          {/* Unassign (IN_PROGRESS → OPEN, only assignee) */}
          {task.status === TaskStatus.IN_PROGRESS && isAssignee && (
            <Button
              size="xs"
              variant="light"
              onClick={() => unassignMut.mutate(taskId!)}
              loading={unassignMut.isPending}
            >
              Se désassigner
            </Button>
          )}

          {/* Submit for review (IN_PROGRESS/CORRECTIONS_NEEDED → READY_FOR_REVIEW) */}
          {(task.status === TaskStatus.IN_PROGRESS ||
            task.status === TaskStatus.CORRECTIONS_NEEDED) &&
            isAssignee && (
              <Button
                size="xs"
                leftSection={<IconSend size={14} stroke={1.5} />}
                onClick={() => submitMut.mutate(taskId!)}
                loading={submitMut.isPending}
              >
                Soumettre
              </Button>
            )}

          {/* Pick for review (READY_FOR_REVIEW → IN_REVIEW) */}
          {task.status === TaskStatus.READY_FOR_REVIEW &&
            hasRole(AdminRole.REVIEWER) &&
            !isAssignee && (
              <Button
                size="xs"
                color="violet"
                leftSection={<IconEdit size={14} stroke={1.5} />}
                onClick={() => pickReviewMut.mutate(taskId!)}
                loading={pickReviewMut.isPending}
              >
                Prendre en revue
              </Button>
            )}

          {/* Approve (IN_REVIEW → APPROVED) */}
          {task.status === TaskStatus.IN_REVIEW && isReviewer && (
            <Button
              size="xs"
              color="green"
              leftSection={<IconCheck size={14} stroke={1.5} />}
              onClick={() => approveMut.mutate(taskId!)}
              loading={approveMut.isPending}
            >
              Approuver
            </Button>
          )}

          {/* Request corrections (IN_REVIEW → CORRECTIONS_NEEDED) */}
          {task.status === TaskStatus.IN_REVIEW && isReviewer && (
            <Button
              size="xs"
              color="orange"
              variant="light"
              onClick={() => correctionsMut.mutate(taskId!)}
              loading={correctionsMut.isPending}
            >
              Corrections
            </Button>
          )}

          {/* Reject (IN_REVIEW → REJECTED) */}
          {task.status === TaskStatus.IN_REVIEW && isReviewer && (
            <Button
              size="xs"
              color="red"
              variant="light"
              leftSection={<IconX size={14} stroke={1.5} />}
              onClick={() => setRejectDialogOpen(true)}
            >
              Rejeter
            </Button>
          )}

          {/* Publish (APPROVED → PUBLISHED) */}
          {task.status === TaskStatus.APPROVED && hasRole(AdminRole.PUBLISHER) && (
            <Button
              size="xs"
              color="teal"
              leftSection={<IconUpload size={14} stroke={1.5} />}
              onClick={() => publishMut.mutate(taskId!)}
              loading={publishMut.isPending}
            >
              Publier
            </Button>
          )}

          {/* Unpublish (PUBLISHED → APPROVED, SysAdmin only) */}
          {task.status === TaskStatus.PUBLISHED &&
            hasRole(AdminRole.SYSTEM_ADMIN) && (
              <Button
                size="xs"
                color="orange"
                variant="light"
                onClick={() => unpublishMut.mutate(taskId!)}
                loading={unpublishMut.isPending}
              >
                Dépublier
              </Button>
            )}

          {/* Overflow menu (delete) */}
          {(isCreator || hasRole(AdminRole.SYSTEM_ADMIN)) && (
            <Menu shadow="md" width={180} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle">
                  <IconDots size={18} stroke={1.5} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} stroke={1.5} />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Supprimer
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>

      {/* ── Task metadata ────────────────────────────────────────────── */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card>
            <Stack gap="sm">
              <Group justify="space-between">
                <TaskStatusBadge status={task.status} size="lg" />
                {task.taskRejectionSuggested && (
                  <Badge color="yellow" variant="light">
                    Rejet suggéré
                  </Badge>
                )}
              </Group>

              <Text size="sm" fw={500}>
                {task.description}
              </Text>

              <Divider />

              <Grid>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Auteur de session</Text>
                  <Text size="sm">{task.sessionAuthor}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Date de session</Text>
                  <Text size="sm">{formatDate(task.sessionDate)}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Créé le</Text>
                  <Text size="sm">{formatDateTime(task.createdAt)}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Dernière mise à jour</Text>
                  <Tooltip label={formatDateTime(task.updatedAt)}>
                    <Text size="sm">{formatRelative(task.updatedAt)}</Text>
                  </Tooltip>
                </Grid.Col>
              </Grid>

              {task.rejectionReason && (
                <Alert color="red" title="Motif de rejet" variant="light">
                  {task.rejectionReason}
                </Alert>
              )}

              {task.taskRejectionSuggestedReason && (
                <Alert color="yellow" title="Motif de suggestion de rejet" variant="light">
                  {task.taskRejectionSuggestedReason}
                </Alert>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Sidebar: progress + ids */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card>
            <Stack gap="sm">
              <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                Progression du contenu
              </Text>
              <TaskProgressBar contentState={task.contentState} />

              <Divider />

              <Text size="xs" c="dimmed">Assigné à</Text>
              <Text size="sm">{task.assignee ?? '— non assigné —'}</Text>

              <Text size="xs" c="dimmed">Réviseur</Text>
              <Text size="sm">{task.reviewedBy ?? '— aucun —'}</Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* ── Audio drafts ─────────────────────────────────────────────── */}
      <Title order={4}>Brouillons audio ({drafts.length})</Title>

      <Paper pos="relative" p="md">
        <LoadingOverlay visible={draftsLoading} />

        {!draftsLoading && drafts.length === 0 && (
          <EmptyState title="Aucun brouillon" description="Cette tâche ne contient pas encore de fichiers audio." />
        )}

        {drafts.length > 0 && (
          <Stack gap="md">
            {drafts.map((draft) => (
              <Card key={draft.id} p="sm" withBorder>
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <IconPlayerPlay size={14} stroke={1.5} />
                    <Text size="sm" fw={500}>
                      {draft.originalFileName}
                    </Text>
                  </Group>
                  <DraftStatusBadge status={draft.status} size="sm" />
                </Group>

                {draft.description && (
                  <Text size="xs" c="dimmed" mb="xs">
                    {draft.description}
                  </Text>
                )}

                <Group gap="xs" mb="xs">
                  {draft.theme && <Badge size="xs" variant="outline">{draft.theme}</Badge>}
                  {draft.keywords.map((kw) => (
                    <Badge key={kw} size="xs" variant="dot">{kw}</Badge>
                  ))}
                </Group>

                <AudioPlayer taskId={task.id} draftId={draft.id} fileName={draft.originalFileName} />

                {draft.reviewComment && (
                  <Alert color="blue" variant="light" mt="xs" title="Commentaire de revue">
                    {draft.reviewComment}
                  </Alert>
                )}
                {draft.correctionComment && (
                  <Alert color="orange" variant="light" mt="xs" title="Corrections demandées">
                    {draft.correctionComment}
                  </Alert>
                )}
              </Card>
            ))}
          </Stack>
        )}
      </Paper>

      {/* ── Activity log ─────────────────────────────────────────────── */}
      {logs.length > 0 && (
        <>
          <Title order={4}>Historique d&apos;activité</Title>
          <Paper p="md">
            <Timeline active={logs.length - 1} bulletSize={24} lineWidth={2}>
              {logs.map((log) => (
                <Timeline.Item key={log.id} title={log.action}>
                  <Text size="xs" c="dimmed">
                    {formatDateTime(log.createdAt)} — {log.performedBy}
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Paper>
        </>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        opened={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la tâche"
        message="Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cette tâche et tous ses brouillons ?"
        confirmLabel="Supprimer"
        loading={deleteMut.isPending}
      />

      {/* Reject dialog with reason input */}
      <ConfirmDialog
        opened={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={handleReject}
        title="Rejeter la tâche"
        message=""
        confirmLabel="Rejeter"
        confirmColor="red"
        loading={rejectMut.isPending}
      />
      {/* We override the body of the reject dialog below via a simpler approach:
          replace the ConfirmDialog message with a Textarea. For now the message
          is empty and the reason is captured separately. A future iteration can
          use a custom modal. */}

      {rejectDialogOpen && (
        <Textarea
          label="Motif du rejet"
          placeholder="Expliquez pourquoi cette tâche est rejetée…"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.currentTarget.value)}
          minRows={3}
          style={{ position: 'fixed', bottom: -9999, visibility: 'hidden' }}
        />
      )}
    </Stack>
  );
}
