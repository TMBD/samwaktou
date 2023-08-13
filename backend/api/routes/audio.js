let express = require("express");
let router = express.Router();
let {verifyAdminToken} = require("../controler/utils/verify_token");
let audioController = require("../controler/audio");
const CONFIG = require("../config/server_config");

router.post("/", verifyAdminToken, (req, res) => {
    audioController.postAudio(req, res);
});

router.get("/:audioId", (req, res) => {
    audioController.getAudio(req, res);
});

router.get("/", (req, res) => {
    console.log("receive on path /");
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
    console.log("receive on path /extra/theme");
    audioController.getDistinctThemes(req, res);
});

router.get("/extra/author", (req, res) => {
    console.log("receive on path /extra/author");
    audioController.getDistinctAuthors(req, res);
});

router.get("/check/healthy", (req, res) => {
    console.log("The server is up, running and healthy !");
    res.status(CONFIG.HTTP_CODE.OK);
    res.json({
        message: "The server is up, running and healthy !"
    });
});

module.exports = router;