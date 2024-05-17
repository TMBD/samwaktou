import express, { Response, Request } from 'express';
import { DeleteResult } from 'mongodb';
import { Moment } from 'moment';

import * as userController from '../controller/user.controller';
import {
    verifyUserToken, 
    verifyAdminToken, 
    verifyTokenForDeleteUser
} from '../controller/utils/verify-token';
import { AuthenticatedUserRequest, IUserLight, IUserObject } from '../model/user.model';
import { ErrorResponse } from '../controller/utils/common';
import { AuthenticatedAdminRequest } from '../model/admin.model';
import { IUpdateOne } from '../model/db-crud';


const router = express.Router();

router.post("/", (
    req: Request<{}, {}, IUserLight>, 
    res: Response<IUserObject | ErrorResponse>) => {
    userController.postUser(req, res);  
});

router.get("/:userId", (
    req: Request<{userId: string}, {}, {}>, 
    res: Response<IUserObject | ErrorResponse>) => {
    userController.getUser(req, res);
});

router.get("/", verifyAdminToken, (req: Request<{}, {}, {
    skip?: number, 
    limit?: number, 
    username?: string, 
    tel?: string, 
    email?: string, 
    dateParams?: {date: Moment, gte: boolean}}, {}>, 
res: Response<IUserObject[] | ErrorResponse>) => {
    userController.getManyUsers(req, res);
});

router.delete("/:userId", verifyTokenForDeleteUser, (
    req: AuthenticatedUserRequest<{userId: string}, {}, {}, {}> & AuthenticatedAdminRequest<{userId: string}, {}, {}, {}>, 
    res: Response<DeleteResult | ErrorResponse>) => {
    userController.deleteUser(req, res);
});

router.put("/:userId", verifyUserToken, (
    req: AuthenticatedUserRequest<{userId: string}, {}, IUserLight>, 
    res: Response<IUpdateOne | ErrorResponse>) => {
        userController.updateUser(req, res);
});

router.post("/login", (
    req: Request<{}, {}, {username: string, tel: string}>, 
    res: Response<{id: string, token: string} | ErrorResponse>) => {
    userController.loginUser(req, res);
});

export default router;