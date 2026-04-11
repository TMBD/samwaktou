/**
 * @file TopBar.tsx
 * @description Top navigation bar for the admin area.
 *
 * Shows the application logo/name on the left, and the current user's
 * identity + logout button on the right.  Also includes a burger button
 * for toggling the sidebar on mobile.
 */

import {
  ActionIcon,
  Badge,
  Burger,
  Group,
  Menu,
  Text,
} from '@mantine/core';
import { IconLogout, IconUser } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel, getRoleColor } from '@/utils/format.utils';

interface TopBarProps {
  /** Whether the mobile sidebar is currently open. */
  sidebarOpened: boolean;
  /** Toggle the mobile sidebar. */
  onToggleSidebar: () => void;
}

export function TopBar({ sidebarOpened, onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <Group h="100%" px="md" justify="space-between">
      {/* Left: burger + app name */}
      <Group>
        <Burger
          opened={sidebarOpened}
          onClick={onToggleSidebar}
          hiddenFrom="sm"
          size="sm"
        />
        <Text fw={700} size="lg" c="teal">
          Samwaktou
        </Text>
      </Group>

      {/* Right: user info + logout */}
      {user && (
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" size="lg" radius="xl">
              <IconUser size={20} stroke={1.5} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              <Text size="xs" fw={500}>{user.email}</Text>
              <Badge size="xs" color={getRoleColor(user.role)} mt={4}>
                {getRoleLabel(user.role)}
              </Badge>
            </Menu.Label>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconLogout size={14} stroke={1.5} />}
              onClick={logout}
            >
              Se déconnecter
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
    </Group>
  );
}
