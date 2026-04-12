/**
 * @file Sidebar.tsx
 * @description Navigation sidebar for the admin area.
 *
 * Renders a vertical nav with links to every admin page.  The active
 * link is highlighted automatically based on the current route.
 * Visibility of certain links is gated by the user's role.
 */

import { NavLink, Stack, Text, Divider } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconListCheck,
  IconPlus,
  IconTags,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminRole } from '@/types';

/* ── Navigation items ─────────────────────────────────────────────────── */

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  /** Minimum role required to see this link. */
  minRole?: AdminRole;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Tableau de bord',
    icon: <IconLayoutDashboard size={20} stroke={1.5} />,
    path: '/admin/dashboard',
  },
  {
    label: 'Tâches',
    icon: <IconListCheck size={20} stroke={1.5} />,
    path: '/admin/tasks',
  },
  {
    label: 'Nouvelle tâche',
    icon: <IconPlus size={20} stroke={1.5} />,
    path: '/admin/tasks/new',
    minRole: AdminRole.PUBLISHER,
  },
  {
    label: 'Thèmes',
    icon: <IconTags size={20} stroke={1.5} />,
    path: '/admin/themes',
    minRole: AdminRole.CONTRIBUTOR,
  },
  {
    label: 'Auteurs',
    icon: <IconUser size={20} stroke={1.5} />,
    path: '/admin/authors',
    minRole: AdminRole.REVIEWER,
  },
  {
    label: 'Administrateurs',
    icon: <IconUsers size={20} stroke={1.5} />,
    path: '/admin/admins',
    minRole: AdminRole.SYSTEM_ADMIN,
  },
];

/* ── Component ────────────────────────────────────────────────────────── */

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  /** Check if a nav path is currently active (exact or starts-with). */
  const isActive = (itemPath: string): boolean => {
    if (itemPath === '/admin/dashboard') return pathname === itemPath;
    return pathname.startsWith(itemPath);
  };

  return (
    <Stack gap={0} pt="md">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="md" mb="xs">
        Navigation
      </Text>
      <Divider mb="xs" />

      {NAV_ITEMS.filter((item) => !item.minRole || hasRole(item.minRole)).map(
        (item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={item.icon}
            active={isActive(item.path)}
            onClick={() => navigate(item.path)}
            variant="light"
          />
        ),
      )}
    </Stack>
  );
}
