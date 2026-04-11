/**
 * @file setup.ts
 * @description Global test setup — runs before every test suite.
 *
 * Responsibilities:
 * - Stubs environment variables with safe test defaults so that
 *   `validateEnv()` / `getEnv()` work without a real `.env` file.
 * - Silences the Pino logger to keep test output clean.
 */

import { vi } from 'vitest';

/* ── Stub environment variables ──────────────────────────────────────── */

/**
 * Minimal set of env vars that satisfy the Zod `envSchema`.
 * Values are intentionally dummy — no real secrets or connections.
 */
const TEST_ENV: Record<string, string> = {
  DB_CONNECTION: 'mongodb://<username>:<password>@localhost:27017/<db_name>',
  MONGODB_USERNAME: 'testuser',
  MONGODB_PASSWORD: 'testpassword',
  MONGODB_DB_NAME: 'testdb',

  ADMIN_TOKEN_SECRET: 'test-admin-secret-that-is-long-enough',
  USER_TOKEN_SECRET: 'test-user-secret-that-is-long-enough',

  S3_ACCESS_KEY: 'test-s3-key',
  S3_SECRET_ACCESS_KEY: 'test-s3-secret',
  S3_ACCESS_POINT_ARN: 'arn:aws:s3:::test-bucket',

  ROOT_ADMIN_ID: '000000000000000000000001',
  ROOT_ADMIN_SURNAME: 'Root',
  ROOT_ADMIN_NAME: 'ADMIN',
  ROOT_ADMIN_EMAIL: 'root@test.com',
  ROOT_ADMIN_DATE: '2024-01-01',
  // Pre-hashed bcrypt value for "rootpassword" (10 rounds).
  ROOT_ADMIN_PASSWORD: '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',

  APP_HOST: 'http://localhost:3000',
  PROFILE: 'test',
  PORT: '0', // Bind to a random port in integration tests.
};

// Merge test env into process.env *before* any module reads it.
Object.assign(process.env, TEST_ENV);

/* ── Silence the Pino logger during tests ────────────────────────────── */

vi.mock('../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));
