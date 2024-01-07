const jwt = require("jsonwebtoken");
const CONFIG = require("../../config/server.config");

const verifyAdminToken = (req, res, next) => {
    const token = req.header("auth-token");
    if(!token){
        res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "You need to login before !"
        })
    }else{
        try {
            const verifiedToken = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET);
            const newToken = jwt.sign({_id: verifiedToken._id, isSuperAdmin: verifiedToken.isSuperAdmin}, process.env.ADMIN_TOKEN_SECRET, {expiresIn: "24h"});
            res.header("auth-token", newToken);
            const verifiedNewToken = jwt.verify(newToken, process.env.ADMIN_TOKEN_SECRET);
            req.token = verifiedNewToken;
            next();
        } catch (veriryTokenError) {
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                message: "Invalid token !",
                details: "Invalid token, please login !"
            })
        }
    }
}


const verifyUserToken = (req, res, next) => {
    const token = req.header("auth-token");
    if(!token){
        res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "You need to login before !"
        })
    }else{
        try {
            const verifiedToken = jwt.verify(token, process.env.USER_TOKEN_SECRET);
            const newToken = jwt.sign({_id: verifiedToken._id, username: verifiedToken.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "24h"});
            res.header("auth-token", newToken);
            const verifiedNewToken = jwt.verify(newToken, process.env.USER_TOKEN_SECRET);
            req.token = verifiedNewToken;
            next();
        } catch (veriryTokenError) {
            res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
            res.json({
                message: "Invalid token !",
                details: "Invalid token, please login !"
            })
        }
    }
}


const verifyTokenForDeleteUser = (req, res, next) => {
    const token = req.header("auth-token");
    if(!token){
        res.status(CONFIG.HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "You need to login before !"
        })
    }else{
        try {
            const verifiedToken = jwt.verify(token, process.env.USER_TOKEN_SECRET);
            const newToken = jwt.sign({_id: verifiedToken._id, username: verifiedToken.username}, process.env.USER_TOKEN_SECRET, {expiresIn: "24h"});
            res.header("auth-token", newToken);
            const verifiedNewToken = jwt.verify(newToken, process.env.USER_TOKEN_SECRET);
            req.token = verifiedNewToken;
            req.isAdmin = false;
            
        } catch (veriryUserTokenError) {
            try {
                const verifiedToken = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET);
                const newToken = jwt.sign({_id: verifiedToken._id, isSuperAdmin: verifiedToken.isSuperAdmin}, process.env.ADMIN_TOKEN_SECRET, {expiresIn: "24h"});
                res.header("auth-token", newToken);
                const verifiedNewToken = jwt.verify(newToken, process.env.ADMIN_TOKEN_SECRET);
                req.token = verifiedNewToken;
                req.isAdmin = true;
            } catch (veriryAdminTokenError) {
                res.status(CONFIG.HTTP_CODE.BAD_REQUEST_ERROR);
                res.json({
                    message: "Invalid token !",
                    details: "Invalid token, please login !"
                })
            }
            
        } finally{
            next();
        }
    }
}


exports.verifyAdminToken = verifyAdminToken;
exports.verifyUserToken = verifyUserToken;
exports.verifyTokenForDeleteUser = verifyTokenForDeleteUser;