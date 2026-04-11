/**
 * @file LoginPage.tsx
 * @description Admin login page — functional component with Mantine 7.
 *
 * Replaces the legacy class-based `Login` component.  Uses Mantine's
 * form library with Zod-like inline validation and the shared API client.
 *
 * On successful login the user is redirected to the page they originally
 * tried to visit (or `/admin/dashboard` by default).
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Alert,
  Button,
  Center,
  Card,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { login as apiLogin } from '@/api/admin.api';
import { ApiError } from '@/api/client';

/* ── Form values type ─────────────────────────────────────────────────── */

interface LoginFormValues {
  email: string;
  password: string;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** Where the user wanted to go before being redirected to login. */
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    ?? '/admin/dashboard';

  /* ── Form setup ───────────────────────────────────────────────────── */
  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (v) =>
        v.trim().length === 0
          ? 'L\'adresse email est requise'
          : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
            ? 'Adresse email invalide'
            : null,
      password: (v) =>
        v.length === 0 ? 'Le mot de passe est requis' : null,
    },
  });

  /* ── Submit handler ───────────────────────────────────────────────── */
  const handleSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await apiLogin({
        email: values.email.trim(),
        password: values.password,
      });

      /* Persist auth state and redirect.
       * The backend returns { id, role, token } — email is NOT included,
       * so we carry it forward from the form input. */
      login({
        id: res.id,
        role: res.role,
        email: values.email.trim(),
        token: res.token,
      });

      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Erreur réseau. Vérifiez votre connexion internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <Center mih="100vh" bg="gray.0">
      <Card shadow="md" radius="md" w={400} p="xl" withBorder>
        <Stack gap="md">
          {/* Header */}
          <Stack gap={4} align="center">
            <Title order={2} c="teal">
              Samwaktou
            </Title>
            <Text size="sm" c="dimmed">
              Connectez-vous à votre espace administrateur
            </Text>
          </Stack>

          {/* Error alert */}
          {errorMessage && (
            <Alert
              color="red"
              icon={<IconAlertCircle size={18} stroke={1.5} />}
              variant="light"
            >
              {errorMessage}
            </Alert>
          )}

          {/* Login form */}
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="votre@email.com"
                autoComplete="email"
                {...form.getInputProps('email')}
              />

              <PasswordInput
                label="Mot de passe"
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                {...form.getInputProps('password')}
              />

              <Button type="submit" fullWidth mt="sm" loading={loading}>
                Se connecter
              </Button>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Center>
  );
}
