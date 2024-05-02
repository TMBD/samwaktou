import moment from 'moment';

import Analytic from '../model/analytic.model';
import { parseErrorInJson } from './utils/utilities';
import { DATE_CONFIG, HTTP_CODE } from '../config/server.config';


export const postAnalytic = async (req, res) => {
    try{
        var analytic = new Analytic(req.body.clientId, moment.utc(req.body.date, DATE_CONFIG.DEFAULT_FORMAT), req.body.eventName);
        let result = await analytic.saveToDB();
        res.status(HTTP_CODE.OK);
        res.json(result.data);
    }catch(exception){
        res.status(exception.httpCode ? exception.httpCode : HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.json(parseErrorInJson(exception));
    }
}