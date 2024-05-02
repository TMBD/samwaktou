import _ from 'lodash';
import moment from 'moment';
import bcryptejs from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { HTTP_CODE, ADMIN_GET_PARAMS, DATE_CONFIG } from '../config/server.config';
import Admin from '../model/admin.model';
import { parseErrorInJson } from './utils/utilities';
import {
    validatePostAdminRequest, 
    validateGetAdminRequest, 
    validateUpdateAdminRequest, 
    validateUpdateAdminPasswordRequest, 
    validateLoginAdminRequest
} from './utils/admin/admin-request-validator';


export const postAdmin = async (req, res) => {
    try{
        let reqValidation = validatePostAdminRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
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
                res.status(HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    success: false,
                    reason: "An error has occured while trying to verify if an admin with this username exists or not !",
                    message: "Une erreur s'est produite lors de la vérification des informations !",
                    details: exception
                });
            }
            if(!foundAdmin.admin){
                res.status(HTTP_CODE.BAD_REQUEST_ERROR);
                res.json({
                    success: false,
                    reason: "A user with this email already exist.",
                    message: "Cet email existe déjà.",
                    details: "Found a user with this email."
                });
            } else {
                const salt = await bcryptejs.genSalt(10);
                const hashedPassword = await bcryptejs.hash(req.body.password, salt);
                let admin = new Admin(req.body.surname, req.body.name, req.body.email, hashedPassword, moment.utc(req.body.date, DATE_CONFIG.DEFAULT_FORMAT), undefined, req.body.isSuperAdmin);
                let result = await admin.saveToDB();
                res.status(HTTP_CODE.OK);
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
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}


export const getAdmin = async (req, res) => {
    try{
        if(!req.params.adminId){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                sucess: false,
                reason: "No admin id found !",
                message: "Utilisateur introuvable.", 
                details: "Admin id is null."
            });
        } else {
            let findAdminResult = await Admin.findOneAdminFromDBById(req.params.adminId);
            if(!findAdminResult.admin){
                res.status(HTTP_CODE.OK);
                res.json({});
            }else{
                res.status(HTTP_CODE.OK);
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
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getManyAdmins = async(req, res) => {
    try{
        let reqValidation = validateGetAdminRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let limitAdminToFind = (req.body.limit) ? req.body.limit : ADMIN_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
            let skipAdminToFind = (req.body.skip) ? req.body.skip : ADMIN_GET_PARAMS.DEFAULT_SKIP_NUMBER;
            let findAdminsResults = await Admin.getAdmins(req.body.surname, req.body.name, req.body.email, req.body.dateParams, req.body.isSuperAdmin, skipAdminToFind, limitAdminToFind);
            if(!findAdminsResults.admins){
                res.status(HTTP_CODE.OK);
                res.json({});
            }else{
                res.status(HTTP_CODE.OK);
                res.json(findAdminsResults.admins);
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}



export const deleteAdmin = async (req, res) => {
    try{
        let findAdminResult = await Admin.findOneAdminFromDBById(req.params.adminId);
        if(!findAdminResult.admin){
            let deleteResult = await Admin.deleteFromDB(req.params.adminId);
            res.status(HTTP_CODE.OK);
            res.json(deleteResult.data);
        } else {
            res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
            res.json({
                sucess: false,
                reason: "No admin with this id found !",
                message: "Utilisateur introuvable.", 
                details: "Admin doesn't exist."
            });
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}


export const updateAdmin = async (req, res) => {
    try{
        let reqValidation = validateUpdateAdminRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            if(req.token?.isSuperAdmin){
                res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
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
                    res.status(HTTP_CODE.INTERNAL_SERVER_ERROR);
                    res.json({
                        success: false,
                        reason: "An error has occured while trying to verify if an admin with this id exists or not !",
                        message: "Une erreur s'est produite lors de la vérification des informations !",
                        details: exception
                    });
                }
                if(!findAdminResult.admin){
                    res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
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
                        let admin = new Admin(surname, name, email, findAdminResult.admin.password, moment.utc(findAdminResult.admin.date, DATE_CONFIG.DEFAULT_FORMAT), findAdminResult.admin._id, isSuperAdmin);
                        let updateResult = await admin.updateToDB();
                        res.status(HTTP_CODE.OK);
                        res.json(updateResult.data);
                    }else{
                        res.status(HTTP_CODE.BAD_REQUEST_ERROR);
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
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const updateAdminPassword = async (req, res) => {
    try{
        let reqValidation = validateUpdateAdminPasswordRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            if(req.token?._id !== req.params.adminId){
                res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
                res.json({
                    success: false,
                    reason: "Acces denied !",
                    message: "Vous ne pouvez pas modifier le mot de passe d'un autre utilisateur !",
                    details: "Can't modify password of another admin !"
                });
            } else {
                let findAdminResult = await Admin.findOneAdminFromDBById(req.token._id);
                if(!findAdminResult.admin){
                    res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
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
                        let admin = new Admin(findAdminResult.admin.surname, findAdminResult.admin.name, findAdminResult.admin.email, hashedPassword, moment.utc(findAdminResult.admin.date, DATE_CONFIG.DEFAULT_FORMAT), findAdminResult.admin._id, findAdminResult.admin.isSuperAdmin);
                        let updateResult = await admin.updateToDB();
                        res.status(HTTP_CODE.OK);
                        res.json(updateResult.data);
                    }else{
                        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
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
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const loginAdmin = async (req, res) => {
    try{
        let reqValidation = validateLoginAdminRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let findAdminResult = await Admin.findOneAdminFromDBByEmail(req.body.email);
            if(!findAdminResult.admin){
                res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
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
                    res.status(HTTP_CODE.OK);
                    res.json({
                        _id: findAdminResult.admin._id,
                        isSuperAdmin: findAdminResult.admin.isSuperAdmin,
                        token: token
                    });
                }else{
                    res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
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
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}