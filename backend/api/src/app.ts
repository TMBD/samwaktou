/**
 * @file app.ts
 * @description Express application factory.
 *
 * Assembles all global middleware, DI-wired routers, and the centralised
 * error handler into a single Express application instance.
 *
 * Middleware pipeline (in order):
 * 1. **CORS**          — dynamic origin whitelist from env vars.
 * 2. **Body parsing**  — JSON + URL-encoded bodies.
 * 3. **File upload**   — `express-fileupload` with a size limit.
 * 4. **HTTP logging**  — Pino HTTP logger (auto-logging only in production).
 * 5. **v1 API routes** — mounted via the DI container.
 * 6. **Legacy aliases** — backward-compatible paths without `/api/v1/`.
 * 7. **Error handler** — catches all errors forwarded by `next(err)`.
 */

import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import pinoHttpModule from 'pino-http';
// ESM interop: pino-http may export a default wrapper depending on the bundler.
const pinoHttp = pinoHttpModule.default ?? pinoHttpModule;

import { getEnv } from './config/env.config.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { AUDIO_FILE_PARAMS } from './config/constants.js';
import { createContainer } from './container.js';

/**
 * Create and configure the Express application.
 *
 * This function is side-effect-free with respect to the network — it does
 * **not** call `app.listen()`.  That responsibility belongs to `server.ts`.
 *
 * @returns A fully configured Express application, ready to listen.
 */
export function createApp() {
  const app = express();
  const env = getEnv();

  /* ── 1. CORS ───────────────────────────────────────────────────────── */
  const whitelist: string[] = [env.APP_HOST];
  if (env.APP_LOAD_BALANCER_HOST) whitelist.push(env.APP_LOAD_BALANCER_HOST);
  if (env.APP_CORS_EXTRA_WHITLISTS) {
    whitelist.push(...env.APP_CORS_EXTRA_WHITLISTS.split(',').map((s) => s.trim()));
  }

  app.use(cors({
    origin: whitelist,
    // Expose the auth-token header so the client can read it after login/update.
    exposedHeaders: ['auth-token'],
  }));

  /* ── 2. Body parsing ───────────────────────────────────────────────── */
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  /* ── 3. File upload ────────────────────────────────────────────────── */
  app.use(fileUpload({
    limits: { fileSize: AUDIO_FILE_PARAMS.MAX_FILE_SIZE },
    abortOnLimit: true,
  }));

  /* ── 4. HTTP request logging ───────────────────────────────────────── */
  const isProduction = env.PROFILE === 'production';
  app.use(pinoHttp({
    logger,
    // Only log every request automatically in production; in dev the
    // console is already verbose enough from other sources.
    autoLogging: isProduction,
  }));

  /* ── 5. DI container → v1 API routes ───────────────────────────────── */
  const { routers } = createContainer();

  app.use('/api/v1/admin', routers.adminRouter);
  app.use('/api/v1/audio', routers.audioRouter);
  app.use('/api/v1/user', routers.userRouter);
  app.use('/api/v1/analytic', routers.analyticRouter);
  app.use('/api/v1/tasks', routers.taskRouter);
  app.use('/api/v1/tasks/:taskId/drafts', routers.audioDraftRouter);
  app.use('/api/v1/themes', routers.themeRouter);

  /* ── 6. Backward-compatible aliases (legacy paths) ─────────────────── */
  app.use('/admin', routers.adminRouter);
  app.use('/audio', routers.audioRouter);
  app.use('/user', routers.userRouter);
  app.use('/analytic', routers.analyticRouter);

  /* ── 7. Centralised error handler (must be registered last) ────────── */
  app.use(errorHandler);

  return app;
}
