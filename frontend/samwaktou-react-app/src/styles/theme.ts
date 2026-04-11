/**
 * @file theme.ts
 * @description Mantine 7 theme configuration.
 *
 * Centralises all visual customisations (colors, typography, component
 * defaults, radius, spacing) so the entire application has a consistent
 * look-and-feel.  Import this from `main.tsx` and pass it to
 * `<MantineProvider theme={theme}>`.
 */

import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  /* ── Brand palette ──────────────────────────────────────────────────── */
  primaryColor: 'teal',
  primaryShade: { light: 6, dark: 8 },

  /* ── Typography ─────────────────────────────────────────────────────── */
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '700',
  },

  /* ── Spacing & radius ───────────────────────────────────────────────── */
  defaultRadius: 'md',
  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },

  /* ── Component defaults ─────────────────────────────────────────────── */
  components: {
    Button: {
      defaultProps: {
        size: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'sm',
      },
    },
    Select: {
      defaultProps: {
        size: 'sm',
      },
    },
    Badge: {
      defaultProps: {
        variant: 'light',
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        padding: 'lg',
        radius: 'md',
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'xs',
        radius: 'md',
        withBorder: true,
      },
    },
  },
});
