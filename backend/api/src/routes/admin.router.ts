import express, { Request, Response } from 'express';
import { DeleteResult } from 'mongodb';
import { Moment } from 'moment';

import * as adminController from '../controller/admin.controller';
import { verifyAdminToken } from '../controller/utils/verify-token';
import { HTTP_CODE } from '../config/server.config';
import { AuthenticatedAdminRequest, IAdminLight, IAdminObject } from '../model/admin.model';
import { ErrorResponse } from '../controller/utils/common';
import { IUpdateOne } from '../model/db-crud';


const router = express.Router();

router.post("/", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{}, {}, IAdminLight>, 
    res: Response<IAdminObject | ErrorResponse>) => {
    if(req.authData?.isSuperAdmin){
        adminController.postAdmin(req, res);
    }else{
        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            success: false,
            message: "Access denied !",
            details: "Only super admins have the right to add an admin !"
        })
    }
        
});

router.get("/:adminId", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{adminId: string}, {}, {}>, 
    res: Response<IAdminObject | ErrorResponse>) => {
    adminController.getAdmin(req, res);
});

router.get("/", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{}, {}, {
        surname?: string, 
        name?: string, 
        email?: string, 
        dateParams?: {date: Moment, gte: boolean}, 
        isSuperAdmin?: boolean,
        skip?: number, 
        limit?: number,}, {}>, 
    res: Response<IAdminObject[] | ErrorResponse>
) => {
    adminController.getManyAdmins(req, res);
});

router.delete("/:adminId", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{adminId: string}, {}, {}, {}>, 
    res: Response<DeleteResult | ErrorResponse>) => {
    if(req.authData?.isSuperAdmin){
        adminController.deleteAdmin(req, res);
    }else{
        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            success: false,
            message: "Access denied !",
            details: "Only super admins have the right to delete an admin !"
        })
    }
});

router.put("/:adminId", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{adminId: string}, {}, IAdminLight>, 
    res: Response<IUpdateOne | ErrorResponse>) => {
    if((req.authData?.isSuperAdmin) || (req.authData && req.authData.id == req.params?.adminId)){
        adminController.updateAdmin(req, res);
    }else{
        res.status(HTTP_CODE.ACCESS_DENIED_ERROR);
        res.json({
            success: false,
            message: "Access denied !",
            details: "Can't modify informations of another admin unless you are a superAdmin !"
        })
    }
});

router.put("/password/:adminId", verifyAdminToken, (
    req: AuthenticatedAdminRequest<{adminId: string}, {}, {password: string, newPassword: string}>, 
    res: Response<IUpdateOne | ErrorResponse>) => {
    adminController.updateAdminPassword(req, res);
});

router.post("/login", (
    req: Request<{}, {}, {email: string, password: string}>, 
    res: Response<{id: string, isSuperAdmin: boolean, token: string} | ErrorResponse>
) => {
    adminController.loginAdmin(req, res);
});

export default router;