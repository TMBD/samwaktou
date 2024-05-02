import jwt, { JwtPayload } from "jsonwebtoken";

import { HTTP_CODE } from "../../config/server.config";


export const verifyAdminToken = (req, res, next) => {
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
            const verifiedToken = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET) as JwtPayload;
            const newToken = jwt.sign({_id: verifiedToken.id, isSuperAdmin: verifiedToken.isSuperAdmin}, process.env.ADMIN_TOKEN_SECRET, {expiresIn: "24h"});
            res.header("auth-token", newToken);
            const verifiedNewToken = jwt.verify(newToken, process.env.ADMIN_TOKEN_SECRET);
            req.token = verifiedNewToken;
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


export const verifyUserToken = (req, res, next) => {
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
            const verifiedToken = jwt.verify(token, process.env.USER_TOKEN_SECRET) as JwtPayload;
            const newToken = jwt.sign({_id: verifiedToken._id, username: verifiedToken.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "24h"});
            res.header("auth-token", newToken);
            const verifiedNewToken = jwt.verify(newToken, process.env.USER_TOKEN_SECRET);
            req.token = verifiedNewToken;
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


export const verifyTokenForDeleteUser = (req, res, next) => {
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
            const verifiedToken = jwt.verify(token, process.env.USER_TOKEN_SECRET) as JwtPayload;
            const newToken = jwt.sign({_id: verifiedToken._id, username: verifiedToken.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "24h"});
            res.header("auth-token", newToken);
            const verifiedNewToken = jwt.verify(newToken, process.env.USER_TOKEN_SECRET);
            req.token = verifiedNewToken;
            req.isAdmin = false;
            
        } catch (veriryUserTokenError) {
            try {
                const verifiedToken = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET) as JwtPayload;
                const newToken = jwt.sign({_id: verifiedToken._id, isSuperAdmin: verifiedToken.isSuperAdmin}, process.env.ADMIN_TOKEN_SECRET, {expiresIn: "24h"});
                res.header("auth-token", newToken);
                const verifiedNewToken = jwt.verify(newToken, process.env.ADMIN_TOKEN_SECRET);
                req.token = verifiedNewToken;
                req.isAdmin = true;
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