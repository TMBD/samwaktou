let jwt = require("jsonwebtoken");
let _ = require("lodash");
const CONFIG = require("../config/server.config");
let requestValidator = require("./utils/user/user-request-validator");
const User = require("../model/user.model");

let postUser = async (req, res) => {
    try{
        let reqValidation = requestValidator.validatePostUserRequest(req.body);
        if(reqValidation.error){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let foundUser;
            try{ //we use a dedicated try catch because an exception here has to be treated differently
                foundUser = await User.findOneUserFromDBByUsername(req.body.username);
            }catch(exception){
                res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    success: false,
                    reason: "An error has occured while trying to verify if a user with this username exists or not !",
                    message: "Une erreur s'est produite lors de la vérification des informations !",
                    details: exception
                });
            }
            if(foundUser.user){
                res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
                res.json({
                    success: false,
                    reason: "A user with this username already exist.",
                    message: "Cet nom d'utilisateur existe déjà.",
                    details: "Found a user with this username."
                });
            } else {
                let email = req.body.email ? req.body.email : null;
                let user = new User(req.body.username, req.body.tel, email, req.body.date, undefined);
                let result = await user.saveToDB();
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(result.data);
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(exception);
    }
}

let getUser = async (req, res) => {
    try{
        if(!req.params.userId){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                sucess: false,
                reason: "No user id found !",
                message: "Utilisateur introuvable.", 
                details: "User id is null."
            });
        } else {
            let findUserResult = await User.findOneUserFromDBById(req.params.userId);
            if(!findUserResult.user){
                res.status(CONFIG.HTTP_CODE.OK);
                res.json({});
            }else{
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(findUserResult.user);
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(exception);
    }
}

let getManyUsers = async(req, res) => {
    try{
        let reqValidation = requestValidator.validateGetUserRequest(req.body);
        if(reqValidation.error){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let limitUserToFind = (req.body.limit) ? req.body.limit : CONFIG.USER_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
            let skipUserToFind = (req.body.skip) ? req.body.skip : CONFIG.USER_GET_PARAMS.DEFAULT_SKIP_NUMBER;
            let findUsersResults = await User.getUsers(req.body.username, req.body.tel, req.body.email, req.body.interestParams, req.body.dateParams, skipUserToFind, limitUserToFind);
            if(!findUsersResults.users){
                res.status(CONFIG.HTTP_CODE.OK);
                res.json({});
            }else{
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(findUsersResults.users);
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(exception);
    }
}

let deleteUser = async (req, res) => {
    try{
        if(!req.isAdmin && req.token?._id !== req.params.userId){
            res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
            res.json({
                success: false,
                reason: "Access denied !",
                message: "Action non autorisée !",
                details: "A user is not allowed to delete an account of another user"
            });
        } else {
            let findUserResult = await User.findOneUserFromDBById(req.params.userId);
            if(!findUserResult.user){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    sucess: false,
                    reason: "No user with this id found !",
                    message: "Utilisateur introuvable.", 
                    details: "User doesn't exist."
                });
            }else{
                let deleteResult = await User.deleteFromDB(req.params.userId);
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(deleteResult.data);
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(exception);
    }
}

let updateUser = async (req, res) => {
    try{
        let reqValidation = requestValidator.validateUpdateUserRequest(req.body);
        if(reqValidation.error){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            if(req.token?._id !== req.params.userId){
                res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
                res.json({
                    success: false,
                    reason: "Acces denied !",
                    message: "Action non autorisée !",
                    details: "Not allowed to update another user's data !"
                });
            } else {
                let findUserResult = await User.findOneUserFromDBById(req.params.userId);
                if(!findUserResult.user){
                    res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        sucess: false,
                        reason: "No user with this id found !",
                        message: "Utilisateur introuvable.", 
                        details: "No user found for update"
                    });
                }else{
                    let findIfUsernameExistResult;
                    try{
                        findIfUsernameExistResult = await User.findOneUserFromDBByUsername(req.body.username);
                    }catch(exception){
                        res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                        res.json({
                            success: false,
                            reason: "An error has occured while trying to verify if a user with this username exists or not !",
                            message: "Une erreur s'est produite lors de la validation des informations !",
                            details: exception
                        });
                    }
                    if(!findIfUsernameExistResult.user || req.body.username === findUserResult.user.username){
                        let tel = req.body.tel ? req.body.tel : findUserResult.user.tel;
                        let email = req.body.email ? req.body.email : findUserResult.user.email;
                        let user = new User(req.body.username, tel, email, findUserResult.user.date, findUserResult.user._id);
                        let updateResult = await user.updateToDB();
                        const token = jwt.sign({_id: findUserResult.user._id, username: req.body.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "10h"});
                        res.header("auth-token", token);
                        res.status(CONFIG.HTTP_CODE.OK);
                        res.json(updateResult.data);
                    }else{
                        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
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
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(exception);
    }
}

let loginUser = async (req, res) => {
    try{
        let reqValidation = requestValidator.validateLoginUserRequest(req.body);
        if(reqValidation.error){
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                success: false,
                reason: "Fields validation error !",
                message: "Données invalides. Veuillez renseigner correctement tous les champs !",
                details: reqValidation.error
            });
        } else {
            let findUserResult = await User.findOneUserFromDBByUsername(req.body.username);
            
            if(!findUserResult.user){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    success: false,
                    reason: "Invalid username or phone number.",
                    message: "Nom d'utilisateur ou numéro de téléphone incorrect.",
                    details: "The username or the phone number doesn't match."
                });
            }else{
                const valideUser = req.body.tel === findUserResult.user.tel;
                if(valideUser){
                    const token = jwt.sign({_id: findUserResult.user._id, username: findUserResult.user.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "24h"});
                    res.header("auth-token", token);
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json({
                        _id: findUserResult.user._id,
                        username: findUserResult.user.username,
                        tel: findUserResult.user.tel
                    });
                }else{
                    res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        success: false,
                        reason: "Invalid username or phone number.",
                        message: "Nom d'utilisateur ou numéro de téléphone incorrect.",
                        details: "The username or the phone number doesn't match."
                    });
                }
            }
        }
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(exception);
    }
}

exports.postUser = postUser;
exports.getUser = getUser;
exports.getManyUsers = getManyUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.loginUser = loginUser;