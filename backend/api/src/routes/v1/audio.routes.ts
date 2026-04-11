/**
 * @file audio.routes.ts
 * @description Express route definitions for audio management (`/api/v1/audios`).
 *
 * Combines metadata CRUD with S3-backed file operations (upload, stream,
 * download, backup). Admin-only routes are guarded by `verifyAdminToken`.
 *
 * Route summary:
 * | Method | Path                | Auth   | Description                         |
 * |--------|---------------------|--------|-------------------------------------|
 * | POST   | /                   | admin  | Upload audio file + create metadata |
 * | GET    | /:audioId           | public | Get single audio metadata           |
 * | GET    | /                   | public | List audios (filtered, paginated)   |
 * | GET    | /file/:fileName     | public | Stream audio (supports Range)       |
 * | DELETE | /:audioId           | admin  | Delete audio (file + metadata)      |
 * | PUT    | /:audioId           | admin  | Update audio metadata               |
 * | GET    | /extra/theme        | public | Distinct theme values               |
 * | GET    | /extra/author       | public | Distinct author values              |
 * | GET    | /download/:fileName | public | Download audio file                 |
 * | GET    | /backup/download    | admin  | Download all files as ZIP           |
 * | GET    | /check/healthy      | public | Health-check endpoint               |
 */

import { Router } from 'express';
import type { Response, NextFunction } from 'express';

import type { AudioService } from '../../services/audio.service.js';
import type { StorageService } from '../../services/storage.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createAudioSchema, updateAudioSchema, getAudiosQuerySchema } from '../../validators/audio.validators.js';
import { AppError } from '../../lib/app-error.js';
import { HTTP_CODE } from '../../config/constants.js';

/**
 * Factory that creates and returns the audio router.
 *
 * @param audioService     - Business-logic service for audio metadata.
 * @param storageService   - S3 wrapper for file operations.
 * @param verifyAdminToken - Pre-built middleware that validates admin JWTs.
 */
export function createAudioRouter(
  audioService: AudioService,
  storageService: StorageService,
  verifyAdminToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void,
): Router {
  const router = Router();

  /* ── POST /  — upload audio file + create metadata (admin only) ─────── */
  router.post(
    '/',
    verifyAdminToken,
    validate(createAudioSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        // `express-fileupload` attaches files to `req.files`.
        const files = (req as unknown as { files?: Record<string, { mimetype: string; data: Buffer; name: string }> }).files;

        if (!files?.audio) {
          throw AppError.badRequest('Un fichier audio est requis.');
        }
        if (!files.audio.mimetype.includes('audio')) {
          throw AppError.badRequest('Seuls les fichiers audio sont acceptés.');
        }

        // Prefix the file name with a timestamp to avoid collisions.
        const audioFileName = `${Date.now()}_${files.audio.name}`;
        const uri = await storageService.uploadFile(files.audio.data, audioFileName);

        const audio = await audioService.create({
          ...req.body,
          uri,
        });

        res.status(201).json(audio);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /:audioId  — get single audio metadata ────────────────────── */
  router.get(
    '/:audioId',
    async (req, res, next) => {
      try {
        const audio = await audioService.findById(req.params.audioId);
        res.json(audio);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /  — list audios (filtered, paginated) ────────────────────── */
  router.get(
    '/',
    validate(getAudiosQuerySchema, 'query'),
    async (req, res, next) => {
      try {
        // After Zod validation, `req.query` contains coerced numbers.
        const { skip, limit, ...filter } = req.query as unknown as {
          skip: number;
          limit: number;
          theme?: string;
          author?: string;
          keywords?: string;
          minDate?: string;
          maxDate?: string;
        };
        const audios = await audioService.findMany(filter, skip, limit);
        res.json(audios);
      } catch (err) { next(err); }
    },
  );

  /* ── GET /file/:fileName  — stream audio (HTTP Range supported) ────── */
  router.get(
    '/file/:fileName',
    async (req, res, next) => {
      try {
        const fileName = req.params.fileName;
        const range = req.headers.range;

        const metadata = await storageService.getFileMetadata(fileName);
        const fileSize = metadata.ContentLength ?? 0;

        if (range) {
          // Parse the Range header (e.g. "bytes=0-1048575").
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

          const data = await storageService.getFile(fileName, start, end);

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': data.length,
            'Content-Type': metadata.ContentType ?? 'audio/mpeg',
          });
          res.end(data);
        } else {
          // No Range header — return the entire file.
          const data = await storageService.getFile(fileName, 0, fileSize - 1);

          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': metadata.ContentType ?? 'audio/mpeg',
          });
          res.end(data);
        }
      } catch (err) { next(err); }
    },
  );

  /* ── DELETE /:audioId  — delete audio file + metadata (admin only) ─── */
  router.delete(
    '/:audioId',
    verifyAdminToken,
    async (req, res, next) => {
      try {
        const audio = await audioService.findById(req.params.audioId);
        if (!audio) {
          throw AppError.notFound('Audio introuvable.');
        }

        // Remove the physical file from S3 before deleting the DB record.
        const fileName = audio.uri.split('/').pop();
        if (fileName) {
          await storageService.deleteFile(fileName);
        }

        await audioService.deleteById(req.params.audioId);
        res.status(204).end();
      } catch (err) { next(err); }
    },
  );

  /* ── PUT /:audioId  — update audio metadata (admin only) ───────────── */
  router.put(
    '/:audioId',
    verifyAdminToken,
    validate(updateAudioSchema),
    async (req, res, next) => {
      try {
        await audioService.update(req.params.audioId, req.body);
        res.status(200).json({ success: true });
      } catch (err) { next(err); }
    },
  );

  /* ── GET /extra/theme  — distinct theme values (for dropdowns) ─────── */
  router.get('/extra/theme', async (_req, res, next) => {
    try {
      const themes = await audioService.getDistinctThemes();
      res.json(themes);
    } catch (err) { next(err); }
  });

  /* ── GET /extra/author  — distinct author values (for dropdowns) ───── */
  router.get('/extra/author', async (_req, res, next) => {
    try {
      const authors = await audioService.getDistinctAuthors();
      res.json(authors);
    } catch (err) { next(err); }
  });

  /* ── GET /download/:fileName  — download audio as attachment ────────── */
  router.get('/download/:fileName', async (req, res, next) => {
    try {
      const stream = await storageService.downloadFile(req.params.fileName);
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.fileName}"`);
      res.setHeader('Content-Type', 'audio/mpeg');
      stream.pipe(res);
    } catch (err) { next(err); }
  });

  /* ── GET /backup/download  — download all audio files as ZIP (admin) ── */
  router.get('/backup/download', verifyAdminToken, async (_req, res, next) => {
    try {
      const stream = await storageService.downloadAll();
      res.setHeader('Content-Disposition', 'attachment; filename="backup.zip"');
      res.setHeader('Content-Type', 'application/zip');
      stream.pipe(res);
    } catch (err) { next(err); }
  });

  /* ── GET /check/healthy  — lightweight health-check ────────────────── */
  router.get('/check/healthy', (_req, res) => {
    res.status(HTTP_CODE.OK).json({ message: 'The server is up, running and healthy !' });
  });

  return router;
}
