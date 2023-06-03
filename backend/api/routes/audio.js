let express = require("express");
let router = express.Router();
let {verifyAdminToken} = require("../controler/utils/verify_token");
let audioController = require("../controler/audio");

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


module.exports = router;