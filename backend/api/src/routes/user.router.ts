import express, { Response, Request } from 'express';

import * as userController from '../controller/user.controller';
import {
    verifyUserToken, 
    verifyAdminToken, 
    verifyTokenForDeleteUser
} from '../controller/utils/verify-token';


const router = express.Router();

router.post("/", (req: Request, res: Response) => {
    userController.postUser(req, res);  
});

router.get("/:userId", (req: Request, res: Response) => {
    userController.getUser(req, res);
});

router.get("/", verifyAdminToken, (req: Request, res: Response) => {
    userController.getManyUsers(req, res);
});

router.delete("/:userId", verifyTokenForDeleteUser, (req: Request, res: Response) => {
    userController.deleteUser(req, res);
});

router.put("/:userId", verifyUserToken, (req: Request, res: Response) => {
        userController.updateUser(req, res);
});

router.post("/login", (req: Request, res: Response) => {
    userController.loginUser(req, res);
});

export default router;