/**
 * @file test-app.ts
 * @description Factory that builds a lightweight Express app for integration tests.
 *
 * Instead of connecting to a real MongoDB, this wires the DI graph with the
 * mock repositories so that `supertest` can exercise the full HTTP pipeline
 * (middleware → route → service → mock repo) without any external dependency.
 *
 * Usage in a test file:
 * ```ts
 * const { app, repos, services } = createTestApp();
 * const agent = supertest(app);
 * ```
 */

import express from 'express';

import { validateEnv } from '../../config/env.config.js';
import { errorHandler } from '../../middleware/error-handler.middleware.js';
import { AdminService } from '../../services/admin.service.js';
import { createVerifyAdminToken } from '../../middleware/auth.middleware.js';
import { createAdminRouter } from '../../routes/v1/admin.routes.js';
import { MockAdminRepository } from './mock-admin.repository.js';

/**
 * Build a fully-wired Express app backed by in-memory mock repositories.
 *
 * Calling `validateEnv()` here is safe because the test setup file has
 * already injected all required env vars into `process.env`.
 */
export function createTestApp() {
  // Ensure the env config singleton is populated.
  try { validateEnv(); } catch { /* already validated — safe to ignore */ }

  /* ── Repositories (mocked) ──────────────────────────────────────────── */
  const adminRepo = new MockAdminRepository();

  /* ── Services (real business logic, backed by mocks) ────────────────── */
  const adminService = new AdminService(adminRepo);

  /* ── Middleware (real auth middleware) ───────────────────────────────── */
  const verifyAdminToken = createVerifyAdminToken(adminService);

  /* ── Routers ────────────────────────────────────────────────────────── */
  const adminRouter = createAdminRouter(adminService, verifyAdminToken);

  /* ── App assembly ───────────────────────────────────────────────────── */
  const app = express();
  app.use(express.json());
  app.use('/api/v1/admin', adminRouter);
  app.use(errorHandler);

  return {
    app,
    repos: { adminRepo },
    services: { adminService },
  };
}
