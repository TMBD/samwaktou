/**
 * @file container.ts
 * @description Dependency-Injection (DI) composition root.
 *
 * This module is the **single place** where all concrete implementations are
 * instantiated and wired together.  The rest of the application only depends
 * on abstractions (interfaces / service classes passed as constructor args).
 *
 * Wiring order:
 * 1. **Repositories** — Mongoose implementations of the repository interfaces.
 * 2. **Services**     — Business-logic classes; each receives its repository.
 * 3. **Middleware**    — Auth middleware factories receive their service.
 * 4. **Routers**      — Route factories receive services + middleware.
 *
 * The function returns the fully-assembled routers, ready to be mounted by
 * {@link createApp} in `app.ts`.
 */

import { MongoAdminRepository } from './repositories/mongoose/admin.repository.impl.js';
import { MongoAudioRepository } from './repositories/mongoose/audio.repository.impl.js';
import { MongoUserRepository } from './repositories/mongoose/user.repository.impl.js';
import { MongoAnalyticRepository } from './repositories/mongoose/analytic.repository.impl.js';

import { AdminService } from './services/admin.service.js';
import { AudioService } from './services/audio.service.js';
import { UserService } from './services/user.service.js';
import { AnalyticService } from './services/analytic.service.js';
import { StorageService } from './services/storage.service.js';

import {
  createVerifyAdminToken,
  createVerifyUserToken,
  createVerifyTokenForDeleteUser,
} from './middleware/auth.middleware.js';

import { createAdminRouter } from './routes/v1/admin.routes.js';
import { createAudioRouter } from './routes/v1/audio.routes.js';
import { createUserRouter } from './routes/v1/user.routes.js';
import { createAnalyticRouter } from './routes/v1/analytic.routes.js';

/**
 * Build the entire object graph and return the assembled Express routers.
 *
 * @returns An object containing all v1 routers, ready to mount.
 */
export function createContainer() {
  /* ── 1. Repositories (data-access layer) ───────────────────────────── */
  const adminRepo = new MongoAdminRepository();
  const audioRepo = new MongoAudioRepository();
  const userRepo = new MongoUserRepository();
  const analyticRepo = new MongoAnalyticRepository();

  /* ── 2. Services (business-logic layer) ────────────────────────────── */
  const adminService = new AdminService(adminRepo);
  const audioService = new AudioService(audioRepo);
  const userService = new UserService(userRepo);
  const analyticService = new AnalyticService(analyticRepo);
  const storageService = new StorageService();

  /* ── 3. Auth middleware (depends on services) ──────────────────────── */
  const verifyAdminToken = createVerifyAdminToken(adminService);
  const verifyUserToken = createVerifyUserToken(userService);
  const verifyTokenForDeleteUser = createVerifyTokenForDeleteUser(adminService, userService);

  /* ── 4. Routers (depends on services + middleware) ─────────────────── */
  const adminRouter = createAdminRouter(adminService, verifyAdminToken);
  const audioRouter = createAudioRouter(audioService, storageService, verifyAdminToken);
  const userRouter = createUserRouter(userService, verifyAdminToken, verifyUserToken, verifyTokenForDeleteUser);
  const analyticRouter = createAnalyticRouter(analyticService);

  return {
    routers: {
      adminRouter,
      audioRouter,
      userRouter,
      analyticRouter,
    },
  };
}
