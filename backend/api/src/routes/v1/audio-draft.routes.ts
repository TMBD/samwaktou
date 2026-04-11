/**
 * @file audio-draft.routes.ts
 * @description Express route definitions for audio-draft management.
 *
 * Audio drafts are nested under their parent task:
 * `/api/v1/tasks/:taskId/drafts`
 *
 * All routes require admin authentication. Role requirements vary:
 *
 * | Method | Path                          | Min Role    | Description                        |
 * |--------|-------------------------------|-------------|------------------------------------|
 * | GET    | /                             | CONTRIBUTOR | List all drafts for a task         |
 * | GET    | /:draftId                     | CONTRIBUTOR | Get single draft                   |
 * | PATCH  | /:draftId                     | CONTRIBUTOR | Update draft metadata / mark DONE  |
 * | PATCH  | /:draftId/review              | REVIEWER    | Review a draft (approve/reject/…)  |
 * | GET    | /:draftId/stream              | CONTRIBUTOR | Stream draft audio (Range support) |
 * | GET    | /:draftId/download            | CONTRIBUTOR | Download draft audio file          |
 *
 * @see IAudioDraftRepository for data-access contract.
 * @see TaskService.recalculateContentState for post-update hook.
 */

import { Router } from 'express';
import type { Response, NextFunction } from 'express';

import { AdminRole } from '../../config/constants.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateDraftSchema, reviewDraftSchema } from '../../validators/audio-draft.validators.js';
import { AppError } from '../../lib/app-error.js';
import type { IAudioDraftRepository } from '../../repositories/interfaces/index.js';
import type { TaskService } from '../../services/task.service.js';
import type { ActivityLogService } from '../../services/activity-log.service.js';
import type { StorageService } from '../../services/storage.service.js';

/**
 * Factory that creates and returns the audio-draft router.
 *
 * This router is mounted at `/api/v1/tasks/:taskId/drafts` and uses
 * `mergeParams: true` so it can access `:taskId` from the parent route.
 *
 * @param draftRepo          - Repository for audio-draft CRUD operations.
 * @param taskService        - Used to recalculate contentState after draft changes.
 * @param activityLogService - Used to log draft actions.
 * @param storageService     - Used for streaming/downloading draft files.
 * @param verifyAdminToken   - Pre-built middleware that validates admin JWTs.
 */
export function createAudioDraftRouter(
  draftRepo: IAudioDraftRepository,
  taskService: TaskService,
  activityLogService: ActivityLogService,
  storageService: StorageService,
  verifyAdminToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
): Router {
  // `mergeParams: true` gives access to `:taskId` from the parent router.
  const router = Router({ mergeParams: true });

  /* ── GET /  — list all drafts for a task (Contributor+) ────────────── */
  router.get(
    '/',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        // Ensure the parent task exists.
        await taskService.findById(req.params.taskId);
        const drafts = await draftRepo.findByTask(req.params.taskId);
        res.json(drafts);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:draftId  — get single draft (Contributor+) ──────────────── */
  router.get(
    '/:draftId',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const draft = await draftRepo.findById(req.params.draftId);
        if (!draft || draft.task !== req.params.taskId) {
          throw AppError.notFound('Brouillon audio introuvable.');
        }
        res.json(draft);
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:draftId  — update draft metadata (Contributor+) ────────── */
  router.patch(
    '/:draftId',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    validate(updateDraftSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const draft = await draftRepo.findById(req.params.draftId);
        if (!draft || draft.task !== req.params.taskId) {
          throw AppError.notFound('Brouillon audio introuvable.');
        }

        const updated = await draftRepo.updateById(req.params.draftId, req.body);
        if (!updated) {
          throw AppError.notFound('Brouillon introuvable après mise à jour.');
        }

        // Recalculate the parent task's contentState if the status changed.
        if (req.body.status) {
          await taskService.recalculateContentState(req.params.taskId);
        }

        await activityLogService.logDraftAction(
          req.params.draftId,
          'DRAFT_UPDATED',
          req.authData!.id,
          { fields: Object.keys(req.body) },
        );

        res.json(updated);
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:draftId/review  — review a draft (Reviewer+) ──────────── */
  router.patch(
    '/:draftId/review',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    validate(reviewDraftSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const draft = await draftRepo.findById(req.params.draftId);
        if (!draft || draft.task !== req.params.taskId) {
          throw AppError.notFound('Brouillon audio introuvable.');
        }

        const updateData: Record<string, unknown> = { status: req.body.status };
        if (req.body.reviewComment !== undefined) updateData.reviewComment = req.body.reviewComment;
        if (req.body.correctionComment !== undefined) updateData.correctionComment = req.body.correctionComment;

        const updated = await draftRepo.updateById(req.params.draftId, updateData);
        if (!updated) {
          throw AppError.notFound('Brouillon introuvable après mise à jour.');
        }

        // Recalculate the parent task's contentState.
        await taskService.recalculateContentState(req.params.taskId);

        await activityLogService.logDraftAction(
          req.params.draftId,
          `DRAFT_${req.body.status}`,
          req.authData!.id,
          {
            reviewComment: req.body.reviewComment ?? null,
            correctionComment: req.body.correctionComment ?? null,
          },
        );

        res.json(updated);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:draftId/stream  — stream draft audio (Contributor+) ─────── */
  router.get(
    '/:draftId/stream',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const draft = await draftRepo.findById(req.params.draftId);
        if (!draft || draft.task !== req.params.taskId) {
          throw AppError.notFound('Brouillon audio introuvable.');
        }

        const metadata = await storageService.getFileMetadataByKey(draft.uri);
        const fileSize = metadata.ContentLength ?? 0;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

          const data = await storageService.getFileByKey(draft.uri, start, end);

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': data.length,
            'Content-Type': metadata.ContentType ?? 'audio/mpeg',
          });
          res.end(data);
        } else {
          const data = await storageService.getFileByKey(draft.uri, 0, fileSize - 1);
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': metadata.ContentType ?? 'audio/mpeg',
          });
          res.end(data);
        }
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:draftId/download  — download draft audio (Contributor+) ─── */
  router.get(
    '/:draftId/download',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const draft = await draftRepo.findById(req.params.draftId);
        if (!draft || draft.task !== req.params.taskId) {
          throw AppError.notFound('Brouillon audio introuvable.');
        }

        const stream = await storageService.downloadFileByKey(draft.uri);
        res.setHeader('Content-Disposition', `attachment; filename="${draft.originalFileName}"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        stream.pipe(res);
      } catch (err) { next(err); }
    },
  );

  return router;
}
