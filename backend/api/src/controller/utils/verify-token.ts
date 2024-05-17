import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Response } from "express";

import { HTTP_CODE } from "../../config/server.config";
import { AuthenticatedAdminRequest } from "../../model/admin.model";
import { AuthenticatedUserRequest } from "../../model/user.model";


const DEFAULT_JWT_DURATION = '24h';
const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET!
const userTokenSecret = process.env.USER_TOKEN_SECRET!

type ExcludeWideProperties<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};

export interface IAdminJwtPayload extends ExcludeWideProperties<JwtPayload> {
    id: string,
    isSuperAdmin: boolean
};

export interface IUserJwtPayload extends ExcludeWideProperties<JwtPayload> {
    id: string,
    username: string
};

export const verifyAdminToken = (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
    const token = req.header("auth-token");
    if(!token){
        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            reason: "Access denied !",
            message: "Vous devez vous authentifier.",
            details: "You need to login before !"
        })
    }else{
        try {
            const verifiedToken = jwt.verify(token, adminTokenSecret) as IAdminJwtPayload;
            const newToken = jwt.sign({id: verifiedToken.id, isSuperAdmin: verifiedToken.isSuperAdmin}, adminTokenSecret, {expiresIn: DEFAULT_JWT_DURATION});
            res.header("auth-token", newToken);
            req.authData = verifiedToken;
            next();
        } catch (veriryTokenError) {
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                reason: "Invalid token !",
                message: "Veuillez-vous authentifier.",
                details: "Invalid token, please login !"
            })
        }
    }
}


export const verifyUserToken = (req: AuthenticatedUserRequest, res: Response, next: NextFunction): void => {
    const token = req.header("auth-token");
    if(!token){
        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            reason: "Access denied !",
            message: "Vous devez vous authentifier.",
            details: "You need to login before !"
        })
    }else{
        try {
            const verifiedToken = jwt.verify(token, userTokenSecret) as IUserJwtPayload;
            const newToken = jwt.sign({id: verifiedToken.id, username: verifiedToken.username}, userTokenSecret, {expiresIn: DEFAULT_JWT_DURATION});
            res.header("auth-token", newToken);
            req.authData = verifiedToken;
            next();
        } catch (veriryTokenError) {
            res.status(HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                reason: "Invalid token !",
                message: "Veuillez-vous authentifier.",
                details: "Invalid token, please login !"
            })
        }
    }
}


export const verifyTokenForDeleteUser = (req: AuthenticatedAdminRequest | AuthenticatedUserRequest, res: Response, next: NextFunction): void => {
    const token = req.header("auth-token");
    if(!token){
        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            reason: "Access denied !",
            message: "Vous devez vous authentifier.",
            details: "You need to login before !"
        })
    }else{
        try {
            const verifiedToken = jwt.verify(token, userTokenSecret) as IUserJwtPayload;
            const newToken = jwt.sign({id: verifiedToken.id, username: verifiedToken.username}, userTokenSecret, {expiresIn: DEFAULT_JWT_DURATION});
            res.header("auth-token", newToken);
            req.authData = {...verifiedToken, isAdmin: false};
            
        } catch (veriryUserTokenError) {
            try {
                const verifiedToken = jwt.verify(token, adminTokenSecret) as IAdminJwtPayload;
                const newToken = jwt.sign({id: verifiedToken.id, isSuperAdmin: verifiedToken.isSuperAdmin}, adminTokenSecret, {expiresIn: DEFAULT_JWT_DURATION});
                res.header("auth-token", newToken);
                req.authData = {...verifiedToken, isAdmin: true};
            } catch (veriryAdminTokenError) {
                res.status(HTTP_CODE.BAD_REQUEST_ERROR);
                res.json({
                    reason: "Invalid token !",
                    message: "Veuillez-vous authentifier.",
                    details: "Invalid token, please login !"
                })
            }
            
        } finally{
            next();
        }
    }
}