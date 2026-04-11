/**
 * @file server.ts
 * @description Application entry point.
 *
 * Orchestrates the startup sequence:
 * 1. Validate environment variables (fail-fast on misconfiguration).
 * 2. Open a persistent MongoDB connection.
 * 3. Build the Express application via `createApp()`.
 * 4. Bind the HTTP server to the configured port.
 * 5. Register POSIX signal handlers for graceful shutdown.
 *
 * If any step in `main()` throws, the process exits with code 1 and a
 * `fatal`-level Pino log so the container orchestrator can restart it.
 */

import { validateEnv, getEnv } from './config/env.config.js';
import { logger } from './lib/logger.js';
import { connectDatabase, disconnectDatabase } from './lib/database.js';
import { createApp } from './app.js';

/**
 * Boot the application.  Each numbered step must succeed before the next
 * one runs; an unhandled error in any step is caught by the top-level
 * `.catch()` and results in a fatal log + `process.exit(1)`.
 */
async function main(): Promise<void> {
  // 1. Validate environment — throws on missing or malformed variables.
  validateEnv();
  const env = getEnv();

  // 2. Open a persistent MongoDB connection (used by all repositories).
  await connectDatabase();

  // 3. Assemble Express app (middleware + DI-wired routes).
  const app = createApp();

  // 4. Start the HTTP server on the configured port.
  const port = parseInt(env.PORT, 10);
  const server = app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });

  // 5. Graceful shutdown: stop accepting new connections, then close the DB.
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/* ── Top-level bootstrap ─────────────────────────────────────────────── */
main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});