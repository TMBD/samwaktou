import express, { Request, Response } from 'express';

import * as analyticController from '../controller/analytic.controller';


const router = express.Router();

router.post("/", (req: Request, res: Response) => {
    analyticController.postAnalytic(req, res);
});

export default router;