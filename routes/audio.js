let express = require("express");
let router = express.Router();
let audioController = require("../controler/audio");

router.post("/", (req, res) => {
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

module.exports = router;