/**
 * @file logger.ts
 * @description Structured logging singleton powered by Pino.
 *
 * - **Production** (`PROFILE=production`): JSON output at `info` level,
 *   suitable for log aggregation tools (Datadog, ELK, etc.).
 * - **Development** (any other value): Human-readable coloured output via
 *   `pino-pretty` at `debug` level for easier local debugging.
 *
 * Usage:
 * ```ts
 * import { logger } from '../lib/logger.js';
 * logger.info('Server started');
 * logger.error({ err }, 'Something went wrong');
 * ```
 */

import pino from 'pino';

/** `true` when running with the production profile — controls log format and verbosity. */
const isProduction = process.env.PROFILE === 'production';

/**
 * Application-wide Pino logger instance.
 *
 * Do **not** create additional loggers — always import this singleton so
 * that all log entries share the same configuration and destination.
 */
export const logger = pino({
  level: isProduction ? 'info' : 'debug',

  // In dev mode, pipe through pino-pretty for coloured, human-readable logs.
  // In production, omit the transport so Pino outputs raw JSON to stdout.
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }),
});

/** Convenience type alias if other modules need to type-hint the logger. */
export type Logger = typeof logger;
