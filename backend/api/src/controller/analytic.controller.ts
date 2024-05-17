import moment from 'moment';
import { Request, Response } from 'express';

import Analytic, { IAnalyticLight, IAnalyticObject } from '../model/analytic.model';
import { ErrorResponse, parseErrorInJson } from './utils/common';
import { DATE_CONFIG, HTTP_CODE } from '../config/server.config';


export const postAnalytic = async (
    req: Request<{}, {}, IAnalyticLight>, 
    res: Response<IAnalyticObject | ErrorResponse>
) => {
    try{
        const date = req.body.date ? moment.utc(req.body.date, DATE_CONFIG.DEFAULT_FORMAT) : null;
        const analytic = new Analytic(req.body.clientId, date, req.body.eventName, null);
        const result = await analytic.saveToDB();
        res.status(HTTP_CODE.OK);
        res.json(result);
    }catch(exception: any){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}