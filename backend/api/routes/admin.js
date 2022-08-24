let express = require("express");
let router = express.Router();
let adminController = require("../controler/admin");
let {verifyAdminToken} = require("../controler/utils/verify_token");
let CONFIG = require("../config/server_config");

router.post("/", verifyAdminToken, (req, res) => {
    if(req.token && req.token.isSuperAdmin){
        adminController.postAdmin(req, res);
    }else{
        res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "Only super admins have the right to add an admin !"
        })
    }
        
});

router.get("/:adminId", verifyAdminToken, (req, res) => {
    adminController.getAdmin(req, res);
});

router.get("/", verifyAdminToken, (req, res) => {
    adminController.getManyAdmins(req, res);
});

router.delete("/:adminId", verifyAdminToken, (req, res) => {
    if(req.token && req.token.isSuperAdmin){
        adminController.deleteAdmin(req, res);
    }else{
        res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "Only super admins have the right to delete an admin !"
        })
    }
});

router.put("/:adminId", verifyAdminToken, (req, res) => {
    if((req.token && req.token.isSuperAdmin) || (req.token && req.token._id == req.params.adminId)){
        adminController.updateAdmin(req, res);
    }else{
        res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "Can't modify informations of another admin unless you are a superAdmin !"
        })
    }
});

router.put("/password/:adminId", verifyAdminToken, (req, res) => {
    adminController.updateAdminPassword(req, res);
});

router.post("/login", (req, res) => {
    adminController.loginAdmin(req, res);
});

module.exports = router;