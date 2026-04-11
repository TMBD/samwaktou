/**
 * @file admin.validators.ts
 * @description Zod schemas for validating admin-related HTTP request bodies.
 *
 * Each schema is used via the `validate` middleware before the route handler
 * runs, so the handler can trust that `req.body` has already been parsed and
 * coerced to the correct types.
 *
 * Phase 1 changes:
 * - `isSuperAdmin` replaced by `role` (AdminRole enum) in create/update schemas.
 * - Added `isActive` boolean to the update schema.
 */

import { z } from 'zod';
import { AdminRole } from '../config/constants.js';

/**
 * Zod enum derived from the `AdminRole` TypeScript enum.
 * Reused in both create and update schemas for DRY validation.
 */
const adminRoleEnum = z.nativeEnum(AdminRole);

/** Schema for `POST /admins` — create a new admin account. */
export const createAdminSchema = z.object({
  surname: z.string().min(2).max(100),
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(6).max(1024),
  /** Optional RBAC role — defaults to CONTRIBUTOR in the service layer. */
  role: adminRoleEnum.optional(),
});

/**
 * Schema for `PUT /admins/:id` — partial update of admin profile.
 *
 * At least one field must be provided (enforced by the `.refine()` check).
 */
export const updateAdminSchema = z.object({
  surname: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(255).optional(),
  role: adminRoleEnum.optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.values(data).some((v) => v !== undefined), {
  message: 'At least one field must be provided.',
});

/** Schema for `POST /admins/login` — admin authentication. */
export const loginAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Schema for `PUT /admins/:id/password` — change admin password. */
export const updatePasswordSchema = z.object({
  password: z.string().min(1),
  newPassword: z.string().min(6).max(1024),
});
