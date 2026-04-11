/**
 * @file database.ts
 * @description MongoDB connection management via Mongoose.
 *
 * Exposes two functions:
 * - `connectDatabase()` — called once at startup in `server.ts`.
 * - `disconnectDatabase()` — called during graceful shutdown.
 *
 * The connection string is built by replacing placeholders in the
 * `DB_CONNECTION` env variable with the actual credentials.
 * Credentials are URI-encoded to handle special characters safely.
 */

import mongoose from 'mongoose';

import { getEnv } from '../config/env.config.js';
import { logger } from './logger.js';

/**
 * Opens a single Mongoose connection to MongoDB.
 *
 * The connection string template from the environment is expected to contain
 * `<username>`, `<password>`, and `<db_name>` placeholders that are replaced
 * at runtime with the corresponding env values.
 *
 * Mongoose event listeners are registered **before** `connect()` so that
 * connection-level events (errors, reconnects) are always logged.
 *
 * @throws {Error} If MongoDB is unreachable or the credentials are wrong.
 */
export async function connectDatabase(): Promise<void> {
  const env = getEnv();

  // Build the final connection string from the template + credentials.
  const connectionString = env.DB_CONNECTION
    .replace('<username>', encodeURIComponent(env.MONGODB_USERNAME))
    .replace('<password>', encodeURIComponent(env.MONGODB_PASSWORD))
    .replace('<db_name>', encodeURIComponent(env.MONGODB_DB_NAME));

  // Register event listeners before connecting so we never miss an event.
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(connectionString);
}

/**
 * Gracefully closes the Mongoose connection.
 *
 * Called during server shutdown (SIGTERM / SIGINT) to ensure that
 * in-flight operations are completed before the process exits.
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}
