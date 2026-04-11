/**
 * @file task.service.ts
 * @description Business-logic service for the Task workflow.
 *
 * This is the core service of Phase 2. It implements the full task state
 * machine, content-state recalculation, and the publish / unpublish flows.
 *
 * ## State machine
 *
 * ```
 * OPEN → IN_PROGRESS (assign)
 * IN_PROGRESS → READY_FOR_REVIEW (submit) | OPEN (unassign)
 * READY_FOR_REVIEW → IN_REVIEW (pick) | OPEN (unassign by reviewer)
 * IN_REVIEW → APPROVED | CORRECTIONS_NEEDED | REJECTED
 * CORRECTIONS_NEEDED → IN_PROGRESS (re-pick by contributor)
 * APPROVED → PUBLISHED (publish)
 * PUBLISHED → APPROVED (unpublish, SysAdmin only)
 * REJECTED → (terminal)
 * ```
 *
 * ## Four-eyes principle
 *
 * A Reviewer cannot approve / reject a task they previously worked on
 * (as assignee or previousAssignee). Publishers and SysAdmins are exempt.
 *
 * @see TaskStatus      for the finite state machine definition.
 * @see ITaskRepository  for the data-access contract.
 */

import {
  AdminRole,
  AudioDraftStatus,
  TaskStatus,
  ROLE_HIERARCHY,
  FILE_LOCATION,
} from '../config/constants.js';
import { AppError } from '../lib/app-error.js';
import type { ITask, ITaskCreate, IContentState, IAudioCreate } from '../models/interfaces/index.js';
import type { ITaskRepository, TaskFilters } from '../repositories/interfaces/index.js';
import type { IAudioDraftRepository } from '../repositories/interfaces/audio-draft.repository.js';
import type { IAudioRepository } from '../repositories/interfaces/audio.repository.js';
import type { StorageService } from './storage.service.js';
import type { ThemeService } from './theme.service.js';
import type { ActivityLogService } from './activity-log.service.js';

/* ── Helper: build a zeroed-out content state ────────────────────────── */

function emptyContentState(total: number): IContentState {
  return { total, done: 0, approved: 0, rejected: 0, correctionNeeded: 0, pending: total };
}

/* ── Helper: assert current status or throw 409 ──────────────────────── */

function assertStatus(task: ITask, ...expected: TaskStatus[]): void {
  if (!expected.includes(task.status)) {
    throw AppError.conflict(
      `Action impossible : le statut actuel est "${task.status}", attendu : ${expected.map((s) => `"${s}"`).join(' ou ')}.`,
    );
  }
}

/* ── Helper: four-eyes check ─────────────────────────────────────────── */

/**
 * Enforce the four-eyes principle for reviewers.
 * Publishers and SysAdmins are exempt.
 */
function enforceFourEyes(task: ITask, adminId: string, adminRole: AdminRole): void {
  const isExempt = ROLE_HIERARCHY[adminRole] <= ROLE_HIERARCHY[AdminRole.PUBLISHER];
  if (isExempt) return;

  const wasInvolved =
    task.assignee === adminId ||
    task.previousAssignee === adminId;

  if (wasInvolved) {
    throw AppError.forbidden(
      'Principe des quatre yeux : vous ne pouvez pas examiner une tâche sur laquelle vous avez travaillé.',
    );
  }
}

/* ── File info extracted from an uploaded file ───────────────────────── */

/** Shape of a single uploaded audio file passed to {@link TaskService.create}. */
export interface UploadedFile {
  /** Raw file buffer. */
  data: Buffer;
  /** Original file name (e.g. "sermon_part1.mp3"). */
  name: string;
  /** MIME type (e.g. "audio/mpeg"). */
  mimetype: string;
  /** Per-file metadata provided alongside the upload. */
  meta: {
    description: string;
    theme: string;
    keywords: string;
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  TaskService                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

export class TaskService {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly draftRepo: IAudioDraftRepository,
    private readonly audioRepo: IAudioRepository,
    private readonly storageService: StorageService,
    private readonly themeService: ThemeService,
    private readonly activityLog: ActivityLogService,
  ) {}

  /* ── Queries ───────────────────────────────────────────────────────── */

  /** Return a single task by ID, or throw 404. */
  async findById(id: string): Promise<ITask> {
    const task = await this.taskRepo.findById(id);
    if (!task) throw AppError.notFound('Tâche introuvable.');
    return task;
  }

  /**
   * Return a paginated, filtered list of tasks.
   *
   * @param filter - Optional filters (status, assignee, createdBy, sessionAuthor, date range).
   * @param skip   - Offset for pagination.
   * @param limit  - Max records to return.
   */
  async findMany(
    filter: TaskFilters,
    skip: number,
    limit: number,
  ): Promise<{ data: ITask[]; total: number }> {
    const [data, total] = await Promise.all([
      this.taskRepo.findMany(filter, skip, limit),
      this.taskRepo.count(filter),
    ]);
    return { data, total };
  }

  /* ── Create ────────────────────────────────────────────────────────── */

  /**
   * Create a new task with its associated audio drafts.
   *
   * Flow:
   * 1. Create the Task document (status = OPEN).
   * 2. For each uploaded file:
   *    a. Resolve or create the theme via ThemeService.
   *    b. Upload the file to S3 under `drafts/<taskId>/<draftId>.<ext>`.
   *    c. Create the AudioDraft document.
   * 3. Update the task's contentState with the initial counts.
   *
   * @param input  - Task metadata (description, sessionAuthor, sessionDate).
   * @param files  - Array of uploaded audio files with per-file metadata.
   * @param admin  - The authenticated admin performing the action.
   */
  async create(
    input: { description: string; sessionAuthor: string; sessionDate: Date },
    files: UploadedFile[],
    admin: { id: string; role: AdminRole },
  ): Promise<ITask> {
    if (files.length === 0) {
      throw AppError.badRequest('Au moins un fichier audio est requis.');
    }

    // 1. Create the task shell.
    const taskData: ITaskCreate = {
      description: input.description,
      sessionAuthor: input.sessionAuthor.toUpperCase(),
      sessionDate: input.sessionDate,
      status: TaskStatus.OPEN,
      assignee: null,
      previousAssignee: null,
      createdBy: admin.id,
      reviewedBy: null,
      contentState: emptyContentState(files.length),
      rejectionReason: null,
      taskRejectionSuggested: false,
      taskRejectionSuggestedReason: null,
      publishedAudioIds: [],
    };

    const task = await this.taskRepo.create(taskData);

    // 2. Process each file: resolve theme → upload to S3 → create draft.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop() ?? 'mp3';

      // Resolve or create the theme.
      const { theme, isNew } = await this.themeService.getOrCreate(
        file.meta.theme,
        admin.id,
        admin.role,
      );

      // We need a temporary ID for the S3 key — use a placeholder, then update.
      // Create the draft first to get its real ID.
      const draft = await this.draftRepo.create({
        task: task.id,
        uri: '', // Placeholder — will be updated after S3 upload.
        originalFileName: file.name,
        description: file.meta.description,
        theme: theme.name,
        keywords: file.meta.keywords,
        status: AudioDraftStatus.PENDING,
        isNewTheme: isNew,
        rejectionSuggestedReason: null,
        reviewComment: null,
        correctionComment: null,
        order: i + 1,
      });

      // Upload to S3 with the real draft ID.
      const s3Key = `${FILE_LOCATION.DRAFT_FILE_LOCATION}${task.id}/${draft.id}.${ext}`;
      await this.storageService.uploadByKey(file.data, s3Key);

      // Update the draft with the actual S3 URI.
      await this.draftRepo.updateById(draft.id, { uri: s3Key });
    }

    // 3. Log the creation.
    await this.activityLog.logTaskAction(task.id, 'TASK_CREATED', admin.id, {
      draftCount: files.length,
    });

    // Return the task with the final contentState.
    return this.findById(task.id);
  }

  /* ── State transitions ─────────────────────────────────────────────── */

  /**
   * Self-assign an OPEN task to the requesting contributor.
   * Transition: OPEN → IN_PROGRESS
   */
  async assign(taskId: string, adminId: string): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.OPEN);

    if (task.assignee) {
      throw AppError.conflict('Cette tâche est déjà assignée.');
    }

    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.IN_PROGRESS,
      assignee: adminId,
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_ASSIGNED', adminId, {
      oldStatus: task.status,
      newStatus: TaskStatus.IN_PROGRESS,
    });

    return updated!;
  }

  /**
   * Unassign a task back to the backlog.
   * Transition: IN_PROGRESS | READY_FOR_REVIEW → OPEN
   */
  async unassign(taskId: string, adminId: string): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.IN_PROGRESS, TaskStatus.READY_FOR_REVIEW);

    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.OPEN,
      previousAssignee: task.assignee,
      assignee: null,
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_UNASSIGNED', adminId, {
      oldStatus: task.status,
      newStatus: TaskStatus.OPEN,
      previousAssignee: task.assignee,
    });

    return updated!;
  }

  /**
   * Reassign a task to a different admin.
   * Transition: IN_PROGRESS → IN_PROGRESS (new assignee)
   */
  async reassign(taskId: string, newAssigneeId: string, adminId: string): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.IN_PROGRESS, TaskStatus.READY_FOR_REVIEW);

    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.IN_PROGRESS,
      previousAssignee: task.assignee,
      assignee: newAssigneeId,
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_REASSIGNED', adminId, {
      oldAssignee: task.assignee,
      newAssignee: newAssigneeId,
    });

    return updated!;
  }

  /**
   * Submit a task for review.
   * Transition: IN_PROGRESS → READY_FOR_REVIEW
   *
   * Prerequisite: all drafts must be DONE or REJECTION_SUGGESTED.
   */
  async submit(taskId: string, adminId: string): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.IN_PROGRESS);

    // Verify all drafts have been processed by the contributor.
    const drafts = await this.draftRepo.findByTask(taskId);
    const allProcessed = drafts.every(
      (d) => d.status === AudioDraftStatus.DONE || d.status === AudioDraftStatus.REJECTION_SUGGESTED,
    );

    if (!allProcessed) {
      throw AppError.conflict(
        'Tous les brouillons doivent être marqués comme "terminé" ou "rejet suggéré" avant la soumission.',
      );
    }

    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.READY_FOR_REVIEW,
      previousAssignee: task.assignee,
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_SUBMITTED', adminId, {
      oldStatus: task.status,
      newStatus: TaskStatus.READY_FOR_REVIEW,
    });

    return updated!;
  }

  /**
   * Pick a task for review.
   * Transition: READY_FOR_REVIEW → IN_REVIEW
   *
   * Enforces the four-eyes principle for Reviewers.
   */
  async pickForReview(taskId: string, adminId: string, adminRole: AdminRole): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.READY_FOR_REVIEW);
    enforceFourEyes(task, adminId, adminRole);

    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.IN_REVIEW,
      reviewedBy: adminId,
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_PICKED_FOR_REVIEW', adminId, {
      oldStatus: task.status,
      newStatus: TaskStatus.IN_REVIEW,
    });

    return updated!;
  }

  /**
   * Approve a task after review.
   * Transition: IN_REVIEW → APPROVED
   *
   * Prerequisite: all drafts must be APPROVED or REJECTED.
   */
  async approve(taskId: string, adminId: string, adminRole: AdminRole): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.IN_REVIEW);
    enforceFourEyes(task, adminId, adminRole);

    // Verify all drafts have a terminal review status.
    const drafts = await this.draftRepo.findByTask(taskId);
    const allReviewed = drafts.every(
      (d) => d.status === AudioDraftStatus.APPROVED || d.status === AudioDraftStatus.REJECTED,
    );

    if (!allReviewed) {
      throw AppError.conflict(
        'Tous les brouillons doivent être approuvés ou rejetés avant d\'approuver la tâche.',
      );
    }

    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.APPROVED,
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_APPROVED', adminId, {
      oldStatus: task.status,
      newStatus: TaskStatus.APPROVED,
    });

    return updated!;
  }

  /**
   * Request corrections on a task.
   * Transition: IN_REVIEW → CORRECTIONS_NEEDED
   *
   * Reassigns the task to the previousAssignee (or leaves unassigned).
   */
  async requestCorrections(taskId: string, adminId: string): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.IN_REVIEW);

    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.CORRECTIONS_NEEDED,
      assignee: task.previousAssignee, // Re-assign to previous contributor (may be null).
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_CORRECTIONS_REQUESTED', adminId, {
      oldStatus: task.status,
      newStatus: TaskStatus.CORRECTIONS_NEEDED,
      reassignedTo: task.previousAssignee,
    });

    return updated!;
  }

  /**
   * Reject a task.
   * Transition: IN_REVIEW → REJECTED (terminal)
   *
   * @param taskId - The task ID.
   * @param adminId - The reviewer's admin ID.
   * @param reason  - Mandatory rejection reason.
   */
  async reject(taskId: string, adminId: string, reason: string): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.IN_REVIEW);

    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.REJECTED,
      rejectionReason: reason,
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_REJECTED', adminId, {
      oldStatus: task.status,
      newStatus: TaskStatus.REJECTED,
      reason,
    });

    return updated!;
  }

  /**
   * Suggest rejection of a task (contributor action).
   * Does NOT change the task status — just flags it for reviewer attention.
   */
  async suggestRejection(taskId: string, adminId: string, reason: string): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.IN_PROGRESS);

    const updated = await this.taskRepo.updateById(taskId, {
      taskRejectionSuggested: true,
      taskRejectionSuggestedReason: reason,
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_REJECTION_SUGGESTED', adminId, { reason });

    return updated!;
  }

  /* ── Publish / Unpublish ───────────────────────────────────────────── */

  /**
   * Publish an approved task.
   * Transition: APPROVED → PUBLISHED
   *
   * For each APPROVED draft:
   * 1. Copy the draft S3 file to the published audio prefix.
   * 2. Create an Audio document linked back to the task.
   * 3. Record the published audio IDs on the task.
   */
  async publish(taskId: string, adminId: string): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.APPROVED);

    const drafts = await this.draftRepo.findByTask(taskId);
    const approvedDrafts = drafts.filter((d) => d.status === AudioDraftStatus.APPROVED);

    const publishedAudioIds: string[] = [];

    for (const draft of approvedDrafts) {
      // 1. Create the Audio document first to get its ID.
      const audioData: IAudioCreate = {
        uri: '', // Placeholder — updated after S3 copy.
        theme: draft.theme,
        author: task.sessionAuthor,
        description: draft.description,
        keywords: draft.keywords,
        date: task.sessionDate,
        taskId: task.id,
      };
      const audio = await this.audioRepo.create(audioData);

      // 2. Copy draft file to published location.
      const ext = draft.originalFileName.split('.').pop() ?? 'mp3';
      const publishedKey = `${FILE_LOCATION.AUDIO_FILE_LOCATION}${audio.id}.${ext}`;
      await this.storageService.copyFile(draft.uri, publishedKey);

      // 3. Update the Audio document with the real URI.
      await this.audioRepo.updateById(audio.id, { uri: publishedKey });

      publishedAudioIds.push(audio.id);
    }

    // 4. Update the task with published IDs and new status.
    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.PUBLISHED,
      publishedAudioIds,
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_PUBLISHED', adminId, {
      oldStatus: task.status,
      newStatus: TaskStatus.PUBLISHED,
      publishedCount: publishedAudioIds.length,
    });

    return updated!;
  }

  /**
   * Unpublish a published task (SysAdmin only).
   * Transition: PUBLISHED → APPROVED
   *
   * For each published audio:
   * 1. Delete the published S3 file.
   * 2. Delete the Audio document.
   * 3. Clear `publishedAudioIds` on the task.
   */
  async unpublish(taskId: string, adminId: string): Promise<ITask> {
    const task = await this.findById(taskId);
    assertStatus(task, TaskStatus.PUBLISHED);

    // Delete all published audio documents and their S3 files.
    for (const audioId of task.publishedAudioIds) {
      const audio = await this.audioRepo.findById(audioId);
      if (audio) {
        // Delete the S3 file using the full key.
        await this.storageService.deleteByKey(audio.uri);
        await this.audioRepo.deleteById(audioId);
      }
    }

    const updated = await this.taskRepo.updateById(taskId, {
      status: TaskStatus.APPROVED,
      publishedAudioIds: [],
    });

    await this.activityLog.logTaskAction(taskId, 'TASK_UNPUBLISHED', adminId, {
      oldStatus: task.status,
      newStatus: TaskStatus.APPROVED,
      deletedAudioCount: task.publishedAudioIds.length,
    });

    return updated!;
  }

  /* ── Delete ────────────────────────────────────────────────────────── */

  /**
   * Hard-delete a task and all its associated data.
   *
   * 1. Delete all draft S3 files.
   * 2. Delete all AudioDraft documents.
   * 3. Delete the Task document.
   */
  async deleteById(taskId: string, adminId: string): Promise<void> {
    const task = await this.findById(taskId);

    // Delete draft files from S3.
    const drafts = await this.draftRepo.findByTask(taskId);
    for (const draft of drafts) {
      if (draft.uri) {
        await this.storageService.deleteByKey(draft.uri);
      }
    }

    // Delete draft documents.
    await this.draftRepo.deleteByTask(taskId);

    // Delete the task document.
    await this.taskRepo.deleteById(taskId);

    await this.activityLog.logTaskAction(taskId, 'TASK_DELETED', adminId, {
      previousStatus: task.status,
    });
  }

  /* ── Content state recalculation ───────────────────────────────────── */

  /**
   * Recalculate and persist the task's `contentState` by aggregating
   * all audio-draft statuses.
   *
   * Called after every draft status change by the route handlers.
   *
   * @param taskId - The parent task ID.
   * @returns The updated task with the refreshed contentState.
   */
  async recalculateContentState(taskId: string): Promise<ITask> {
    const statusCounts = await this.draftRepo.countByStatus(taskId);

    const contentState: IContentState = {
      total: Object.values(statusCounts).reduce((sum, n) => sum + n, 0),
      done: statusCounts[AudioDraftStatus.DONE] ?? 0,
      approved: statusCounts[AudioDraftStatus.APPROVED] ?? 0,
      rejected: statusCounts[AudioDraftStatus.REJECTED] ?? 0,
      correctionNeeded: statusCounts[AudioDraftStatus.CORRECTIONS_NEEDED] ?? 0,
      pending: statusCounts[AudioDraftStatus.PENDING] ?? 0,
    };

    const updated = await this.taskRepo.updateById(taskId, { contentState });
    return updated!;
  }
}
