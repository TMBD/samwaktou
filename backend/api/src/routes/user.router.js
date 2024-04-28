let express = require("express");
let router = express.Router();
let userController = require("../controller/user.controller");
let {verifyUserToken, verifyAdminToken, verifyTokenForDeleteUser} = require("../controller/utils/verify-token");

router.post("/", (req, res) => {
    userController.postUser(req, res);  
});

router.get("/:userId", (req, res) => {
    userController.getUser(req, res);
});

router.get("/", verifyAdminToken, (req, res) => {
    userController.getManyUsers(req, res);
});

router.delete("/:userId", verifyTokenForDeleteUser, (req, res) => {
    userController.deleteUser(req, res);
});

router.put("/:userId", verifyUserToken, (req, res) => {
        userController.updateUser(req, res);
});

router.post("/login", (req, res) => {
    userController.loginUser(req, res);
});

module.exports = router;