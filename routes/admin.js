let express = require("express");
let router = express.Router();
let adminController = require("../controler/admin");

router.post("/", (req, res) => {
    adminController.postAdmin(req, res);
});

// router.get("/:adminId", (req, res) => {
//     adminController.getAdmin(req, res);
// });

// router.get("/", (req, res) => {
//     adminController.getManyAdmins(req, res);
// });

// router.delete("/:adminId", (req, res) => {
//     adminController.deleteAdmin(req, res);
// });

// router.put("/", (req, res) => {
//     adminController.updateAdmin(req, res);
// });


module.exports = router;