import express, { Request, Response } from 'express';

import * as adminController from '../controller/admin.controller';
import { verifyAdminToken } from '../controller/utils/verify-token';
import { HTTP_CODE } from '../config/server.config';


const router = express.Router();

interface AuthenticatedRequest extends Request {
    token?: { 
        isSuperAdmin: boolean;
        _id?: string
    };
}

router.post("/", verifyAdminToken, (req: AuthenticatedRequest, res: Response) => {
    if(req.token?.isSuperAdmin){
        adminController.postAdmin(req, res);
    }else{
        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "Only super admins have the right to add an admin !"
        })
    }
        
});

router.get("/:adminId", verifyAdminToken, (req: AuthenticatedRequest, res: Response) => {
    adminController.getAdmin(req, res);
});

router.get("/", verifyAdminToken, (req: AuthenticatedRequest, res: Response) => {
    adminController.getManyAdmins(req, res);
});

router.delete("/:adminId", verifyAdminToken, (req: AuthenticatedRequest, res: Response) => {
    if(req.token?.isSuperAdmin){
        adminController.deleteAdmin(req, res);
    }else{
        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "Only super admins have the right to delete an admin !"
        })
    }
});

router.put("/:adminId", verifyAdminToken, (req: AuthenticatedRequest, res: Response) => {
    if((req.token?.isSuperAdmin) || (req.token && req.token._id == req.params?.adminId)){
        adminController.updateAdmin(req, res);
    }else{
        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            message: "Access denied !",
            details: "Can't modify informations of another admin unless you are a superAdmin !"
        })
    }
});

router.put("/password/:adminId", verifyAdminToken, (req: AuthenticatedRequest, res: Response) => {
    adminController.updateAdminPassword(req, res);
});

router.post("/login", (req: AuthenticatedRequest, res: Response) => {
    adminController.loginAdmin(req, res);
});

export default router;