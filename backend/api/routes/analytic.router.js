let express = require("express");
let router = express.Router();
let analyticController = require("../controller/analytic.controller");

router.post("/", (req, res) => {
    analyticController.postAnalytic(req, res);
});

module.exports = router;