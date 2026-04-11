/**
 * @file index.ts
 * @description Barrel re-export for all repository interfaces.
 *
 * Import from this file so consumers have a single, stable import path:
 * ```ts
 * import type { IAdminRepository } from '../repositories/interfaces/index.js';
 * ```
 */

export type { IAdminRepository } from './admin.repository.js';
export type { IAudioRepository } from './audio.repository.js';
export type { IUserRepository } from './user.repository.js';
export type { IAnalyticRepository } from './analytic.repository.js';
