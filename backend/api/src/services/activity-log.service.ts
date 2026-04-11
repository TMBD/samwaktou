/**
 * @file activity-log.service.ts
 * @description Business-logic service for ActivityLog management.
 *
 * Activity logs are an immutable audit trail — this service only exposes
 * **create** and **query** operations; no updates or deletes.
 *
 * Every significant action on tasks, audio drafts, and themes is recorded
 * with the performer's ID, the action name, and optional details.
 *
 * @see IActivityLogRepository for the data-access contract.
 */

import type { ActivityEntityType, IActivityLog, IActivityLogCreate } from '../models/interfaces/index.js';
import type { IActivityLogRepository } from '../repositories/interfaces/index.js';

export class ActivityLogService {
  constructor(private readonly logRepo: IActivityLogRepository) {}

  /**
   * Record a new activity log entry.
   *
   * This is the primary method called by other services (TaskService,
   * ThemeService) after every state change or significant action.
   *
   * @param entry - The log data to persist (entityType, entityId, action, performedBy, details).
   * @returns The created log entry.
   */
  async log(entry: IActivityLogCreate): Promise<IActivityLog> {
    return this.logRepo.create(entry);
  }

  /**
   * Convenience wrapper for logging a task-related action.
   *
   * @param taskId      - The task ID.
   * @param action      - Action name (e.g. "TASK_CREATED", "TASK_ASSIGNED").
   * @param performedBy - Admin ID of the actor.
   * @param details     - Optional key-value context (e.g. `{ oldStatus, newStatus }`).
   */
  async logTaskAction(
    taskId: string,
    action: string,
    performedBy: string,
    details: Record<string, unknown> = {},
  ): Promise<IActivityLog> {
    return this.log({
      entityType: 'task',
      entityId: taskId,
      action,
      performedBy,
      details,
    });
  }

  /**
   * Convenience wrapper for logging an audio-draft-related action.
   *
   * @param draftId     - The audio draft ID.
   * @param action      - Action name (e.g. "DRAFT_APPROVED", "DRAFT_REJECTED").
   * @param performedBy - Admin ID of the actor.
   * @param details     - Optional key-value context.
   */
  async logDraftAction(
    draftId: string,
    action: string,
    performedBy: string,
    details: Record<string, unknown> = {},
  ): Promise<IActivityLog> {
    return this.log({
      entityType: 'audio_draft',
      entityId: draftId,
      action,
      performedBy,
      details,
    });
  }

  /**
   * Convenience wrapper for logging a theme-related action.
   *
   * @param themeId     - The theme ID.
   * @param action      - Action name (e.g. "THEME_CREATED", "THEME_VALIDATED").
   * @param performedBy - Admin ID of the actor.
   * @param details     - Optional key-value context.
   */
  async logThemeAction(
    themeId: string,
    action: string,
    performedBy: string,
    details: Record<string, unknown> = {},
  ): Promise<IActivityLog> {
    return this.log({
      entityType: 'theme',
      entityId: themeId,
      action,
      performedBy,
      details,
    });
  }

  /**
   * Return the activity log for a given entity, sorted newest-first.
   *
   * @param entityType - The kind of entity (task, audio_draft, theme).
   * @param entityId   - The ID of the entity.
   * @param skip       - Offset for pagination.
   * @param limit      - Max records to return.
   */
  async findByEntity(
    entityType: ActivityEntityType,
    entityId: string,
    skip: number,
    limit: number,
  ): Promise<IActivityLog[]> {
    return this.logRepo.findByEntity(entityType, entityId, skip, limit);
  }
}
