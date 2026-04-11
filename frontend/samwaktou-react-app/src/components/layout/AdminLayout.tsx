/**
 * @file AdminLayout.tsx
 * @description Shell layout for every admin page.
 *
 * Structure:
 *   ┌──────────────────────────────────┐
 *   │            TopBar (60px)         │
 *   ├──────────┬───────────────────────┤
 *   │ Sidebar  │   <Outlet />          │
 *   │ (250px)  │   (page content)      │
 *   │          │                       │
 *   └──────────┴───────────────────────┘
 *
 * The sidebar collapses to a drawer on mobile (< sm breakpoint).
 * An `<Outlet />` from React Router renders the matched child route.
 */

import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AdminLayout() {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <AppShell.Header>
        <TopBar sidebarOpened={opened} onToggleSidebar={toggle} />
      </AppShell.Header>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>

      {/* ── Page content (child route) ───────────────────────────────── */}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
