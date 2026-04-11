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
export type { ITaskRepository, TaskFilters } from './task.repository.js';
export type { IAudioDraftRepository, AudioDraftFilters } from './audio-draft.repository.js';
export type { IThemeRepository } from './theme.repository.js';
export type { IActivityLogRepository } from './activity-log.repository.js';
