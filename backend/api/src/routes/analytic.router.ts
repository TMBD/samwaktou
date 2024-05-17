import express, { Request, Response } from 'express';

import * as analyticController from '../controller/analytic.controller';
import { IAnalyticLight, IAnalyticObject } from '../model/analytic.model';
import { ErrorResponse } from '../controller/utils/common';


const router = express.Router();

router.post("/", (
    req: Request<{}, {}, IAnalyticLight>, 
    res: Response<IAnalyticObject | ErrorResponse>) => {
    analyticController.postAnalytic(req, res);
});

export default router;