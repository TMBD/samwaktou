let bcryptejs = require("bcryptjs");
let jwt = require("jsonwebtoken");
require("dotenv/config");
const CONFIG = require("../config/server_config");
let requestValidator = require("./utils/admin/admin_request_validator");
const Admin = require("../model/Admin");
// let audioUtils = require("./utils/admin_utils");

let postAdmin = async (req, res) => {
    let reqValidation = requestValidator.validatePostAdminRequest(req.body);
    if(!reqValidation.error){
        const foundAdmin = await Admin.findOneAdminFromDBByEmail(req.body.email);
        if(foundAdmin.success){
            if(foundAdmin.admin === null){
                const salt = await bcryptejs.genSalt(10);
                const hashedPassword = await bcryptejs.hash(req.body.password, salt);
                let admin = new Admin(req.body.surname, req.body.name, req.body.email, hashedPassword, undefined, undefined, undefined);
                let result = await admin.saveToDB();
                if(result.success){
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json({
                        _id: result.data._id,
                        surname: result.data.surname,
                        name: result.data.name,
                        email: result.data.email,
                        date: result.data.date,
                        isSuperAdmin: result.data.isSuperAdmin
                    });
                }else{
                    res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                    res.json({
                        message: result.message,
                        details: result.details
                    });
                }
            }else{
                res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
                res.json({
                    message: "A user with this email alrady exist !"
                });
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: foundAdmin.message,
                details: "An error has occured while trying to verify if the user with this email exists or not !"
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}


let getAdmin = async (req, res) => {
    if(req.params.adminId){
        let findAdminResult = await Admin.findOneAdminFromDBById(req.params.adminId);
        if(findAdminResult.success){
            if(findAdminResult.admin === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({});
            }else{
                res.status(CONFIG.HTTP_CODE.OK);
                res.json({
                    _id: findAdminResult.admin._id,
                    surname: findAdminResult.admin.surname,
                    name: findAdminResult.admin.name,
                    email: findAdminResult.admin.email,
                    date: findAdminResult.admin.date,
                    isSuperAdmin: findAdminResult.admin.isSuperAdmin
                });
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findAdminResult.message,
                details: findAdminResult.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json({
            message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
            details: "No admin id found !"
        });
    }
}

let getManyAdmins = async(req, res) => {
    let reqValidation = requestValidator.validateGetAdminRequest(req.body);
    if(!reqValidation.error){
        let limitAdminToFind = (req.body.limit) ? req.body.limit : CONFIG.ADMIN_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
        let skipAdminToFind = (req.body.skip) ? req.body.skip : CONFIG.ADMIN_GET_PARAMS.DEFAULT_SKIP_NUMBER;
        let findAdminsResults = await Admin.getAdmins(skipAdminToFind, limitAdminToFind);
        if(findAdminsResults.success){
            if(findAdminsResults.admins === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({});
            }else{
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(findAdminsResults.admins);
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findAdminsResults.message,
                details: findAdminsResults.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}



let deleteAdmin = async (req, res) => {
    let findAdminResult = await Admin.findOneAdminFromDBById(req.params.adminId);
    if(findAdminResult.success){
        if(findAdminResult.admin === null){
            res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
            res.json({
                message: "Couldn't delete admin !",
                details: "No admin with this _id has been found in the database !"
            });
        }else{
            let deleteResult = await Admin.deleteFromDB(req.params.adminId);
            if(deleteResult.success){
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(deleteResult.data);
            }else{
                res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    message: deleteResult.message,
                    details: deleteResult.details
                });
            }
        }
    }else{
        res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json({
            message: findAdminResult.message,
            details: findAdminResult.details
        });
    } 
}



let updateAdmin = async (req, res) => {
    let reqValidation = requestValidator.validateUpdateAdminRequest(req.body);
    if(!reqValidation.error){
        let findAdminResult = await Admin.findOneAdminFromDBById(req.body._id);
        if(findAdminResult.success){
            if(findAdminResult.admin === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    message: "Couldn't update admin !",
                    details: "No admin with this _id has been found in the database !"
                });
            }else{
                let findIfEmailExistResult = await Admin.findOneAdminFromDBByEmail(req.body.email);
                if(findIfEmailExistResult.success){
                    if(findIfEmailExistResult.admin === null || req.body.email == findAdminResult.admin.email){
                        let admin = new Admin(req.body.surname, req.body.name, req.body.email, findAdminResult.admin.password, findAdminResult.admin.date, findAdminResult.admin._id, findAdminResult.admin.isSuperAdmin);
                        let updateResult = await admin.updateToDB();
                        if(updateResult.success){
                            res.status(CONFIG.HTTP_CODE.OK);
                            res.json(updateResult.data);
                        }else{
                            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                            res.json({
                                message: updateResult.message,
                                details: updateResult.details
                            });
                        }
                    }else{
                        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
                        res.json({
                            message: "Couldn't update admin !",
                            details: "An admin with this email already existe in the database !"
                        });
                    }
                }else{
                    res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                    res.json({
                        message: findIfEmailExistResult.message,
                        details: "This error occured while trying to search if an admin with the same email existe in the database !"
                    });
                }
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findAdminResult.message,
                details: findAdminResult.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}


let updateAdminPassword = async (req, res) => {
    let reqValidation = requestValidator.validateUpdateAdminPasswordRequest(req.body);
    if(!reqValidation.error){
        let findAdminResult = await Admin.findOneAdminFromDBById(req.token._id);
        if(findAdminResult.success){
            if(findAdminResult.admin === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    message: "Couldn't update admin !",
                    details: "No admin with the provided _id has been found in the database !"
                });
            }else{
                const validePass = await bcryptejs.compare(req.body.password, findAdminResult.admin.password);
                if(validePass){

                    const salt = await bcryptejs.genSalt(10);
                    const hashedPassword = await bcryptejs.hash(req.body.newPassword, salt);
                    let admin = new Admin(findAdminResult.admin.surname, findAdminResult.admin.name, findAdminResult.admin.email, hashedPassword, findAdminResult.admin.date, findAdminResult.admin._id, findAdminResult.admin.isSuperAdmin);
                    let updateResult = await admin.updateToDB();
                    if(updateResult.success){
                        res.status(CONFIG.HTTP_CODE.OK);
                        res.json(updateResult.data);
                    }else{
                        res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                        res.json({
                            message: updateResult.message,
                            details: updateResult.details
                        });
                    }
                }else{
                    res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
                    res.json({
                        message: "Wrong password !",
                        details: "The password you provided doesn't match !"
                    });
                }
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findAdminResult.message,
                details: findAdminResult.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}


let loginAdmin = async (req, res) => {
    let reqValidation = requestValidator.validateLoginAdminRequest(req.body);
    if(!reqValidation.error){
        let findAdminResult = await Admin.findOneAdminFromDBByEmail(req.body.email);
        if(findAdminResult.success){
            if(findAdminResult.admin === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    message: "Invalid email !"
                });
            }else{
                const validePass = await bcryptejs.compare(req.body.password, findAdminResult.admin.password);
                if(validePass){
                    const token = jwt.sign({_id: findAdminResult.admin._id, isSuperAdmin: findAdminResult.admin.isSuperAdmin}, process.env.TOKEN_SECRET, {expiresIn: "30m"});
                    res.header("auth-token", token);
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json({
                        _id: findAdminResult.admin._id,
                        isSuperAdmin: findAdminResult.admin.isSuperAdmin
                    });
                }else{
                    res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        message: "Invalid password !"
                    });
                }
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findAdminResult.message,
                details: findAdminResult.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}

exports.postAdmin = postAdmin;
exports.getAdmin = getAdmin;
exports.getManyAdmins = getManyAdmins;
exports.deleteAdmin = deleteAdmin;
exports.updateAdmin = updateAdmin;
exports.updateAdminPassword = updateAdminPassword;
exports.loginAdmin = loginAdmin;