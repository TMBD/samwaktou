let _ = require("lodash");
let bcryptejs = require("bcryptjs");
let jwt = require("jsonwebtoken");
const CONFIG = require("../config/server.config");
let requestValidator = require("./utils/admin/admin-request-validator");
const Admin = require("../model/admin.model");
let {parseErrorInJson} = require("./utils/utilities");

let postAdmin = async (req, res) => {
    try{
        let reqValidation = requestValidator.validatePostAdminRequest(req.body);
        if(reqValidation.error){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let foundAdmin;
            try{
                foundAdmin = await Admin.findOneAdminFromDBByEmail(req.body.email);
            }catch(exception){
                res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    success: false,
                    reason: "An error has occured while trying to verify if an admin with this username exists or not !",
                    message: "Une erreur s'est produite lors de la vérification des informations !",
                    details: exception
                });
            }
            if(!foundAdmin.admin){
                res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
                res.json({
                    success: false,
                    reason: "A user with this email already exist.",
                    message: "Cet email existe déjà.",
                    details: "Found a user with this email."
                });
            } else {
                const salt = await bcryptejs.genSalt(10);
                const hashedPassword = await bcryptejs.hash(req.body.password, salt);
                let admin = new Admin(req.body.surname, req.body.name, req.body.email, hashedPassword, req.body.date, undefined, req.body.isSuperAdmin);
                let result = await admin.saveToDB();
                res.status(CONFIG.HTTP_CODE.OK);
                res.json({
                    _id: result.data._id,
                    surname: result.data.surname,
                    name: result.data.name,
                    email: result.data.email,
                    date: result.data.date,
                    isSuperAdmin: result.data.isSuperAdmin
                });
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}


let getAdmin = async (req, res) => {
    try{
        if(!req.params.adminId){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                sucess: false,
                reason: "No admin id found !",
                message: "Utilisateur introuvable.", 
                details: "Admin id is null."
            });
        } else {
            let findAdminResult = await Admin.findOneAdminFromDBById(req.params.adminId);
            if(!findAdminResult.admin){
                res.status(CONFIG.HTTP_CODE.OK);
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
            
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

let getManyAdmins = async(req, res) => {
    try{
        let reqValidation = requestValidator.validateGetAdminRequest(req.body);
        if(reqValidation.error){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let limitAdminToFind = (req.body.limit) ? req.body.limit : CONFIG.ADMIN_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
            let skipAdminToFind = (req.body.skip) ? req.body.skip : CONFIG.ADMIN_GET_PARAMS.DEFAULT_SKIP_NUMBER;
            let findAdminsResults = await Admin.getAdmins(req.body.surname, req.body.name, req.body.email, req.body.dateParams, req.body.isSuperAdmin, skipAdminToFind, limitAdminToFind);
            if(!findAdminsResults.admins){
                res.status(CONFIG.HTTP_CODE.OK);
                res.json({});
            }else{
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(findAdminsResults.admins);
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}



let deleteAdmin = async (req, res) => {
    try{
        let findAdminResult = await Admin.findOneAdminFromDBById(req.params.adminId);
        if(!findAdminResult.admin){
            let deleteResult = await Admin.deleteFromDB(req.params.adminId);
            res.status(CONFIG.HTTP_CODE.OK);
            res.json(deleteResult.data);
        } else {
            res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
            res.json({
                sucess: false,
                reason: "No admin with this id found !",
                message: "Utilisateur introuvable.", 
                details: "Admin doesn't exist."
            });
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}


let updateAdmin = async (req, res) => {
    try{
        let reqValidation = requestValidator.validateUpdateAdminRequest(req.body);
        if(reqValidation.error){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            if(req.token?.isSuperAdmin){
                res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
                res.json({
                    success: false,
                    reason: "Acces denied !",
                    message: "Action non autorisée !",
                    details: "Only superAdmin can update information of an admin !",
                });
            } else {
                let findAdminResult;
                try{
                    findAdminResult = await Admin.findOneAdminFromDBById(req.params.adminId);
                }catch(exception){
                    res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                    res.json({
                        success: false,
                        reason: "An error has occured while trying to verify if an admin with this id exists or not !",
                        message: "Une erreur s'est produite lors de la vérification des informations !",
                        details: exception
                    });
                }
                if(!findAdminResult.admin){
                    res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        sucess: false,
                        reason: "No admin with this id found !",
                        message: "Utilisateur introuvable.", 
                        details: "No admin found for update"
                    });
                }else{
                    let findIfEmailExistResult = await Admin.findOneAdminFromDBByEmail(req.body.email);
                    if(!findIfEmailExistResult.admin || req.body.email === findAdminResult.admin.email){
                        let isSuperAdmin = req.token.isSuperAdmin || findAdminResult.admin.isSuperAdmin;
                        let surname = req.body.surname ? req.body.surname : findAdminResult.admin.surname;
                        let name = req.body.name ? req.body.name : findAdminResult.admin.name;
                        let email = req.body.email ? req.body.email : findAdminResult.admin.email;
                        let admin = new Admin(surname, name, email, findAdminResult.admin.password, findAdminResult.admin.date, findAdminResult.admin._id, isSuperAdmin);
                        let updateResult = await admin.updateToDB();
                        res.status(CONFIG.HTTP_CODE.OK);
                        res.json(updateResult.data);
                    }else{
                        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
                        res.json({
                            success: false,
                            reason: "A user with this email already exist.",
                            message: "Cet email existe déjà.",
                            details: "Found a user with this email."
                        });
                    }
                }
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

let updateAdminPassword = async (req, res) => {
    try{
        let reqValidation = requestValidator.validateUpdateAdminPasswordRequest(req.body);
        if(reqValidation.error){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            if(req.token?._id !== req.params.adminId){
                res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
                res.json({
                    success: false,
                    reason: "Acces denied !",
                    message: "Vous ne pouvez pas modifier le mot de passe d'un autre utilisateur !",
                    details: "Can't modify password of another admin !"
                });
            } else {
                let findAdminResult = await Admin.findOneAdminFromDBById(req.token._id);
                if(!findAdminResult.admin){
                    res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        sucess: false,
                        reason: "No admin with this id found !",
                        message: "Utilisateur introuvable.", 
                        details: "No admin found to update"
                        
                    });
                }else{
                    const validePass = await bcryptejs.compare(req.body.password, findAdminResult.admin.password);
                    if(validePass){
                        const salt = await bcryptejs.genSalt(10);
                        const hashedPassword = await bcryptejs.hash(req.body.newPassword, salt);
                        let admin = new Admin(findAdminResult.admin.surname, findAdminResult.admin.name, findAdminResult.admin.email, hashedPassword, findAdminResult.admin.date, findAdminResult.admin._id, findAdminResult.admin.isSuperAdmin);
                        let updateResult = await admin.updateToDB();
                        res.status(CONFIG.HTTP_CODE.OK);
                        res.json(updateResult.data);
                    }else{
                        res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
                        res.json({
                            sucess: false,
                            reason: "Wrong password !",
                            message: "Mot de passe incorrect.", 
                            details: "The password provided doesn't match !"
                        });
                    }
                }
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

let loginAdmin = async (req, res) => {
    try{
        let reqValidation = requestValidator.validateLoginAdminRequest(req.body);
        if(reqValidation.error){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let findAdminResult = await Admin.findOneAdminFromDBByEmail(req.body.email);
            if(!findAdminResult.admin){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    success: false,
                    reason: "Invalid email or password.",
                    message: "Email ou mot de passe incorrect.",
                    details: "The email or the password doesn't match."
                });
            }else{
                const validePass = await bcryptejs.compare(req.body.password, findAdminResult.admin.password);
                if(validePass){
                    const token = jwt.sign({_id: findAdminResult.admin._id, isSuperAdmin: findAdminResult.admin.isSuperAdmin}, process.env.ADMIN_TOKEN_SECRET, {expiresIn: "24h"});
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json({
                        _id: findAdminResult.admin._id,
                        isSuperAdmin: findAdminResult.admin.isSuperAdmin,
                        token: token
                    });
                }else{
                    res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        success: false,
                        reason: "Invalid email or password.",
                        message: "Email ou mot de passe incorrect.",
                        details: "The email or the password doesn't match."
                    });
                }
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

exports.postAdmin = postAdmin;
exports.getAdmin = getAdmin;
exports.getManyAdmins = getManyAdmins;
exports.deleteAdmin = deleteAdmin;
exports.updateAdmin = updateAdmin;
exports.updateAdminPassword = updateAdminPassword;
exports.loginAdmin = loginAdmin;