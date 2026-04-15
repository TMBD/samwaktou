/**
 * @file task.routes.ts
 * @description Express route definitions for task management (`/api/v1/tasks`).
 *
 * All routes require admin authentication. Role requirements vary:
 *
 * | Method | Path                            | Min Role    | Description                      |
 * |--------|---------------------------------|-------------|----------------------------------|
 * | POST   | /                               | PUBLISHER   | Create task + upload drafts      |
 * | GET    | /                               | CONTRIBUTOR | List tasks (filtered, paginated) |
 * | GET    | /:taskId                        | CONTRIBUTOR | Get single task                  |
 * | PATCH  | /:taskId/assign                 | CONTRIBUTOR | Self-assign an OPEN task         |
 * | PATCH  | /:taskId/unassign               | CONTRIBUTOR | Unassign back to backlog         |
 * | PATCH  | /:taskId/reassign               | PUBLISHER   | Reassign to another admin        |
 * | PATCH  | /:taskId/submit                 | CONTRIBUTOR | Submit for review                |
 * | PATCH  | /:taskId/pick-for-review        | REVIEWER    | Pick task for review             |
 * | PATCH  | /:taskId/approve                | REVIEWER    | Approve reviewed task            |
 * | PATCH  | /:taskId/request-corrections    | REVIEWER    | Request corrections              |
 * | PATCH  | /:taskId/reject                 | REVIEWER    | Reject task                      |
 * | PATCH  | /:taskId/suggest-rejection      | CONTRIBUTOR | Suggest rejection                |
 * | PATCH  | /:taskId/publish                | PUBLISHER   | Publish approved task            |
 * | PATCH  | /:taskId/unpublish              | SYSTEM_ADMIN| Unpublish published task         |
 * | DELETE | /:taskId                        | PUBLISHER   | Delete task + drafts + S3 files  |
 * | GET    | /:taskId/activity               | CONTRIBUTOR | Get task activity log            |
 *
 * @see TaskService for business logic.
 */

import { Router } from 'express';
import type { Response, NextFunction } from 'express';

import { AdminRole, HTTP_CODE } from '../../config/constants.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createTaskSchema,
  getTasksQuerySchema,
  rejectTaskSchema,
  suggestRejectionSchema,
  reassignTaskSchema,
} from '../../validators/task.validators.js';
import type { TaskService, UploadedFile } from '../../services/task.service.js';
import type { ActivityLogService } from '../../services/activity-log.service.js';
import { AppError } from '../../lib/app-error.js';

/**
 * Factory that creates and returns the task router.
 *
 * @param taskService       - Business-logic service for tasks.
 * @param activityLogService - Service for querying activity logs.
 * @param verifyAdminToken  - Pre-built middleware that validates admin JWTs.
 */
export function createTaskRouter(
  taskService: TaskService,
  activityLogService: ActivityLogService,
  verifyAdminToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
): Router {
  const router = Router();

  /* ── POST /  — create a new task + upload drafts (Publisher+) ──────── */
  router.post(
    '/',
    verifyAdminToken,
    requireRole(AdminRole.PUBLISHER),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        // Parse the JSON metadata — may arrive as a string when using multipart,
        // or as flat FormData fields from the frontend.
        const body = typeof req.body.metadata === 'string'
          ? JSON.parse(req.body.metadata)
          : req.body;

        // Collect uploaded files from express-fileupload.
        // The frontend sends files under "audioFiles", legacy clients may use "audio".
        const rawFiles = (req as unknown as {
          files?: Record<string, { data: Buffer; name: string; mimetype: string } |
            Array<{ data: Buffer; name: string; mimetype: string }>>;
        }).files;

        const rawAudio = rawFiles?.audioFiles ?? rawFiles?.audio;
        if (!rawAudio) {
          throw AppError.badRequest('Au moins un fichier audio est requis.');
        }

        // Normalise to an array (single file comes as an object, multiple as array).
        const fileArray = Array.isArray(rawAudio) ? rawAudio : [rawAudio];

        // Validate MIME types.
        for (const f of fileArray) {
          if (!f.mimetype.includes('audio')) {
            throw AppError.badRequest(`Le fichier "${f.name}" n'est pas un fichier audio valide.`);
          }
        }

        // If drafts metadata was not provided (frontend simple form),
        // auto-generate placeholder metadata from the uploaded files.
        if (!body.drafts) {
          body.drafts = fileArray.map((f) => ({
            description: body.description || f.name,
            theme: 'NON CLASSÉ',
            keywords: '',
          }));
        }

        // Validate the metadata with Zod.
        const result = createTaskSchema.safeParse(body);
        if (!result.success) {
          throw AppError.badRequest(
            'Données invalides. Veuillez renseigner correctement tous les champs.',
            result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
          );
        }
        const parsed = result.data;

        // Validate that the number of files matches the drafts metadata count.
        if (fileArray.length !== parsed.drafts.length) {
          throw AppError.badRequest(
            `Le nombre de fichiers (${fileArray.length}) ne correspond pas au nombre de métadonnées de brouillons (${parsed.drafts.length}).`,
          );
        }

        // Build UploadedFile array by pairing files with their metadata.
        const files: UploadedFile[] = fileArray.map((f, i) => ({
          data: f.data,
          name: f.name,
          mimetype: f.mimetype,
          meta: parsed.drafts[i],
        }));

        const task = await taskService.create(
          {
            description: parsed.description,
            sessionAuthor: parsed.sessionAuthor,
            sessionDate: parsed.sessionDate,
          },
          files,
          { id: req.authData!.id, role: req.authData!.role },
        );

        res.status(HTTP_CODE.CREATED).json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── GET /  — list tasks (Contributor+) ────────────────────────────── */
  router.get(
    '/',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    validate(getTasksQuerySchema, 'query'),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { skip, limit, ...filter } = req.query as unknown as {
          skip: number;
          limit: number;
          status?: string;
          assignee?: string;
          createdBy?: string;
          sessionAuthor?: string;
          minDate?: Date;
          maxDate?: Date;
        };

        const result = await taskService.findMany(filter as Parameters<TaskService['findMany']>[0], skip, limit);
        res.json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            skip,
            limit,
            hasMore: skip + result.data.length < result.total,
          },
        });
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:taskId  — get single task (Contributor+) ────────────────── */
  router.get(
    '/:taskId',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const task = await taskService.findById(req.params.taskId);
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/assign  — self-assign (Contributor+) or assign to someone (Publisher+) */
  router.patch(
    '/:taskId/assign',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const callerRole = req.authData!.role;
        const callerIsPublisherPlus =
          callerRole === AdminRole.SYSTEM_ADMIN || callerRole === AdminRole.PUBLISHER;

        // Publisher+ may assign to someone else via body.assigneeId
        let targetAdminId = req.authData!.id;
        if (req.body?.assigneeId) {
          if (!callerIsPublisherPlus) {
            throw AppError.forbidden('Seuls les éditeurs ou administrateurs système peuvent assigner une tâche à un autre utilisateur.');
          }
          targetAdminId = req.body.assigneeId;
        }

        const task = await taskService.assign(req.params.taskId, targetAdminId);

        // Log who performed the action (may differ from the assignee)
        if (targetAdminId !== req.authData!.id) {
          await activityLogService.logTaskAction(req.params.taskId, 'TASK_ASSIGNED_BY_ADMIN', req.authData!.id, {
            assignedTo: targetAdminId,
          });
        }

        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/unassign  — unassign self (Contributor+) or anyone (Publisher+) */
  router.patch(
    '/:taskId/unassign',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const callerRole = req.authData!.role;
        const callerIsPublisherPlus =
          callerRole === AdminRole.SYSTEM_ADMIN || callerRole === AdminRole.PUBLISHER;

        // Contributor can only unassign themselves
        if (!callerIsPublisherPlus) {
          const currentTask = await taskService.findById(req.params.taskId);
          if (currentTask.assignee !== req.authData!.id) {
            throw AppError.forbidden('Vous ne pouvez désassigner que vous-même.');
          }
        }

        const task = await taskService.unassign(req.params.taskId, req.authData!.id);
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/reassign  — reassign (Publisher+) ──────────────── */
  router.patch(
    '/:taskId/reassign',
    verifyAdminToken,
    requireRole(AdminRole.PUBLISHER),
    validate(reassignTaskSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { assigneeId } = req.body;
        const task = await taskService.reassign(req.params.taskId, assigneeId, req.authData!.id);
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/submit  — submit for review (Contributor+) ─────── */
  router.patch(
    '/:taskId/submit',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const task = await taskService.submit(req.params.taskId, req.authData!.id);
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/pick-for-review  — pick for review (Reviewer+) ── */
  router.patch(
    '/:taskId/pick-for-review',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const task = await taskService.pickForReview(
          req.params.taskId,
          req.authData!.id,
          req.authData!.role,
        );
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/approve  — approve (Reviewer+) ─────────────────── */
  router.patch(
    '/:taskId/approve',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const task = await taskService.approve(
          req.params.taskId,
          req.authData!.id,
          req.authData!.role,
        );
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/request-corrections  — request corrections (Reviewer+) */
  router.patch(
    '/:taskId/request-corrections',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const task = await taskService.requestCorrections(req.params.taskId, req.authData!.id);
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/reject  — reject (Reviewer+) ───────────────────── */
  router.patch(
    '/:taskId/reject',
    verifyAdminToken,
    requireRole(AdminRole.REVIEWER),
    validate(rejectTaskSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const task = await taskService.reject(
          req.params.taskId,
          req.authData!.id,
          req.body.reason,
        );
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/suggest-rejection  — suggest rejection (Contributor+) */
  router.patch(
    '/:taskId/suggest-rejection',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    validate(suggestRejectionSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const task = await taskService.suggestRejection(
          req.params.taskId,
          req.authData!.id,
          req.body.reason,
        );
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/publish  — publish (Publisher+) ────────────────── */
  router.patch(
    '/:taskId/publish',
    verifyAdminToken,
    requireRole(AdminRole.PUBLISHER),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const task = await taskService.publish(req.params.taskId, req.authData!.id);
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── PATCH /:taskId/unpublish  — unpublish (SysAdmin only) ─────────── */
  router.patch(
    '/:taskId/unpublish',
    verifyAdminToken,
    requireRole(AdminRole.SYSTEM_ADMIN),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const task = await taskService.unpublish(req.params.taskId, req.authData!.id);
        res.json({ success: true, data: task });
      } catch (err) { next(err); }
    },
  );

  /* ── DELETE /:taskId  — delete task (Publisher+) ───────────────────── */
  router.delete(
    '/:taskId',
    verifyAdminToken,
    requireRole(AdminRole.PUBLISHER),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await taskService.deleteById(req.params.taskId, req.authData!.id);
        res.status(HTTP_CODE.NO_CONTENT).end();
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:taskId/activity-log  — task activity log (Contributor+) ── */
  router.get(
    '/:taskId/activity-log',
    verifyAdminToken,
    requireRole(AdminRole.CONTRIBUTOR),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        // Ensure the task exists before returning its logs.
        await taskService.findById(req.params.taskId);
        const logs = await activityLogService.findByEntity('task', req.params.taskId, 0, 100);
        res.json({
          success: true,
          data: logs,
          pagination: { total: logs.length, skip: 0, limit: 100, hasMore: false },
        });
      } catch (err) { next(err); }
    },
  );

  return router;
}
