let jwt = require("jsonwebtoken");
require("dotenv/config");
const CONFIG = require("../config/server_config");
let requestValidator = require("./utils/user/user_request_validator");
const User = require("../model/User");

let postUser = async (req, res) => {
    let reqValidation = requestValidator.validatePostUserRequest(req.body);
    if(!reqValidation.error){
        const foundUser = await User.findOneUserFromDBByUsername(req.body.username);
        if(foundUser.success){
            if(foundUser.user === null){
                let email = req.body.email ? req.body.email : null;
                let interestKeywords = req.body.interestKeywords ? req.body.interestKeywords : [];
                let user = new User(req.body.username, req.body.tel, email, interestKeywords, undefined, undefined);
                let result = await user.saveToDB();
                if(result.success){
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json(result.data);
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
                    message: "A user with this username alrady exist !"
                });
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: foundUser.message,
                details: "An error has occured while trying to verify if the user with this username exists or not !"
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}


let getUser = async (req, res) => {
    if(req.params.userId){
        let findUserResult = await User.findOneUserFromDBById(req.params.userId);
        if(findUserResult.success){
            if(findUserResult.user === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({});
            }else{
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(findUserResult.user);
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findUserResult.message,
                details: findUserResult.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json({
            message: "BAD REQUEST ERROR, PLEASE VERIFY YOUR REQUEST AND ENSURE THAT ALL THE FIELDS ARE SETUP WELL !", 
            details: "No user id found !"
        });
    }
}


let getManyUsers = async(req, res) => {
    let reqValidation = requestValidator.validateGetUserRequest(req.body);
    if(!reqValidation.error){
        let limitUserToFind = (req.body.limit) ? req.body.limit : CONFIG.USER_GET_PARAMS.DEFAULT_LIMIT_NUMBER;
        let skipUserToFind = (req.body.skip) ? req.body.skip : CONFIG.USER_GET_PARAMS.DEFAULT_SKIP_NUMBER;
        let findUsersResults = await User.getUsers(skipUserToFind, limitUserToFind);
        if(findUsersResults.success){
            if(findUsersResults.users === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({});
            }else{
                res.status(CONFIG.HTTP_CODE.OK);
                res.json(findUsersResults.users);
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findUsersResults.message,
                details: findUsersResults.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}



let deleteUser = async (req, res) => {
    if(req.isAdmin || (req.token && req.token._id == req.params.userId)){
        let findUserResult = await User.findOneUserFromDBById(req.params.userId);
        if(findUserResult.success){
            if(findUserResult.user === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    message: "Couldn't delete user !",
                    details: "No user with this _id has been found in the database !"
                });
            }else{
                let deleteResult = await User.deleteFromDB(req.params.userId);
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
                message: findUserResult.message,
                details: findUserResult.details
            });
        } 
    }else{
        res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Acces denied !",
            details: "Can't delete another user !"
        });
    }
    
}


let updateUser = async (req, res) => {
    let reqValidation = requestValidator.validateUpdateUserRequest(req.body);
    if(!reqValidation.error){
        if(req.token && (req.token._id == req.body._id)){
            let findUserResult = await User.findOneUserFromDBById(req.body._id);
            if(findUserResult.success){
                if(findUserResult.user === null){
                    res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        message: "Couldn't update user !",
                        details: "No user with this _id has been found in the database !"
                    });
                }else{
                    let findIfUsernameExistResult = await User.findOneUserFromDBByUsername(req.body.username);
                    if(findIfUsernameExistResult.success){
                        if(findIfUsernameExistResult.user === null || req.body.username == findUserResult.user.username){
                            let email = req.body.email ? req.body.email : findUserResult.user.email;
                            let interestKeywords = req.body.interestKeywords ? req.body.interestKeywords : findUserResult.user.interestKeywords;
                            let user = new User(req.body.username, req.body.tel, email, interestKeywords, findUserResult.user.date, findUserResult.user._id);
                            let updateResult = await user.updateToDB();
                            if(updateResult.success){
                                const token = jwt.sign({_id: findUserResult.user._id, username: req.body.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "1h"});
                                res.header("auth-token", token);
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
                                message: "Couldn't update user !",
                                details: "A user with this username already existe in the database !"
                            });
                        }
                    }else{
                        res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                        res.json({
                            message: findIfUsernameExistResult.message,
                            details: "This error occured while trying to search if a user with the same username existe in the database !"
                        });
                    }
                }
            }else{
                res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
                res.json({
                    message: findUserResult.message,
                    details: findUserResult.details
                });
            }
        }else{
            res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
            res.json({
                message: "Acces denied !",
                details: "Can't modify informations of another user !"
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}



let loginUser = async (req, res) => {
    let reqValidation = requestValidator.validateLoginUserRequest(req.body);
    if(!reqValidation.error){
        let findUserResult = await User.findOneUserFromDBByUsername(req.body.username);
        if(findUserResult.success){
            if(findUserResult.user === null){
                res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                res.json({
                    message: "Invalid username !"
                });
            }else{
                const valideUser = req.body.tel == findUserResult.user.tel;
                if(valideUser){
                    const token = jwt.sign({_id: findUserResult.user._id, username: findUserResult.user.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "1h"});
                    res.header("auth-token", token);
                    res.status(CONFIG.HTTP_CODE.OK);
                    res.json({
                        _id: findUserResult.user._id,
                        username: findUserResult.user.username
                    });
                }else{
                    res.status(CONFIG.HTTP_CODE.PAGE_NOT_FOUND_ERROR);
                    res.json({
                        message: "Invalid telephone Number !"
                    });
                }
            }
        }else{
            res.status(CONFIG.HTTP_CODE.INTERNAL_SERVER_ERROR);
            res.json({
                message: findUserResult.message,
                details: findUserResult.details
            });
        }
    }else{
        res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
        res.json(reqValidation.error.details);
    }
}

exports.postUser = postUser;
exports.getUser = getUser;
exports.getManyUsers = getManyUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.loginUser = loginUser;