/**
 * @file env.config.ts
 * @description Centralized environment variable validation using Zod.
 *
 * This module defines the expected shape of all environment variables via a
 * Zod schema. On application startup, `validateEnv()` must be called once
 * before any other module accesses environment values through `getEnv()`.
 *
 * If a required variable is missing or has an invalid format, the application
 * will fail fast with a descriptive error listing every invalid field.
 */

import { z } from 'zod';

/**
 * Zod schema describing every environment variable the application needs.
 * Grouped by domain concern for readability.
 */
const envSchema = z.object({
  /* ── Database ───────────────────────────────────────────────────────── */
  /** MongoDB connection string template (contains <username>, <password>, <db_name> placeholders). */
  DB_CONNECTION: z.string().min(1),
  MONGODB_USERNAME: z.string().min(1),
  MONGODB_PASSWORD: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1),

  /* ── Authentication secrets ─────────────────────────────────────────── */
  /** Secret key used to sign and verify admin JWT tokens (HS256). */
  ADMIN_TOKEN_SECRET: z.string().min(1),
  /** Secret key used to sign and verify user JWT tokens (HS256). */
  USER_TOKEN_SECRET: z.string().min(1),

  /* ── AWS S3 / Object Storage ────────────────────────────────────────── */
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  /** ARN of the S3 access point, or plain bucket name in dev mode. */
  S3_ACCESS_POINT_ARN: z.string().min(1),
  /** S3-compatible endpoint URL — used only in development (e.g. LocalStack, MinIO). */
  S3_HOST: z.string().optional(),

  /* ── Root admin seed ────────────────────────────────────────────────── */
  /** Hard-coded root admin used as a fallback when no admin exists in the DB yet. */
  ROOT_ADMIN_ID: z.string().min(1),
  ROOT_ADMIN_SURNAME: z.string().min(1),
  ROOT_ADMIN_NAME: z.string().min(1),
  ROOT_ADMIN_EMAIL: z.string().email(),
  ROOT_ADMIN_DATE: z.string().min(1),
  /** Root admin password — must already be bcrypt-hashed. */
  ROOT_ADMIN_PASSWORD: z.string().min(1),

  /* ── CORS & Networking ──────────────────────────────────────────────── */
  /** Primary frontend host allowed by CORS (e.g. "https://example.com"). */
  APP_HOST: z.string().min(1),
  /** Optional load-balancer host to add to the CORS whitelist. */
  APP_LOAD_BALANCER_HOST: z.string().optional(),
  /** Comma-separated list of additional origins to whitelist for CORS. */
  APP_CORS_EXTRA_WHITLISTS: z.string().optional(),

  /* ── Application ────────────────────────────────────────────────────── */
  /** Runtime profile: "production" enables optimized logging; any other value is treated as development. */
  PROFILE: z.string().optional(),
  /** HTTP port the server listens on. Defaults to 8080. */
  PORT: z.string().optional().default('8080'),
});

/** TypeScript type inferred from the Zod schema — provides full autocompletion. */
export type Env = z.infer<typeof envSchema>;

/**
 * Module-level cache for the validated environment.
 * Populated once by `validateEnv()` and read many times by `getEnv()`.
 */
let _validatedEnv: Env | null = null;

/**
 * Parses and validates `process.env` against the Zod schema.
 *
 * **Must be called exactly once**, at the very beginning of the server
 * startup sequence (before any other module calls `getEnv()`).
 *
 * @returns The validated environment object.
 * @throws {Error} If one or more environment variables are missing or invalid.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Build a human-readable list of every validation issue
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`❌ Invalid environment variables:\n${formatted}`);
  }

  _validatedEnv = result.data;
  return _validatedEnv;
}

/**
 * Returns the previously validated environment object.
 *
 * This is the **only** way other modules should access env values.
 * It guarantees that all values have been checked before use.
 *
 * @returns The validated environment object.
 * @throws {Error} If `validateEnv()` has not been called yet.
 */
export function getEnv(): Env {
  if (!_validatedEnv) {
    throw new Error(
      'Environment not validated yet. Call validateEnv() at the start of server.ts before importing any other module.',
    );
  }
  return _validatedEnv;
}
