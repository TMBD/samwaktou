import _ from 'lodash';
import moment, { Moment } from 'moment';
import bcryptejs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { DeleteResult } from 'mongodb';

import { HTTP_CODE, ADMIN_GET_PARAMS, DATE_CONFIG } from '../config/server.config';
import Admin, { AuthenticatedAdminRequest, IAdminLight, IAdminObject } from '../model/admin.model';
import { ErrorResponse, parseErrorInJson } from './utils/common';
import {
    validatePostAdminRequest, 
    validateGetAdminRequest, 
    validateUpdateAdminRequest, 
    validateUpdateAdminPasswordRequest, 
    validateLoginAdminRequest
} from './utils/admin/admin-request-validator';
import { IUpdateOne } from '../model/db-crud';


export const postAdmin = async (
    req: AuthenticatedAdminRequest<{}, {}, IAdminLight>, 
    res: Response<IAdminObject | ErrorResponse>): Promise<void> => {
    try{
        const reqValidation = validatePostAdminRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let foundAdmin: IAdminObject;
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
            if(foundAdmin){
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
                const admin = new Admin(req.body.surname, req.body.name, req.body.email, hashedPassword, moment.utc(req.body.date, DATE_CONFIG.DEFAULT_FORMAT), req.body.isSuperAdmin, null);
                const savedAdmin = await admin.saveToDB();
                res.status(HTTP_CODE.OK);
                res.json(savedAdmin);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}


export const getAdmin = async (
    req: AuthenticatedAdminRequest<{adminId: string}, {}, {}>, 
    res: Response<IAdminObject | ErrorResponse>): Promise<void> => {
    try{
        if(!req.params.adminId){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "No admin id found !",
                message: "Utilisateur introuvable.", 
                details: "Admin id is null."
            });
        } else {
            const foundAdmin = await Admin.findOneAdminFromDBById(req.params.adminId);
            if(!foundAdmin){
                res.status(HTTP_CODE.OK);
                res.json(null);
            }else{
                res.status(HTTP_CODE.OK);
                res.json(foundAdmin);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getManyAdmins = async(
    req: AuthenticatedAdminRequest<{}, {}, {
        surname?: string, 
        name?: string, 
        email?: string, 
        dateParams?: {date: Moment, gte: boolean}, 
        isSuperAdmin?: boolean,
        skip?: number, 
        limit?: number,}, {}>, 
    res: Response<IAdminObject[] | ErrorResponse>): Promise<void> => {
    try{
        const reqValidation = validateGetAdminRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            const limitAdminToFind = (req.body.limit) ? req.body.limit : ADMIN_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
            const skipAdminToFind = (req.body.skip) ? req.body.skip : ADMIN_GET_PARAMS.DEFAULT_SKIP_NUMBER;
            const foundAdmins = await Admin.getAdmins(req.body.surname, req.body.name, req.body.email, req.body.dateParams, req.body.isSuperAdmin, skipAdminToFind, limitAdminToFind);
            if(!foundAdmins){
                res.status(HTTP_CODE.OK);
                res.json([]);
            }else{
                res.status(HTTP_CODE.OK);
                res.json(foundAdmins);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}



export const deleteAdmin = async (
    req: AuthenticatedAdminRequest<{adminId: string}, {}, {}, {}>, 
    res: Response<DeleteResult | ErrorResponse>
): Promise<void> => {
    try{
        const foundAdminResult = await Admin.findOneAdminFromDBById(req.params.adminId);
        if(!foundAdminResult){
            const deleteResult = await Admin.deleteFromDB(req.params.adminId);
            res.status(HTTP_CODE.OK);
            res.json(deleteResult);
        } else {
            res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
            res.json({
                success: false,
                reason: "No admin with this id found !",
                message: "Utilisateur introuvable.", 
                details: "Admin doesn't exist."
            });
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const updateAdmin = async (
    req: AuthenticatedAdminRequest<{adminId: string}, {}, IAdminLight>, 
    res: Response<IUpdateOne | ErrorResponse>): Promise<void> => {
    try{
        const reqValidation = validateUpdateAdminRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            if(req.authData?.isSuperAdmin){
                res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
                res.json({
                    success: false,
                    reason: "Acces denied !",
                    message: "Action non autorisée !",
                    details: "Only superAdmin can update information of an admin !",
                });
            } else {
                let foundAdmin: IAdminObject;
                try{
                    foundAdmin = await Admin.findOneAdminFromDBById(req.params.adminId);
                }catch(exception){
                    res.status(HTTP_CODE.INTERNAL_SERVER_ERROR);
                    res.json({
                        success: false,
                        reason: "An error has occured while trying to verify if an admin with this id exists or not !",
                        message: "Une erreur s'est produite lors de la vérification des informations !",
                        details: exception
                    });
                }
                if(!foundAdmin){
                    res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        success: false,
                        reason: "No admin with this id found !",
                        message: "Utilisateur introuvable.", 
                        details: "No admin found for update"
                    });
                }else{
                    const foundAdminByEamil = await Admin.findOneAdminFromDBByEmail(req.body.email);
                    if(!foundAdminByEamil || req.body.email === foundAdmin.email){
                        const isSuperAdmin = req.authData?.isSuperAdmin || (!req.authData && foundAdmin.isSuperAdmin);
                        const surname = req.body.surname ? req.body.surname : foundAdmin.surname;
                        const name = req.body.name ? req.body.name : foundAdmin.name;
                        const email = req.body.email ? req.body.email : foundAdmin.email;
                        const admin = new Admin(surname, name, email, foundAdmin.password, moment.utc(foundAdmin.date, DATE_CONFIG.DEFAULT_FORMAT), isSuperAdmin, foundAdmin.id);
                        const updateResult = await admin.updateToDB();
                        res.status(HTTP_CODE.OK);
                        res.json(updateResult);
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
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const updateAdminPassword = async (
    req: AuthenticatedAdminRequest<{adminId: string}, {}, {password: string, newPassword: string}>, 
    res: Response<IUpdateOne | ErrorResponse>): Promise<void> => {
    try{
        const reqValidation = validateUpdateAdminPasswordRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            if(req.authData?.id !== req.params.adminId){
                res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
                res.json({
                    success: false,
                    reason: "Acces denied !",
                    message: "Vous ne pouvez pas modifier le mot de passe d'un autre utilisateur !",
                    details: "Can't modify password of another admin !"
                });
            } else {
                const foundAdmin = await Admin.findOneAdminFromDBById(req.authData.id);
                if(!foundAdmin){
                    res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        success: false,
                        reason: "No admin with this id found !",
                        message: "Utilisateur introuvable.", 
                        details: "No admin found to update"
                        
                    });
                }else{
                    const validePass = await bcryptejs.compare(req.body.password, foundAdmin.password);
                    if(validePass){
                        const salt = await bcryptejs.genSalt(10);
                        foundAdmin.password = await bcryptejs.hash(req.body.newPassword, salt);
                        const updateResult = await foundAdmin.updateToDB();
                        res.status(HTTP_CODE.OK);2
                        res.json(updateResult);
                    }else{
                        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
                        res.json({
                            success: false,
                            reason: "Wrong password !",
                            message: "Mot de passe incorrect.", 
                            details: "The password provided doesn't match !"
                        });
                    }
                }
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const loginAdmin = async (
    req: Request<{}, {}, {email: string, password: string}>, 
    res: Response<{id: string, isSuperAdmin: boolean, token: string} | ErrorResponse>): Promise<void> => {
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
            const foundAdmin = await Admin.findOneAdminFromDBByEmail(req.body.email);
            if(!foundAdmin){
                res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    success: false,
                    reason: "Invalid email or password.",
                    message: "Email ou mot de passe incorrect.",
                    details: "The email or the password doesn't match."
                });
            }else{
                const validePass = await bcryptejs.compare(req.body.password, foundAdmin.password);
                if(validePass){
                    const token = jwt.sign({id: foundAdmin.id, isSuperAdmin: foundAdmin.isSuperAdmin}, process.env.ADMIN_TOKEN_SECRET, {expiresIn: "24h"});
                    res.status(HTTP_CODE.OK);
                    res.json({
                        id: foundAdmin.id,
                        isSuperAdmin: foundAdmin.isSuperAdmin,
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
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}