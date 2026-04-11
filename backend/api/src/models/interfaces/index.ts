/**
 * @file index.ts
 * @description Barrel re-export for all domain model interfaces.
 *
 * Import from this file instead of individual interface files so that
 * consumers have a single, stable import path:
 *
 * ```ts
 * import type { IAdmin, IAudio } from '../models/interfaces/index.js';
 * ```
 */

export type { IAdmin, IAdminCreate, IAdminUpdate } from './admin.interface.js';
export type { IAudio, IAudioCreate, IAudioUpdate } from './audio.interface.js';
export type { IUser, IUserCreate, IUserUpdate } from './user.interface.js';
export type { IAnalytic, IAnalyticCreate, EventName } from './analytic.interface.js';
