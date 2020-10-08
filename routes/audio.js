let express = require("express");
let router = express.Router();
let audioController = require("../controler/audio");

router.post("/", (req, res) => {
    console.log(" the console");
    audioController.postAudio(req, res);
});

module.exports = router;