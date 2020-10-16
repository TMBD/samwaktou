const jwt = require("jsonwebtoken");
const CONFIG = require("../../config/server_config");
require("dotenv/config");

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
            const verifiedToken = jwt.verify(token, process.env.TOKEN_SECRET);

            const newToken = jwt.sign({_id: verifiedToken._id, isSuperAdmin: verifiedToken.isSuperAdmin}, process.env.TOKEN_SECRET, {expiresIn: "30m"});
            res.header("auth-token", newToken);
            const verifiedNewToken = jwt.verify(newToken, process.env.TOKEN_SECRET);
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


exports.verifyAdminToken = verifyAdminToken;