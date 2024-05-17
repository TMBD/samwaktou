import express, { Request, Response } from 'express';
import { DeleteResult } from 'mongodb';

import { verifyAdminToken } from '../controller/utils/verify-token';
import * as audioController from '../controller/audio.controller';
import { HTTP_CODE } from '../config/server.config';
import { IAudioLight, IAudioObject } from '../model/audio.model';
import { IUpdateOne } from '../model/db-crud';
import { ErrorResponse } from '../controller/utils/common';
import { AuthenticatedAdminRequest } from '../model/admin.model';


const router = express.Router();

router.post("/", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{}, {}, IAudioLight>, 
    res: Response<IAudioObject | ErrorResponse>) => {
    audioController.postAudio(req, res);
});

router.get("/:audioId", (
    req: Request<{audioId: string}, {}, {}>, 
    res: Response<IAudioObject | ErrorResponse>) => {
    audioController.getAudio(req, res);
});

router.get("/", (
    req: Request<{}, {}, {}, {
        skip?: number, 
        limit?: number, 
        minDate?: string, 
        maxDate?: string, 
        theme?: string, 
        author?: string, 
        keywords?: string}>, 
    res: Response<IAudioObject[] | ErrorResponse>) => {
    audioController.getManyAudios(req, res);
});

router.get("/file/:fileName", (
    req: Request<{fileName: string}, {}, {}>, 
    res: Response<Buffer | ErrorResponse>) => {
    audioController.getAudioFile(req, res);
});

router.delete("/:audioId", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{audioId: string}, {}, {}, {}>, 
    res: Response<DeleteResult | ErrorResponse>) => {
    audioController.deleteAudio(req, res);
});

router.put("/:audioId", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{audioId: string}, {}, IAudioLight>, 
    res: Response<IUpdateOne | ErrorResponse>) => {
    audioController.updateAudio(req, res);
});

router.get("/extra/theme", (
    req: Request<{}, {}, {}>, 
    res: Response<string[] | ErrorResponse>) => {
    audioController.getDistinctThemes(req, res);
});

router.get("/extra/author", (
    req: Request<{}, {}, {}>, 
    res: Response<string[] | ErrorResponse>) => {
    audioController.getDistinctAuthors(req, res);
});

router.get("/download/:fileName", (
    req: Request<{fileName: string}, {}, {}>, 
    res: Response<Buffer | ErrorResponse>) => {
    audioController.downloadAudioFile(req, res);
});

router.get("/backup/download", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{}, {}, {}>, 
    res: Response<Buffer | ErrorResponse>) => {
    audioController.downloadAll(req, res);
});

router.get("/check/healthy", (_req, res) => {
    res.status(HTTP_CODE.OK);
    res.json({
        message: "The server is up, running and healthy !"
    });
});

export default router;