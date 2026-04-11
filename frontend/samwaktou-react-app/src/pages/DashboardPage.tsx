/**
 * @file DashboardPage.tsx
 * @description Admin dashboard with overview stats and recent tasks.
 *
 * Features:
 * - Welcome banner with current user info.
 * - Summary stat cards (total, in-progress, review, published).
 * - Recent tasks table (last 5 updated).
 * - Quick-action links to key sections.
 */

import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconChecklist,
  IconClipboardCheck,
  IconPlayerPlay,
  IconRocket,
  IconUsers,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useAdmins } from '@/hooks/useAdmins';
import { AdminRole, TaskStatus } from '@/types';
import { formatRelative } from '@/utils/date.utils';
import { TaskStatusBadge } from '@/components/task/TaskStatusBadge';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';

/* ── Stat card sub-component ──────────────────────────────────────────── */

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card p="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {title}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {value}
          </Text>
        </div>
        <ThemeIcon size="lg" variant="light" color={color} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

/* ── Component ────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  /* Fetch all tasks (first page, large limit for stats) */
  const { data: allRes, isLoading: allLoading } = useTasks({ limit: 100 });
  const { data: adminsRes, isLoading: adminsLoading } = useAdmins();

  const tasks = allRes?.data ?? [];
  const admins = adminsRes?.data ?? [];

  /* ── Compute stats ────────────────────────────────────────────────── */
  const totalTasks = tasks.length;
  const inProgressCount = tasks.filter(
    (t) => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.CORRECTIONS_NEEDED,
  ).length;
  const inReviewCount = tasks.filter(
    (t) => t.status === TaskStatus.READY_FOR_REVIEW || t.status === TaskStatus.IN_REVIEW,
  ).length;
  const publishedCount = tasks.filter((t) => t.status === TaskStatus.PUBLISHED).length;

  /* Recent tasks (last 5 by updatedAt) */
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const isLoading = allLoading || adminsLoading;

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <Stack gap="lg">
      {/* Welcome */}
      <div>
        <Title order={2}>Tableau de bord</Title>
        <Text c="dimmed" mt={4}>
          Bienvenue{user?.email ? `, ${user.email}` : ''} !
        </Text>
      </div>

      {/* Stat cards */}
      <Paper pos="relative" p={0}>
        <LoadingOverlay visible={isLoading} />
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
          <StatCard
            title="Total tâches"
            value={totalTasks}
            icon={<IconChecklist size={20} stroke={1.5} />}
            color="blue"
          />
          <StatCard
            title="En cours"
            value={inProgressCount}
            icon={<IconPlayerPlay size={20} stroke={1.5} />}
            color="orange"
          />
          <StatCard
            title="En revue"
            value={inReviewCount}
            icon={<IconClipboardCheck size={20} stroke={1.5} />}
            color="violet"
          />
          <StatCard
            title="Publiées"
            value={publishedCount}
            icon={<IconRocket size={20} stroke={1.5} />}
            color="green"
          />
        </SimpleGrid>
      </Paper>

      <Grid>
        {/* Recent tasks */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card>
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Tâches récentes</Text>
              <Button variant="subtle" size="xs" onClick={() => navigate('/admin/tasks')}>
                Voir tout
              </Button>
            </Group>

            {recentTasks.length === 0 && !isLoading && (
              <Text c="dimmed" size="sm" ta="center" py="md">
                Aucune tâche pour le moment.
              </Text>
            )}

            {recentTasks.length > 0 && (
              <Table verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Statut</Table.Th>
                    <Table.Th>Mis à jour</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recentTasks.map((task) => (
                    <Table.Tr
                      key={task.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/tasks/${task.id}`)}
                    >
                      <Table.Td maw={300}>
                        <Text size="sm" truncate>{task.description}</Text>
                      </Table.Td>
                      <Table.Td>
                        <TaskStatusBadge status={task.status} size="sm" />
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label={task.updatedAt}>
                          <Text size="xs" c="dimmed">{formatRelative(task.updatedAt)}</Text>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>

        {/* Quick actions + admin count */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Card>
              <Text fw={600} mb="sm">Actions rapides</Text>
              <Stack gap="xs">
                {hasRole(AdminRole.PUBLISHER) && (
                  <Button
                    variant="light"
                    fullWidth
                    onClick={() => navigate('/admin/tasks/new')}
                  >
                    Créer une tâche
                  </Button>
                )}
                <Button
                  variant="light"
                  color="gray"
                  fullWidth
                  onClick={() => navigate('/admin/tasks')}
                >
                  Liste des tâches
                </Button>
                <Button
                  variant="light"
                  color="gray"
                  fullWidth
                  onClick={() => navigate('/admin/themes')}
                >
                  Gérer les thèmes
                </Button>
              </Stack>
            </Card>

            {hasRole(AdminRole.SYSTEM_ADMIN) && (
              <Card>
                <Group justify="space-between" mb="sm">
                  <Text fw={600}>Équipe</Text>
                  <Badge variant="light" leftSection={<IconUsers size={12} stroke={1.5} />}>
                    {admins.length}
                  </Badge>
                </Group>
                <Button
                  variant="light"
                  color="gray"
                  fullWidth
                  onClick={() => navigate('/admin/admins')}
                >
                  Gérer les administrateurs
                </Button>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
