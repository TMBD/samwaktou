import express from 'express';

import { verifyAdminToken } from '../controller/utils/verify-token';
import * as audioController from '../controller/audio.controller';
import { HTTP_CODE } from '../config/server.config';


const router = express.Router();

router.post("/", verifyAdminToken, (req, res) => {
    audioController.postAudio(req, res);
});

router.get("/:audioId", (req, res) => {
    audioController.getAudio(req, res);
});

router.get("/", (req, res) => {
    audioController.getManyAudios(req, res);
});

router.get("/file/:fileName", (req, res) => {
    audioController.getAudioFile(req, res);
});

router.delete("/:audioId", verifyAdminToken, (req, res) => {
    audioController.deleteAudio(req, res);
});

router.put("/:audioId", verifyAdminToken, (req, res) => {
    audioController.updateAudio(req, res);
});

router.get("/extra/theme", (req, res) => {
    audioController.getDistinctThemes(req, res);
});

router.get("/extra/author", (req, res) => {
    audioController.getDistinctAuthors(req, res);
});

router.get("/download/:fileName", (req, res) => {
    audioController.downloadAudioFile(req, res);
});

router.get("/backup/download", verifyAdminToken, (req, res) => {
    audioController.downloadAll(req, res);
});

router.get("/check/healthy", (req, res) => {
    res.status(HTTP_CODE.OK);
    res.json({
        message: "The server is up, running and healthy !"
    });
});

export default router;