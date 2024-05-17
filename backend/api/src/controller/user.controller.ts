import jwt from 'jsonwebtoken';
import _ from 'lodash';
import moment, { Moment } from 'moment';
import { DeleteResult } from 'mongodb';

import { DATE_CONFIG, HTTP_CODE, USER_GET_PARAMS } from '../config/server.config';
import { ErrorResponse, parseErrorInJson } from './utils/common';
import User, { AuthenticatedUserRequest, IUserLight, IUserObject } from '../model/user.model';
import { 
    validatePostUserRequest, 
    validateGetUserRequest, 
    validateUpdateUserRequest, 
    validateLoginUserRequest 
} from './utils/user/user-request-validator';
import { Request, Response } from 'express';
import { AuthenticatedAdminRequest } from '../model/admin.model';
import { IUpdateOne } from '../model/db-crud';


export const postUser = async (
    req: Request<{}, {}, IUserLight>, 
    res: Response<IUserObject | ErrorResponse>): Promise<void> => {
    try{
        const reqValidation = validatePostUserRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let foundUser: IUserObject;
            try{ //we use a dedicated try catch because an exception here has to be treated differently
                foundUser = await User.findOneUserFromDBByUsername(req.body.username);
            }catch(exception: any){
                res.status(HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    success: false,
                    reason: "An error has occured while trying to verify if a user with this username exists or not !",
                    message: "Une erreur s'est produite lors de la vérification des informations !",
                    details: exception
                });
            }
            if(foundUser){
                res.status(HTTP_CODE.BAD_REQUEST_ERROR);
                res.json({
                    success: false,
                    reason: "A user with this username already exist.",
                    message: "Cet nom d'utilisateur existe déjà.",
                    details: "Found a user with this username."
                });
            } else {
                const email = req.body.email ? req.body.email : null;
                const user = new User(req.body.username, req.body.tel, email, moment.utc(req.body.date, DATE_CONFIG.DEFAULT_FORMAT), null);
                const savedUser = await user.saveToDB();
                res.status(HTTP_CODE.OK);
                res.json(savedUser);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getUser = async (
    req: Request<{userId: string}, {}, {}>, 
    res: Response<IUserObject | ErrorResponse>): Promise<void> => {
    try{
        if(!req.params.userId){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "No user id found !",
                message: "Utilisateur introuvable.", 
                details: "User id is null."
            });
        } else {
            const foundUser = await User.findOneUserFromDBById(req.params.userId);
            if(!foundUser){
                res.status(HTTP_CODE.OK);
                res.json(null);
            }else{
                res.status(HTTP_CODE.OK);
                res.json(foundUser);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const getManyUsers = async (
    req: Request<{}, {}, {
        skip?: number, 
        limit?: number, 
        username?: string, 
        tel?: string, 
        email?: string, 
        dateParams?: {date: Moment, gte: boolean}}, {}>, 
    res: Response<IUserObject[] | ErrorResponse>): Promise<void> => {
    try{
        const reqValidation = validateGetUserRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            const limitUserToFind = (req.body.limit) ? req.body.limit : USER_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
            const skipUserToFind = (req.body.skip) ? req.body.skip : USER_GET_PARAMS.DEFAULT_SKIP_NUMBER;
            const foundUsers = await User.getUsers(req.body.username, req.body.tel, req.body.email, req.body.dateParams, skipUserToFind, limitUserToFind);
            if(!foundUsers){
                res.status(HTTP_CODE.OK);
                res.json([]);
            }else{
                res.status(HTTP_CODE.OK);
                res.json(foundUsers);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const deleteUser = async (
    req: AuthenticatedUserRequest<{userId: string}, {}, {}, {}> & AuthenticatedAdminRequest<{userId: string}, {}, {}, {}>, 
    res: Response<DeleteResult | ErrorResponse>
): Promise<void> => {
    try{
        if(!req.authData?.isAdmin && req.authData?.id !== req.params.userId){
            res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
            res.json({
                success: false,
                reason: "Access denied !",
                message: "Action non autorisée !",
                details: "A user is not allowed to delete an account of another user"
            });
        } else {
            const foundUser = await User.findOneUserFromDBById(req.params.userId);
            if(!foundUser){
                res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    success: false,
                    reason: "No user with this id found !",
                    message: "Utilisateur introuvable.", 
                    details: "User doesn't exist."
                });
            } else {
                const deleteResult = await User.deleteFromDB(req.params.userId);
                res.status(HTTP_CODE.OK);
                res.json(deleteResult);
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}

export const updateUser = async (
    req: AuthenticatedUserRequest<{userId: string}, {}, IUserLight>, 
    res: Response<IUpdateOne | ErrorResponse>): Promise<void> => {
    try{
        const reqValidation = validateUpdateUserRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            if(req.authData?.id && req.authData?.id !== req.params.userId){
                res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
                res.json({
                    success: false,
                    reason: "Acces denied !",
                    message: "Action non autorisée !",
                    details: "Not allowed to update another user's data !"
                });
            } else {
                const foundUser = await User.findOneUserFromDBById(req.params.userId);
                if(!foundUser){
                    res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        success: false,
                        reason: "No user with this id found !",
                        message: "Utilisateur introuvable.", 
                        details: "No user found for update"
                    });
                }else{
                    let isUsernameUnique = req.body.username === foundUser.username;
                    try{
                        if(!isUsernameUnique){
                            isUsernameUnique = !(await User.findOneUserFromDBByUsername(req.body.username));
                        }
                    }catch(exception: any){
                        res.status(HTTP_CODE.INTERNAL_SERVER_ERROR);
                        res.json({
                            success: false,
                            reason: "An error has occured while trying to verify if a user with this username exists or not !",
                            message: "Une erreur s'est produite lors de la validation des informations !",
                            details: exception
                        });
                    }
                    if(isUsernameUnique){
                        const tel = req.body.tel ? req.body.tel : foundUser.tel;
                        const email = req.body.email ? req.body.email : foundUser.email;
                        const user = new User(req.body.username, tel, email, foundUser.date, foundUser.id);
                        const updateResult = await user.updateToDB();
                        const token = jwt.sign({id: user.id, username: user.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "24h"});
                        res.header("auth-token", token);
                        res.status(HTTP_CODE.OK);
                        res.json(updateResult);
                    }else{
                        res.status(HTTP_CODE.BAD_REQUEST_ERROR);
                        res.json({
                            success: false,
                            reason: "A user with this username already exist.",
                            message: "Ce nom d'utilisateur existe déjà.",
                            details: "Found a user with this username."
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

export const loginUser = async (
    req: Request<{}, {}, {username: string, tel: string}>, 
    res: Response<{id: string, token: string} | ErrorResponse>): Promise<void> => {
    try{
        const reqValidation = validateLoginUserRequest(req.body);
        if(reqValidation.error){
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            const foundUser = await User.findOneUserFromDBByUsername(req.body.username);
            
            if(!foundUser){
                res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    success: false,
                    reason: "Invalid username or phone number.",
                    message: "Nom d'utilisateur ou numéro de téléphone incorrect.",
                    details: "The username or the phone number doesn't match."
                });
            }else{
                if(req.body.tel === foundUser.tel){
                    const token = jwt.sign({id: foundUser.id, username: foundUser.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "24h"});
                    res.status(HTTP_CODE.OK);
                    res.json({
                        id: foundUser.id,
                        token: token
                    });
                }else{
                    res.status(HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        success: false,
                        reason: "Invalid username or phone number.",
                        message: "Nom d'utilisateur ou numéro de téléphone incorrect.",
                        details: "The username or the phone number doesn't match."
                    });
                }
            }
        }
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}