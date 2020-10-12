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

router.put("/", verifyAdminToken, (req, res) => {
    if(req.token && req.token.isSuperAdmin){
        adminController.updateAdmin(req, res);
    }else{
        res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "Only super admins have the right to modify an admin's information !"
        })
    }
});


router.post("/login", (req, res) => {
    adminController.loginAdmin(req, res);
});

module.exports = router;